"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateCartTotals, CartTotals } from "@/app/lib/pricing";

type CartItem = {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
};

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCoupon = searchParams.get("coupon");

  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [couponInput, setCouponInput] = useState(initialCoupon ?? "");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(
    initialCoupon,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const loadCart = async (couponCode?: string | null) => {
    setLoading(true);
    try {
      const url = couponCode
        ? `/api/cart?coupon=${encodeURIComponent(couponCode)}`
        : "/api/cart";
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Unable to load checkout.");
      }

      const data = await response.json();
      const nextItems = data.data?.items ?? [];
      setItems(nextItems);
      setTotals(
        data.data?.totals ?? calculateCartTotals(nextItems, couponCode),
      );
      setAppliedCoupon(data.data?.totals?.couponCode ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load checkout.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }
        await loadCart(initialCoupon);
      } catch {
        router.push("/login");
      }
    };

    init();
  }, [initialCoupon, router]);

  const handleApplyCoupon = async () => {
    setError(null);
    await loadCart(couponInput);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couponCode: appliedCoupon ?? couponInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to place order.");
      }

      router.push(`/orders/${data.data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Checkout
            </p>
            <h1 className="font-display text-4xl">Confirm your order</h1>
            <p className="text-sm text-white/60">
              {loading ? "Loading items..." : `${totalQuantity} items`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/cart"
              className="rounded-full border border-white/20 px-5 py-2 text-sm"
            >
              Back to cart
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-2 text-sm"
            >
              Continue shopping
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
              Loading checkout...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
              Your cart is empty. Add items before checking out.
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
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
                          Qty {item.quantity} · ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/50">Subtotal</p>
                      <p className="text-lg font-semibold text-white">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {totals && (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="grid gap-2 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span>-${totals.discount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span>${totals.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Tax</span>
                      <span>${totals.tax.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Total
                    </p>
                    <p className="text-2xl font-semibold text-white">
                      ${totals.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={couponInput}
                      onChange={(event) => setCouponInput(event.target.value)}
                      placeholder="Coupon code"
                      className="h-10 flex-1 rounded-full border border-white/20 bg-transparent px-4 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white"
                    >
                      Apply
                    </button>
                    {appliedCoupon && (
                      <span className="text-xs text-emerald-200">
                        Applied {appliedCoupon}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#0b0d13] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {placingOrder ? "Placing order..." : "Place order"}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] text-white">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
