"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
};

type Order = {
  id: string;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  couponCode?: string | null;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
};

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Order not found.");
        }

        const data = await response.json();
        setOrder(data.data as Order);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Order not found.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      loadOrder();
    }
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] text-white">
        Loading your order...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="font-display text-3xl">Order not found</h1>
          <p className="mt-4 text-sm text-white/60">
            {error || "We could not locate that order."}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#0b0d13]"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Order confirmed
            </p>
            <h1 className="font-display text-4xl">Thank you for your order</h1>
            <p className="text-sm text-white/60">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.3em] text-emerald-200">
              Payment {order.paymentStatus}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-5 py-2 text-sm"
          >
            Continue shopping
          </Link>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                    {item.product.imageUrl ? (
                      <Image
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-display text-white/60">
                        {item.product.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-white">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-white/60">
                      Qty {item.quantity} · ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Subtotal</p>
                  <p className="text-lg font-semibold text-white">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-2 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>${order.shipping.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Total
              </p>
              <p className="text-2xl font-semibold text-white">
                ${order.total.toFixed(2)}
              </p>
            </div>
            {order.couponCode && (
              <p className="text-xs text-emerald-200">
                Coupon applied: {order.couponCode}
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
