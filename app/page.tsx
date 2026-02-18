import Link from "next/link";
export default function Home() {
  return (
    <div className="min-h-screen bg-[#0b0d13] text-white">
      <header className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.28),_transparent_55%),radial-gradient(circle_at_center,_rgba(59,130,246,0.25),_transparent_50%)]" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14">
          <nav className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/70">
            <div className="font-display text-lg text-white">
              Lunaris Market
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-white">
                Sign in
              </Link>
              <Link href="/register" className="hover:text-white">
                Create account
              </Link>
              <div className="rounded-full border border-white/20 px-3 py-1 text-xs">
                Member access only
              </div>
            </div>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="animate-fade-up space-y-6">
              <p className="text-sm uppercase tracking-[0.4em] text-white/60">
                Members-only marketplace
              </p>
              <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">
                Discover a private collection of design-forward essentials.
              </h1>
              <p className="max-w-xl text-base text-white/70">
                Lunaris Market is a curated space where every product is vetted
                for craft, texture, and longevity. Create an account to unlock
                the full catalog and your personal dashboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b0d13] transition hover:bg-white/90"
                >
                  Create account
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white"
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="grid gap-4 rounded-3xl border border-white/15 bg-white/5 p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
                <span>Feature shelf</span>
                <span className="text-white/40">Week 04</span>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-[#fbbf24] via-[#fb7185] to-[#38bdf8] p-[1px]">
                <div className="rounded-2xl bg-[#0b0d13] p-5">
                  <h3 className="font-display text-2xl text-white">
                    Studio-grade desk setup
                  </h3>
                  <p className="mt-2 text-sm text-white/70">
                    Precision tools, soft lighting, and curated accessories.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 text-sm text-white/70">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Glassware Atelier</span>
                  <span className="text-white/40">Limited</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Analog Workspace</span>
                  <span className="text-white/40">Invite</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>Ritual Objects</span>
                  <span className="text-white/40">Private</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              How it works
            </p>
            <h2 className="mt-3 font-display text-2xl">Join, unlock, shop</h2>
            <p className="mt-3 text-sm text-white/60">
              Sign up or log in to access your dashboard where the catalog,
              cart, and checkout live. Guests only see the moodboard.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Weekly drops
            </p>
            <h2 className="mt-3 font-display text-2xl">Curated collections</h2>
            <p className="mt-3 text-sm text-white/60">
              Each release is themed and limited. You will see availability,
              pricing, and bundles once you are signed in.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Verified access
            </p>
            <h2 className="mt-3 font-display text-2xl">Secure checkout</h2>
            <p className="mt-3 text-sm text-white/60">
              We verify every account, then keep checkout private and fast. Log
              in to unlock the full experience.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
