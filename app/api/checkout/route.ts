import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAuthPayload } from "@/app/lib/auth-session";
import { calculateCartTotals } from "@/app/lib/pricing";

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

  const totals = calculateCartTotals(cart.items, couponCode);

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new Error("STOCK_UNAVAILABLE");
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId: payload.userId,
          subtotal: totals.subtotal,
          tax: totals.tax,
          shipping: totals.shipping,
          discount: totals.discount,
          couponCode: totals.couponCode,
          total: totals.total,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          totals,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "STOCK_UNAVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          message: "One or more items no longer have enough stock.",
        },
        { status: 409 },
      );
    }

    console.error("Checkout error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to place order." },
      { status: 500 },
    );
  }
}
