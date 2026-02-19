import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export const revalidate = 60;

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#0b0d13] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.28),_transparent_55%),radial-gradient(circle_at_center,_rgba(59,130,246,0.25),_transparent_50%)]" />

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
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.length === 0 && (
              <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/70">
                No products yet. Check back soon.
              </div>
            )}
            {products.map((product) => (
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
