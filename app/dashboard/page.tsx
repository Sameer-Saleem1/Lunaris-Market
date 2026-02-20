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
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
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
        const productsList = productsData.data || [];
        setAllProducts(productsList);
        setProducts(productsList);

        const categoriesRes = await fetch("/api/categories");
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.data || []);
        }

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

  useEffect(() => {
    let filtered = [...allProducts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category.name.toLowerCase().includes(query),
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        (product) => product.category.id === selectedCategory,
      );
    }

    filtered = filtered.filter(
      (product) =>
        product.price >= priceRange[0] && product.price <= priceRange[1],
    );

    setProducts(filtered);
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, allProducts]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setPriceRange([0, 1000]);
  };

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
              className="relative rounded-full border border-white/20 p-2.5 transition-all hover:border-white/40 hover:bg-white/5"
              aria-label="Shopping cart"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {!cartLoading && cartQuantity > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#0b0d13] shadow-lg">
                  {cartQuantity > 99 ? "99+" : cartQuantity}
                </span>
              )}
            </button>

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
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50">
                {products.length} products
              </span>
              {(searchQuery ||
                selectedCategory ||
                priceRange[0] > 0 ||
                priceRange[1] < 1000) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">
                  Search
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Product name..."
                  className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">
                  Category
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full rounded-full border px-4 py-2 text-left text-sm transition ${
                      selectedCategory === null
                        ? "border-white bg-white text-[#0b0d13]"
                        : "border-white/20 text-white/70 hover:border-white/50"
                    }`}
                  >
                    All categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full rounded-full border px-4 py-2 text-left text-sm transition ${
                        selectedCategory === category.id
                          ? "border-white bg-white text-[#0b0d13]"
                          : "border-white/20 text-white/70 hover:border-white/50"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/50">
                  Price range
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([
                          Math.max(0, Number(e.target.value)),
                          priceRange[1],
                        ])
                      }
                      placeholder="Min"
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    />
                    <span className="text-white/50">–</span>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([
                          priceRange[0],
                          Math.max(priceRange[0], Number(e.target.value)),
                        ])
                      }
                      placeholder="Max"
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPriceRange([0, 50])}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white hover:text-white"
                    >
                      $0 - $50
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceRange([50, 150])}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white hover:text-white"
                    >
                      $50 - $150
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriceRange([150, 1000])}
                      className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70 transition hover:border-white hover:text-white"
                    >
                      $150+
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <div className="space-y-6">
              {cartError && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {cartError}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                {productsLoading && (
                  <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                    Loading products...
                  </div>
                )}
                {!productsLoading && products.length === 0 && (
                  <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                    No products match your filters. Try adjusting them.
                  </div>
                )}
                {!productsLoading &&
                  pagedProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:shadow-lg hover:shadow-black/20 cursor-pointer"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-display text-white/60">
                            {product.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute top-2 right-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/90">
                          {product.category.name}
                        </div>
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="absolute top-2 left-2 rounded-full bg-amber-500/20 border border-amber-400/30 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-amber-200">
                            Only {product.stock} left
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-display text-lg text-white line-clamp-1 group-hover:text-white/90 transition-colors">
                            {product.name}
                          </h3>
                          <p className="mt-1 text-xs text-white/50 line-clamp-1">
                            {product.description || "Premium quality product"}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="text-xl font-semibold text-white">
                              ${product.price.toFixed(2)}
                            </span>
                            {cartItems[product.id] && (
                              <span className="text-[10px] text-white/40">
                                {cartItems[product.id]} in cart
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={
                              addingProductId === product.id ||
                              product.stock <= 0
                            }
                            className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white hover:text-[#0b0d13] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10 disabled:hover:text-white"
                          >
                            {product.stock <= 0
                              ? "Out of stock"
                              : addingProductId === product.id
                                ? "Adding..."
                                : "Add to cart"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {!productsLoading && products.length > itemsPerPage && (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handlePageChange(Math.max(1, currentPage - 1))
                      }
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
            </div>
          </div>
        </section>

        {/* Product Detail Modal */}
        {selectedProduct && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4 py-6 overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl border border-white/10 bg-gradient-to-b from-[#0b0d13] to-[#0a0c12] shadow-2xl shadow-black/50 overflow-hidden my-auto animate-in zoom-in-95 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm p-2.5 transition-all hover:bg-white/10 hover:border-white/30 hover:rotate-90"
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

              <div className="overflow-y-auto max-h-[90vh]">
                {/* Product Image */}
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-gradient-to-br from-white/10 via-white/5 to-transparent">
                  {selectedProduct.imageUrl ? (
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-6xl font-display text-white/20">
                      {selectedProduct.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d13] via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <div className="inline-block rounded-full bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1 text-xs font-medium text-white mb-3">
                        {selectedProduct.category.name}
                      </div>
                      <h2 className="font-display text-4xl text-white drop-shadow-lg">
                        {selectedProduct.name}
                      </h2>
                    </div>
                    <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md px-5 py-3">
                      <p className="text-sm text-white/70 mb-1">Price</p>
                      <p className="text-3xl font-bold text-white">
                        ${selectedProduct.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-8 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50 mb-3">
                      About this product
                    </h3>
                    <p className="text-base leading-relaxed text-white/80">
                      {selectedProduct.description ||
                        "Crafted to elevate your daily ritual with premium materials and thoughtful design."}
                    </p>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
                        Availability
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white">
                          {selectedProduct.stock}
                        </p>
                        <p className="text-sm text-white/60">in stock</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
                        Status
                      </h3>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${selectedProduct.stock > 0 ? "bg-emerald-400" : "bg-red-400"}`}
                        />
                        <p className="text-sm font-medium text-white">
                          {selectedProduct.stock > 0
                            ? "Available"
                            : "Out of stock"}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
                        In Cart
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold text-white">
                          {cartItems[selectedProduct.id] || 0}
                        </p>
                        <p className="text-sm text-white/60">items</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(selectedProduct);
                      }}
                      disabled={
                        addingProductId === selectedProduct.id ||
                        selectedProduct.stock <= 0
                      }
                      className="flex-1 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#0b0d13] transition-all hover:bg-white/90 hover:shadow-lg hover:shadow-white/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-none"
                    >
                      {selectedProduct.stock <= 0
                        ? "Out of stock"
                        : addingProductId === selectedProduct.id
                          ? "Adding to cart..."
                          : cartItems[selectedProduct.id]
                            ? "Add another to cart"
                            : "Add to cart"}
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
                    >
                      Close
                    </button>
                  </div>
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
                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                        Cart total
                      </p>
                      <p className="text-2xl font-semibold text-white">
                        ${cartTotal.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/cart"
                        className="rounded-full border border-white/30 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white"
                      >
                        View cart
                      </Link>
                      <Link
                        href="/checkout"
                        className="rounded-full bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0b0d13]"
                      >
                        Checkout
                      </Link>
                    </div>
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
