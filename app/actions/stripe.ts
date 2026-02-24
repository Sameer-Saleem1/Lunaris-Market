"use server";

import { headers } from "next/headers";
import { stripe } from "@/app/lib/stripe";

type CheckoutSessionInput = {
    orderId: string;
    totalCents: number;
    itemCount: number;
};

export async function createCheckoutSession({
    orderId,
    totalCents,
    itemCount,
}: CheckoutSessionInput) {
    const origin = (await headers()).get("origin");

    if (!origin) {
        throw new Error("Missing request origin");
    }

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: "Lunaris Market Order",
                        description: `${itemCount} item${itemCount === 1 ? "" : "s"}`,
                    },
                    unit_amount: totalCents,
                },
                quantity: 1,
            },
        ],
        success_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout?canceled=1`,
        metadata: {
            orderId,
        },
    });

    return { url: session.url };
}