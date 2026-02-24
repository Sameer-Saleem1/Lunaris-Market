import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import CatalogClient from "./CatalogClient";

export const revalidate = 60;

export default async function CatalogPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const serializedProducts = products.map((product) => ({
    ...product,
    createdAt: product.createdAt.toISOString(),
  }));

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
        <CatalogClient products={serializedProducts} categories={categories} />
      </main>
    </div>
  );
}
