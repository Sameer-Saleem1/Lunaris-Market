"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateCartTotals, CartTotals } from "@/app/lib/pricing";

type CartItem = {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    stock: number;
    category?: { name: string } | null;
  };
};

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totals, setTotals] = useState<CartTotals | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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
        throw new Error("Unable to load cart.");
      }

      const data = await response.json();
      setItems(data.data?.items ?? []);
      setTotals(data.data?.totals ?? null);
      setAppliedCoupon(data.data?.totals?.couponCode ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load cart.");
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
        await loadCart();
      } catch {
        router.push("/login");
      }
    };

    init();
  }, [router]);

  const handleApplyCoupon = async () => {
    setApplyingCoupon(true);
    setError(null);

    try {
      await loadCart(couponInput);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleUpdateCartItem = async (productId: string, quantity: number) => {
    const prevItems = items;
    const nextItems = items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item,
      )
      .filter((item) => item.quantity > 0);

    setItems(nextItems);
    setTotals(calculateCartTotals(nextItems, appliedCoupon));
    setUpdatingProductId(productId);
    setError(null);

    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update cart.");
      }

      const removedProductId = data.data?.removedProductId as
        | string
        | null
        | undefined;
      const updatedItem = data.data?.item as
        | { productId: string; quantity: number }
        | null
        | undefined;

      if (removedProductId) {
        const filtered = nextItems.filter(
          (item) => item.productId !== removedProductId,
        );
        setItems(filtered);
        setTotals(calculateCartTotals(filtered, appliedCoupon));
      } else if (updatedItem) {
        const updated = nextItems.map((item) =>
          item.productId === updatedItem.productId
            ? { ...item, quantity: updatedItem.quantity }
            : item,
        );
        setItems(updated);
        setTotals(calculateCartTotals(updated, appliedCoupon));
      }
    } catch (err) {
      setItems(prevItems);
      setTotals(calculateCartTotals(prevItems, appliedCoupon));
      setError(err instanceof Error ? err.message : "Unable to update cart.");
    } finally {
      setUpdatingProductId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Your cart
            </p>
            <h1 className="font-display text-4xl">Ready for checkout</h1>
            <p className="text-sm text-white/60">
              {loading ? "Loading items..." : `${totalQuantity} items`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-2 text-sm"
            >
              Back to catalog
            </Link>
            <Link
              href="/checkout"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b0d13]"
            >
              Checkout
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4">
            {loading && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                Loading cart...
              </div>
            )}
            {!loading && items.length === 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                Your cart is empty. Browse the catalog to add products.
              </div>
            )}
            {!loading &&
              items.map((item) => (
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
                      <p className="text-sm uppercase tracking-[0.2em] text-white/50">
                        {item.product.category?.name ?? "Curated"}
                      </p>
                      <h3 className="font-display text-xl text-white">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-white/60">
                        ${item.product.price.toFixed(2)} each
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartItem(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          disabled={
                            updatingProductId === item.productId ||
                            item.quantity <= 0
                          }
                          className="h-8 w-8 rounded-full border border-white/30 text-sm font-semibold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="min-w-[2rem] text-center text-sm text-white/70">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateCartItem(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          disabled={
                            updatingProductId === item.productId ||
                            item.quantity >= item.product.stock
                          }
                          className="h-8 w-8 rounded-full border border-white/30 text-sm font-semibold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
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

          {!loading && items.length > 0 && totals && (
            <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
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
                  disabled={applyingCoupon}
                  className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {applyingCoupon ? "Applying" : "Apply"}
                </button>
                {appliedCoupon && (
                  <span className="text-xs text-emerald-200">
                    Applied {appliedCoupon}
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
