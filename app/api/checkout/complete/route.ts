import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@/app/lib/auth-session";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";
import { sendOrderConfirmationEmail } from "@/app/lib/mail";

/**
 * Manual payment completion endpoint for local testing without webhooks
 * In production, this is handled by Stripe webhooks
 */
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

  const { sessionId } = body as { sessionId?: string };

  if (!sessionId) {
    return NextResponse.json(
      { success: false, message: "Missing session ID." },
      { status: 400 },
    );
  }

  try {
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.orderId) {
      return NextResponse.json(
        { success: false, message: "Order ID not found in session." },
        { status: 400 },
      );
    }

    const orderId = session.metadata.orderId;

    // Verify order belongs to user
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: payload.userId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 },
      );
    }

    // If already paid, return success
    if (order.paymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: true,
          data: {
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            message: "Order already completed.",
          },
        },
        { status: 200 },
      );
    }

    // Check Stripe session status
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          success: false,
          message: "Payment not completed in Stripe.",
          data: {
            orderId: order.id,
            status: order.status,
            paymentStatus: order.paymentStatus,
            stripeStatus: session.payment_status,
          },
        },
        { status: 400 },
      );
    }

    // Complete the order
    await prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of order.items) {
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

      // Update order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentStatus: "PAID",
          stripePaymentIntentId: session.payment_intent
            ? String(session.payment_intent)
            : null,
          stripeCustomerId: session.customer ? String(session.customer) : null,
          paidAt: new Date(),
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { cart: { userId: order.userId } },
      });
    });

    // Fetch the updated order with all details for email
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    // Send order confirmation email
    if (updatedOrder && updatedOrder.user.email) {
      try {
        await sendOrderConfirmationEmail(
          updatedOrder.user.email,
          updatedOrder.user.name,
          {
            orderId: updatedOrder.id,
            items: updatedOrder.items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
            })),
            subtotal: updatedOrder.subtotal,
            tax: updatedOrder.tax,
            shipping: updatedOrder.shipping,
            discount: updatedOrder.discount,
            total: updatedOrder.total,
            paidAt: updatedOrder.paidAt!,
            couponCode: updatedOrder.couponCode,
          },
        );
        console.log(
          `Order confirmation email sent to ${updatedOrder.user.email}`,
        );
      } catch (emailError) {
        // Log the error but don't fail the order
        console.error("Failed to send order confirmation email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          status: "PAID",
          paymentStatus: "PAID",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Manual completion error:", error);

    if (error instanceof Error && error.message === "STOCK_UNAVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          message: "One or more items no longer have enough stock.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to complete payment." },
      { status: 500 },
    );
  }
}
