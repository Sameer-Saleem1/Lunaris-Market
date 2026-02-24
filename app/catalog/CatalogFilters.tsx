"use client";

import { useMemo } from "react";

type Category = {
  id: string;
  name: string;
};

type FiltersProps = {
  categories: Category[];
  resultsCount: number;
  query: string;
  category: string;
  sort: string;
  inStock: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onInStockChange: (value: boolean) => void;
};

export default function CatalogFilters({
  categories,
  resultsCount,
  query,
  category,
  sort,
  inStock,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onInStockChange,
}: FiltersProps) {
  const resultsLabel = useMemo(() => {
    if (resultsCount === 0) return "No matches";
    if (resultsCount === 1) return "1 item";
    return `${resultsCount} items`;
  }, [resultsCount]);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          select[name="category"] option,
          select[name="sort"] option {
            background: #000000;
            color: white;
            padding: 10px;
          }
        `,
        }}
      />
      <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">
            Search
          </label>
          <input
            name="q"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Desk lamp..."
            className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white backdrop-blur-sm placeholder:text-white/40 transition-all duration-200 hover:border-white/40 hover:bg-white/10 focus:border-white/60 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">
            Category
          </label>
          <select
            name="category"
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-full border border-white/20 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/10 focus:border-white/60 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' opacity='0.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25rem 1.25rem",
            }}
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.2em] text-white/50">
            Sort by
          </label>
          <select
            name="sort"
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-full border border-white/20 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white backdrop-blur-sm transition-all duration-200 hover:border-white/40 hover:bg-white/10 focus:border-white/60 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' opacity='0.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.75rem center",
              backgroundSize: "1.25rem 1.25rem",
            }}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
        <div className="flex items-end justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-white/70">
            <input
              type="checkbox"
              checked={inStock}
              onChange={(event) => onInStockChange(event.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-transparent text-white focus:ring-0"
            />
            In stock only
          </label>
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              {resultsLabel}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
