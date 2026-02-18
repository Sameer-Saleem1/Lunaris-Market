"use client";

import { useState, FormEvent } from "react";
import { useRegister } from "@/app/hooks/useRegister";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const { register, isLoading, error, fieldErrors, isSuccess, reset } =
    useRegister();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError("");

    // Client-side password confirmation check
    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    await register({
      name: formData.name || undefined,
      email: formData.email,
      password: formData.password,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Reset errors when user starts typing
    if (error || fieldErrors) reset();
    if (passwordError) setPasswordError("");
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
              <svg
                className="h-8 w-8 text-emerald-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="font-display text-2xl">Registration successful</h2>
            <p className="mt-3 text-sm text-white/70">
              We&apos;ve sent a verification email to{" "}
              <span className="font-semibold text-white">{formData.email}</span>
            </p>
            <p className="mt-2 text-sm text-white/60">
              Verify your email to activate your account, then sign in.
            </p>
          </div>
          <div className="space-y-4">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#0b0d13]"
            >
              Go to login
            </Link>
            <button
              onClick={() => {
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                });
                reset();
              }}
              className="w-full text-sm text-white/60 hover:text-white"
            >
              Register another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] px-4 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Get started
          </p>
          <h1 className="font-display text-3xl">Create account</h1>
          <p className="mt-2 text-sm text-white/60">
            Join the list and unlock your dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="text-sm text-white/70">
              Name (optional)
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              placeholder="John Doe"
            />
            {fieldErrors?.name && (
              <p className="mt-1 text-sm text-red-300">{fieldErrors.name[0]}</p>
            )}
          </div>

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
            <p className="mt-1 text-xs text-white/50">
              Must be at least 8 characters with uppercase, lowercase, and
              number
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="text-sm text-white/70">
              Confirm password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              placeholder="••••••••"
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-300">{passwordError}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-[#0b0d13] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <svg
                  className="mr-2 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/60">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-white hover:text-white/80"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
