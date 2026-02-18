"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  role: "USER" | "ADMIN";
  email: string;
  name?: string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    categoryId: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    imageUrl: "",
    categoryId: "",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const loadData = async () => {
    setErrorMessage(null);
    try {
      const [authRes, categoriesRes, productsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/categories"),
        fetch("/api/admin/products"),
      ]);

      if (!authRes.ok) {
        const authData = await authRes.json();
        throw new Error(authData.message || "You must be logged in as admin.");
      }

      const authData = await authRes.json();
      if (authData.data?.role !== "ADMIN") {
        throw new Error("Admin access required.");
      }

      const categoriesData = await categoriesRes.json();
      const productsData = await productsRes.json();

      setAuth(authData.data);
      setCategories(categoriesData.data || []);
      setProducts(productsData.data || []);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Failed to load admin data.",
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create category.");
      }

      setCategories((prev) => [data.data, ...prev]);
      setCategoryName("");
      setStatusMessage("Category created successfully.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create category.",
      );
    }
  };

  const handleCreateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim() || undefined,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        imageUrl: productForm.imageUrl.trim() || undefined,
        categoryId: productForm.categoryId,
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create product.");
      }

      setProducts((prev) => [data.data, ...prev]);
      setProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        imageUrl: "",
        categoryId: "",
      });
      setStatusMessage("Product created successfully.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create product.",
      );
    }
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      description: product.description ?? "",
      price: product.price.toString(),
      stock: product.stock.toString(),
      imageUrl: product.imageUrl ?? "",
      categoryId: product.category.id,
    });
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const handleUpdateProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;

    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        imageUrl: editForm.imageUrl.trim() || undefined,
        categoryId: editForm.categoryId,
      };

      const response = await fetch(
        `/api/admin/products/${selectedProduct.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product.");
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === selectedProduct.id
            ? { ...data.data, category: data.data.category ?? product.category }
            : product,
        ),
      );
      setStatusMessage("Product updated successfully.");
      closeProductModal();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update product.",
      );
    }
  };

  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-6 text-white">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <h1 className="font-display text-3xl">Admin access required</h1>
          <p className="mt-4 text-sm text-white/60">{authError}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#0b0d13]"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] text-white">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Admin dashboard
            </p>
            <h1 className="font-display text-4xl">Inventory control</h1>
            <p className="text-sm text-white/60">Signed in as {auth.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-5 py-2 text-sm"
            >
              User dashboard
            </Link>
            <Link
              href="/dashboard"
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

        {(statusMessage || errorMessage) && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              errorMessage
                ? "border-red-400/40 bg-red-500/10 text-red-200"
                : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            {errorMessage || statusMessage}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-2xl">Add category</h2>
            <p className="mt-1 text-sm text-white/60">
              Organize product lines and keep the store tidy.
            </p>
            <form
              onSubmit={handleCreateCategory}
              className="mt-6 flex flex-col gap-4"
            >
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Category name"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b0d13]"
              >
                Add category
              </button>
            </form>
            <div className="mt-6 space-y-2 text-sm text-white/70">
              {formattedCategories.length === 0 && (
                <p>No categories yet. Add your first one.</p>
              )}
              {formattedCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2"
                >
                  {category.name}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-display text-2xl">Add product</h2>
            <p className="mt-1 text-sm text-white/60">
              Add a new product and publish it instantly.
            </p>
            <form
              onSubmit={handleCreateProduct}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <input
                value={productForm.name}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Product name"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
                required
              />
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Description"
                className="min-h-[90px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
              />
              <input
                value={productForm.price}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    price: event.target.value,
                  }))
                }
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                required
              />
              <input
                value={productForm.stock}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    stock: event.target.value,
                  }))
                }
                type="number"
                min="0"
                placeholder="Stock"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                required
              />
              <input
                value={productForm.imageUrl}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    imageUrl: event.target.value,
                  }))
                }
                type="url"
                placeholder="Image URL"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
              />
              <select
                value={productForm.categoryId}
                onChange={(event) =>
                  setProductForm((prev) => ({
                    ...prev,
                    categoryId: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none md:col-span-2"
                required
              >
                <option value="" className="text-black">
                  Select category
                </option>
                {formattedCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="text-black"
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b0d13] md:col-span-2"
              >
                Add product
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Products</h2>
              <p className="text-sm text-white/60">Latest inventory updates</p>
            </div>
            <button
              onClick={loadData}
              className="rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.2em] text-white"
            >
              Refresh
            </button>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {products.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                No products yet. Add your first item.
              </div>
            )}
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-white/30"
                role="button"
                tabIndex={0}
                onClick={() => openProductModal(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    openProductModal(product);
                  }
                }}
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                  <span>{product.category.name}</span>
                  <span>Stock {product.stock}</span>
                </div>
                <h3 className="mt-3 font-display text-xl">{product.name}</h3>
                <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                  <span>${product.price.toFixed(2)}</span>
                  <span>{product.imageUrl ? "Image" : "No image"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-10"
          onClick={closeProductModal}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0b0d13] p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Product details
                </p>
                <h3 className="font-display text-2xl">
                  {selectedProduct.name}
                </h3>
                <p className="mt-1 text-sm text-white/60">
                  Category: {selectedProduct.category.name}
                </p>
              </div>
              <button
                onClick={closeProductModal}
                className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/70"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              {selectedProduct.description || "No description provided."}
            </div>

            <form
              onSubmit={handleUpdateProduct}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <input
                value={editForm.name}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Product name"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
                required
              />
              <textarea
                value={editForm.description}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Description"
                className="min-h-[90px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
              />
              <input
                value={editForm.price}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    price: event.target.value,
                  }))
                }
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                required
              />
              <input
                value={editForm.stock}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    stock: event.target.value,
                  }))
                }
                type="number"
                min="0"
                placeholder="Stock"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
                required
              />
              <input
                value={editForm.imageUrl}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    imageUrl: event.target.value,
                  }))
                }
                type="url"
                placeholder="Image URL"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none md:col-span-2"
              />
              <select
                value={editForm.categoryId}
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    categoryId: event.target.value,
                  }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-white/40 focus:outline-none md:col-span-2"
                required
              >
                <option value="" className="text-black">
                  Select category
                </option>
                {formattedCategories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="text-black"
                  >
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="md:col-span-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b0d13]"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
