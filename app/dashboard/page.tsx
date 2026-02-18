"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  imageUrl?: string | null;
  category: Category;
};

type AuthData = {
  email: string;
  name?: string;
  role: "USER" | "ADMIN";
};

export default function DashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [cartItemStock, setCartItemStock] = useState<Record<string, number>>(
    {},
  );
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(
    null,
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedProducts = products.slice(startIndex, startIndex + itemsPerPage);
  const cartProducts = products.filter((product) => cartItems[product.id]);
  const cartTotal = cartProducts.reduce(
    (total, product) => total + product.price * cartItems[product.id],
    0,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    requestAnimationFrame(() => {
      const catalog = document.getElementById("catalog");
      if (catalog) {
        catalog.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setProductsLoading(true);
      try {
        const authRes = await fetch("/api/auth/me");
        if (!authRes.ok) {
          router.push("/login");
          return;
        }

        const authData = await authRes.json();
        setAuth(authData.data);

        const productsRes = await fetch("/api/products");
        const productsData = await productsRes.json();
        setProducts(productsData.data || []);

        const cartRes = await fetch("/api/cart");
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const items = cartData.data?.items ?? [];
          const itemMap = items.reduce(
            (
              acc: Record<string, number>,
              item: { productId: string; quantity: number },
            ) => {
              acc[item.productId] = item.quantity;
              return acc;
            },
            {},
          );
          const stockMap = items.reduce(
            (
              acc: Record<string, number>,
              item: { productId: string; product?: { stock?: number } },
            ) => {
              if (typeof item.product?.stock === "number") {
                acc[item.productId] = item.product.stock;
              }
              return acc;
            },
            {},
          );
          setCartItems(itemMap);
          setCartItemStock(stockMap);
          setCartQuantity(cartData.data?.totalQuantity ?? 0);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load your dashboard.",
        );
      } finally {
        setProductsLoading(false);
        setCartLoading(false);
      }
    };

    loadData();
  }, [router]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0) {
      return;
    }

    const prevCartItems = { ...cartItems };
    const prevCartQuantity = cartQuantity;
    const prevCartItemStock = { ...cartItemStock };
    const prevItemQty = cartItems[product.id] ?? 0;
    const nextItemQty = prevItemQty + 1;

    setCartItems((prev) => ({ ...prev, [product.id]: nextItemQty }));
    setCartQuantity(prevCartQuantity + 1);
    if (cartItemStock[product.id] === undefined) {
      setCartItemStock((prev) => ({ ...prev, [product.id]: product.stock }));
    }

    setAddingProductId(product.id);
    setCartError(null);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add to cart.");
      }

      const item = data.data?.item as
        | { productId: string; quantity: number; product?: { stock?: number } }
        | undefined;

      if (item) {
        setCartItems((prev) => ({
          ...prev,
          [item.productId]: item.quantity,
        }));
        const stockValue = item.product?.stock;
        if (typeof stockValue === "number") {
          setCartItemStock((prev) => ({
            ...prev,
            [item.productId]: stockValue,
          }));
        }
      }

      if (typeof data.data?.totalQuantity === "number") {
        setCartQuantity(data.data.totalQuantity);
      }
    } catch (err) {
      setCartItems(prevCartItems);
      setCartQuantity(prevCartQuantity);
      setCartItemStock(prevCartItemStock);
      setCartError(
        err instanceof Error ? err.message : "Unable to add to cart.",
      );
    } finally {
      setAddingProductId(null);
    }
  };

  const handleUpdateCartItem = async (productId: string, quantity: number) => {
    const prevCartItems = { ...cartItems };
    const prevCartQuantity = cartQuantity;
    const prevCartItemStock = { ...cartItemStock };
    const prevItemQty = cartItems[productId] ?? 0;
    const nextItemQty = Math.max(0, quantity);
    const nextCartQuantity = prevCartQuantity + (nextItemQty - prevItemQty);

    setCartItems((prev) => {
      if (nextItemQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }

      return { ...prev, [productId]: nextItemQty };
    });
    setCartQuantity(Math.max(0, nextCartQuantity));

    setUpdatingProductId(productId);
    setCartError(null);

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

      const item = data.data?.item as
        | { productId: string; quantity: number; product?: { stock?: number } }
        | null
        | undefined;
      const removedProductId = data.data?.removedProductId as
        | string
        | null
        | undefined;

      if (removedProductId) {
        setCartItems((prev) => {
          const next = { ...prev };
          delete next[removedProductId];
          return next;
        });
        setCartItemStock((prev) => {
          const next = { ...prev };
          delete next[removedProductId];
          return next;
        });
      } else if (item) {
        setCartItems((prev) => ({
          ...prev,
          [item.productId]: item.quantity,
        }));
        const stockValue = item.product?.stock;
        if (typeof stockValue === "number") {
          setCartItemStock((prev) => ({
            ...prev,
            [item.productId]: stockValue,
          }));
        }
      }

      if (typeof data.data?.totalQuantity === "number") {
        setCartQuantity(data.data.totalQuantity);
      }
    } catch (err) {
      setCartItems(prevCartItems);
      setCartQuantity(prevCartQuantity);
      setCartItemStock(prevCartItemStock);
      setCartError(
        err instanceof Error ? err.message : "Unable to update cart.",
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="font-display text-3xl">Dashboard unavailable</h1>
          <p className="mt-4 text-sm text-white/60">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#0b0d13]"
          >
            View storefront
          </Link>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] text-white">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Welcome back
            </p>
            <h1 className="font-display text-4xl">
              {auth.name ? `Hi ${auth.name}` : "Your dashboard"}
            </h1>
            <p className="text-sm text-white/60">Signed in as {auth.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {auth.role === "ADMIN" && (
              <Link
                href="/admin/dashboard"
                className="rounded-full border border-white/20 px-5 py-2 text-sm"
              >
                Admin panel
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="rounded-full border border-white/20 px-5 py-2 text-sm text-white/80"
            >
              Cart {cartLoading ? "..." : `${cartQuantity} items`}
            </button>
            <Link
              href="/dashboard#catalog"
              className="rounded-full border border-white/20 px-5 py-2 text-sm"
            >
              Browse products
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b0d13]"
            >
              Sign out
            </button>
          </div>
        </header>

        <section
          id="catalog"
          className="rounded-3xl border border-white/10 bg-white/5 p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Your curated picks</h2>
              <p className="text-sm text-white/60">
                Discover new arrivals and add them to your cart.
              </p>
            </div>
            <Link
              href="/dashboard#catalog"
              className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
            >
              Explore catalog
            </Link>
          </div>

          {cartError && (
            <div className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {cartError}
            </div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {productsLoading && (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                Loading products...
              </div>
            )}
            {!productsLoading && products.length === 0 && (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                No products yet. Check back soon.
              </div>
            )}
            {!productsLoading &&
              pagedProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setSelectedProduct(product)}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30 cursor-pointer"
                >
                  <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                    <span>{product.category.name}</span>
                    <span>Stock {product.stock}</span>
                  </div>
                  <div className="mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent relative">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-display text-white/70">
                        {product.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-white">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm text-white/60 line-clamp-2">
                    {product.description ||
                      "Crafted to elevate your daily ritual."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      disabled={
                        addingProductId === product.id || product.stock <= 0
                      }
                      className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {product.stock <= 0
                        ? "Out of stock"
                        : addingProductId === product.id
                          ? "Adding..."
                          : cartItems[product.id]
                            ? `Add another (${cartItems[product.id]})`
                            : "Add to cart"}
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {!productsLoading && products.length > itemsPerPage && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => handlePageChange(pageNumber)}
                      className={`h-9 w-9 rounded-full border text-xs font-semibold transition ${
                        isActive
                          ? "border-white bg-white text-[#0b0d13]"
                          : "border-white/20 text-white hover:border-white/60"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 overflow-y-auto"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[90vh] rounded-3xl border border-white/10 bg-[#0b0d13] p-8 overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 rounded-full border border-white/20 p-2 transition hover:border-white/50"
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="flex flex-col gap-6 pt-6">
                {/* Product Image */}
                <div className="aspect-video w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent relative">
                  {selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl font-display text-white/30">
                      {selectedProduct.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-display text-3xl text-white">
                        {selectedProduct.name}
                      </h2>
                      <p className="mt-2 text-sm text-white/50">
                        Category: {selectedProduct.category.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-white">
                        ${selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <h3 className="text-sm uppercase tracking-[0.2em] text-white/50">
                      Description
                    </h3>
                    <p className="mt-2 text-white">
                      {selectedProduct.description ||
                        "Crafted to elevate your daily ritual."}
                    </p>
                  </div>

                  {/* Stock Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Stock Available
                      </h3>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {selectedProduct.stock}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <h3 className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Product ID
                      </h3>
                      <p className="mt-2 break-all text-xs font-mono text-white/70">
                        {selectedProduct.id}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="mt-6 w-full rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {cartOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6 overflow-y-auto"
            onClick={() => setCartOpen(false)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl border border-white/10 bg-[#0b0d13] p-8 overflow-y-auto my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setCartOpen(false)}
                className="absolute top-4 right-4 rounded-full border border-white/20 p-2 transition hover:border-white/50"
              >
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="space-y-6 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl">Your cart</h2>
                    <p className="text-sm text-white/60">
                      Review the pieces you have saved for checkout.
                    </p>
                  </div>
                  <div className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.2em] text-white">
                    {cartLoading ? "Loading" : `${cartQuantity} items`}
                  </div>
                </div>

                {cartError && (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {cartError}
                  </div>
                )}

                <div className="grid gap-4">
                  {cartLoading && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                      Loading cart...
                    </div>
                  )}
                  {!cartLoading && cartProducts.length === 0 && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                      Your cart is empty. Add something from the catalog.
                    </div>
                  )}
                  {!cartLoading &&
                    cartProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-24 overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-display text-white/60">
                                {product.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-white/50">
                              {product.category.name}
                            </p>
                            <h3 className="font-display text-xl text-white">
                              {product.name}
                            </h3>
                            <div className="mt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCartItem(
                                    product.id,
                                    cartItems[product.id] - 1,
                                  )
                                }
                                disabled={
                                  updatingProductId === product.id ||
                                  cartItems[product.id] <= 0
                                }
                                className="h-8 w-8 rounded-full border border-white/30 text-sm font-semibold text-white transition hover:border-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                -
                              </button>
                              <span className="min-w-[2rem] text-center text-sm text-white/70">
                                {cartItems[product.id]}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateCartItem(
                                    product.id,
                                    cartItems[product.id] + 1,
                                  )
                                }
                                disabled={
                                  updatingProductId === product.id ||
                                  cartItems[product.id] >=
                                    (cartItemStock[product.id] ?? 0)
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
                            $
                            {(product.price * cartItems[product.id]).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

                {!cartLoading && cartProducts.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      Cart total
                    </p>
                    <p className="text-2xl font-semibold text-white">
                      ${cartTotal.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
