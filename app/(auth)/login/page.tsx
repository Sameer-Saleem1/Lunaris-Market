"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLogin } from "@/app/hooks/useLogin";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, fieldErrors, isSuccess, reset } = useLogin();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isSuccess) {
      router.push("/dashboard");
    }
  }, [isSuccess, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await login(formData);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));

    if (error || fieldErrors) reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Sign in
          </p>
          <h1 className="font-display text-3xl">Welcome back</h1>
          <p className="mt-2 text-sm text-white/60">
            Access your dashboard and curated drops.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm text-white/70">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              placeholder="john@example.com"
            />
            {fieldErrors?.email && (
              <p className="mt-1 text-sm text-red-300">
                {fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="text-sm text-white/70">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              placeholder="••••••••"
            />
            {fieldErrors?.password && (
              <p className="mt-1 text-sm text-red-300">
                {fieldErrors.password[0]}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#0b0d13] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-white hover:text-white/80"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
