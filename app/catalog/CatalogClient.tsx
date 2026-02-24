"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CatalogFilters from "./CatalogFilters";

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
  createdAt: string | Date;
  category: Category;
};

type CatalogClientProps = {
  products: Product[];
  categories: Category[];
};

const normalizeDate = (value: string | Date) =>
  value instanceof Date ? value.getTime() : new Date(value).getTime();

export default function CatalogClient({
  products,
  categories,
}: CatalogClientProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [inStock, setInStock] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.description?.toLowerCase().includes(q) ||
          product.category.name.toLowerCase().includes(q),
      );
    }

    if (category) {
      result = result.filter((product) => product.category.id === category);
    }

    if (inStock) {
      result = result.filter((product) => product.stock > 0);
    }

    result.sort((a, b) => {
      if (sort === "price-asc") {
        return a.price - b.price;
      }
      if (sort === "price-desc") {
        return b.price - a.price;
      }
      if (sort === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return normalizeDate(b.createdAt) - normalizeDate(a.createdAt);
    });

    return result;
  }, [products, query, category, inStock, sort]);

  const handleClear = () => {
    setQuery("");
    setCategory("");
    setSort("newest");
    setInStock(false);
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Catalog filters
          </p>
          <h1 className="font-display text-2xl text-white">
            Explore the collection
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Refine by category, stock, or keyword.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-white hover:text-white"
        >
          Clear filters
        </button>
      </div>

      <CatalogFilters
        categories={categories}
        resultsCount={filteredProducts.length}
        query={query}
        category={category}
        sort={sort}
        inStock={inStock}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onInStockChange={setInStock}
      />

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 && (
          <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
            No products match your filters. Try adjusting them.
          </div>
        )}
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
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
            <h3 className="font-display text-xl text-white">{product.name}</h3>
            <p className="mt-2 text-sm text-white/60 line-clamp-2">
              {product.description || "Crafted to elevate your daily ritual."}
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
  );
}
