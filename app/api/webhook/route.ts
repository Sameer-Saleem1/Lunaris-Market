import { stripe } from "@/app/lib/stripe";
import { Stripe } from "stripe";
import { prisma } from "@/app/lib/prisma";
import { sendOrderConfirmationEmail } from "@/app/lib/mail";

const finalizeOrder = async (session: Stripe.Checkout.Session) => {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    return;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
    },
  });

  if (!order || order.paymentStatus === "PAID") {
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
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

    if (updatedOrder && updatedOrder.user.email) {
      // Send order confirmation email
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
  } catch (error) {
    console.error("Stripe fulfillment error:", error);

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "FAILED",
        paymentStatus: "FAILED",
      },
    });
  }
};

const failOrder = async (session: Stripe.Checkout.Session) => {
  const orderId = session.metadata?.orderId;

  if (!orderId) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "FAILED",
      paymentStatus: "FAILED",
      stripePaymentIntentId: session.payment_intent
        ? String(session.payment_intent)
        : null,
      stripeCustomerId: session.customer ? String(session.customer) : null,
    },
  });
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await finalizeOrder(session);
  }

  if (event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    await finalizeOrder(session);
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await failOrder(session);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await failOrder(session);
  }

  return new Response("Webhook received", { status: 200 });
}
