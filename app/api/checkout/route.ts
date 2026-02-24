import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthPayload } from "@/app/lib/auth-session";
import { calculateCartTotals } from "@/app/lib/pricing";
import { stripe } from "@/app/lib/stripe";

const parseCouponCode = (value: unknown): string | null => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export async function POST(request: NextRequest) {
  const payload = getAuthPayload(request);

  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const couponCode = parseCouponCode(
    body && typeof body === "object"
      ? (body as { couponCode?: unknown }).couponCode
      : undefined,
  );

  const cart = await prisma.cart.findFirst({
    where: { userId: payload.userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
            },
          },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return NextResponse.json(
      { success: false, message: "Cart is empty." },
      { status: 400 },
    );
  }

  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more items no longer have enough stock.",
        },
        { status: 409 },
      );
    }
  }

  const totals = calculateCartTotals(cart.items, couponCode);
  const origin =
    request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!origin) {
    return NextResponse.json(
      { success: false, message: "Missing app URL configuration." },
      { status: 500 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true },
  });

  try {
    const order = await prisma.order.create({
      data: {
        userId: payload.userId,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shipping,
        discount: totals.discount,
        couponCode: totals.couponCode,
        total: totals.total,
        status: "PENDING",
        paymentStatus: "UNPAID",
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          })),
        },
      },
    });

    let sessionUrl: string | null = null;

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Lunaris Market Order",
                description: `${cart.items.length} item${
                  cart.items.length === 1 ? "" : "s"
                }`,
              },
              unit_amount: Math.round(totals.total * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?canceled=1`,
        customer_email: user?.email ?? undefined,
        metadata: {
          orderId: order.id,
          userId: payload.userId,
        },
        payment_intent_data: {
          metadata: {
            orderId: order.id,
            userId: payload.userId,
          },
        },
      });

      sessionUrl = session.url ?? null;

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });
    } catch (error) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", paymentStatus: "FAILED" },
      });

      throw error;
    }

    if (!sessionUrl) {
      return NextResponse.json(
        { success: false, message: "Unable to start checkout." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          totals,
          url: sessionUrl,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Checkout error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to start checkout." },
      { status: 500 },
    );
  }
}
