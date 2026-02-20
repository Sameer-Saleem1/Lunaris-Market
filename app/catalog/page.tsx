"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type CatalogCategory = {
  id: string;
  name: string;
};

type CatalogProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  category: CatalogCategory;
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

function ThemedSelect({ label, value, options, onChange }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? label;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        event.target instanceof Node &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex h-11 w-full items-center justify-between rounded-full border border-white/15 bg-[#1b1e27] px-4 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition focus:border-white/40 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          viewBox="0 0 20 20"
          className={`h-4 w-4 text-white/60 transition ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <path fill="currentColor" d="M5.25 7.5 10 12.25 14.75 7.5" />
        </svg>
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 max-h-60 overflow-auto rounded-2xl border border-white/10 bg-[#171a22] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                option.value === value
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/products", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load products.");
        }

        const payload = (await response.json()) as {
          success: boolean;
          data: CatalogProduct[];
        };

        setProducts(payload.data ?? []);
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          return;
        }
        setError("We couldn't load the catalog. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();

    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, CatalogCategory>();
    products.forEach((product) => {
      categoryMap.set(product.category.id, product.category);
    });

    return [
      { id: "all", name: "All categories" },
      ...Array.from(categoryMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    ].map((category) => ({
      value: category.id,
      label: category.name,
    }));
  }, [products]);

  const sortOptions = useMemo<SelectOption[]>(
    () => [
      { value: "newest", label: "Newest" },
      { value: "price-low", label: "Price: low to high" },
      { value: "price-high", label: "Price: high to low" },
      { value: "name", label: "Name" },
    ],
    [],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesQuery = normalizedQuery
        ? product.name.toLowerCase().includes(normalizedQuery) ||
          (product.description ?? "").toLowerCase().includes(normalizedQuery)
        : true;
      const matchesCategory =
        selectedCategory === "all" || product.category.id === selectedCategory;
      const matchesStock = inStockOnly ? product.stock > 0 : true;
      return matchesQuery && matchesCategory && matchesStock;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered;
    }
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#0b0d13] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.28),_transparent_55%),radial-gradient(circle_at_center,_rgba(59,130,246,0.25),_transparent_50%)]" />

      <header className="relative overflow-hidden border-b border-white/10">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
          <nav className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/70">
            <Link href="/" className="font-display text-lg text-white">
              Lunaris Market
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="hover:text-white">
                Home
              </Link>
              <Link href="/login" className="hover:text-white">
                Sign in
              </Link>
              <Link href="/register" className="hover:text-white">
                Create account
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12">
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col  gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                Search
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search products"
                  className="h-11 rounded-full border border-white/15 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                />
              </label>
              <label className="flex w-full flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                Category
                <ThemedSelect
                  label="Category"
                  value={selectedCategory}
                  options={categories}
                  onChange={setSelectedCategory}
                />
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="flex w-[150px] flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                Status
                <div className="flex h-11 items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) => setInStockOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-white"
                  />
                  <span className="text-xs uppercase tracking-[0.3em] text-white/70">
                    In Stock
                  </span>
                </div>
              </label>
              <label className="flex w-[250px] flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
                Sort by
                <ThemedSelect
                  label="Sort by"
                  value={sortBy}
                  options={sortOptions}
                  onChange={setSortBy}
                />
              </label>
            </div>
          </div>
          <div className="mt-4 text-sm text-white/60">
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </section>
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                Loading products... fetching the latest catalog items.
              </div>
            )}
            {!isLoading && error && (
              <div className="col-span-full rounded-3xl border border-rose-500/30 bg-rose-500/10 p-10 text-center text-rose-100">
                {error}
              </div>
            )}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                No products match your filters.
              </div>
            )}
            {!isLoading &&
              !error &&
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
                >
                  <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                    <span>{product.category.name}</span>
                    <span>Stock {product.stock}</span>
                  </div>
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent">
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
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">
                    {product.description ||
                      "Crafted to elevate your daily ritual."}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-lg font-semibold text-white">
                      ${product.price.toFixed(2)}
                    </span>
                    <Link
                      href="/login"
                      className="rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:border-white"
                    >
                      Sign in to buy
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </main>
    </div>
  );
}
