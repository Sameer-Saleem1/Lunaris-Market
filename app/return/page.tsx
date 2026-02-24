"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type SessionStatus = {
  orderId: string;
  status: string;
  paymentStatus: string;
};

function ReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      setLoading(false);
      return;
    }

    let mounted = true;
    let attempts = 0;
    let manualCompletionAttempted = false;

    const attemptManualCompletion = async () => {
      if (manualCompletionAttempted) return;
      manualCompletionAttempted = true;

      try {
        const response = await fetch("/api/checkout/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          console.warn("Manual completion failed, continuing to poll");
          return;
        }

        const data = await response.json();
        if (data.success && data.data) {
          setState(data.data as SessionStatus);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Manual completion error:", err);
      }
    };

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/checkout/session?session_id=${encodeURIComponent(sessionId)}`,
        );

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Unable to confirm payment.");
        }

        const data = await response.json();
        const nextState = data.data as SessionStatus;

        if (!mounted) {
          return;
        }

        setState(nextState);

        if (nextState.paymentStatus === "PAID") {
          setLoading(false);
          return;
        }

        attempts += 1;

        // After 2 attempts (3 seconds), try manual completion for local testing
        if (attempts === 2 && !manualCompletionAttempted) {
          await attemptManualCompletion();
        }

        if (attempts >= 8) {
          setLoading(false);
          setError(
            "Payment processing is taking longer than expected. Your order may still complete. Check your order history.",
          );
          return;
        }

        setTimeout(poll, 1500);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError(
          err instanceof Error ? err.message : "Unable to confirm payment.",
        );
        setLoading(false);
      }
    };

    poll();

    return () => {
      mounted = false;
    };
  }, [router, sessionId]);

  return (
    <div className="min-h-screen bg-[#0b0d13] px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Stripe return
          </p>
          <h1 className="mt-3 font-display text-3xl">
            {loading ? "Finalizing your payment" : "Payment status"}
          </h1>
          <p className="mt-4 text-sm text-white/70">
            {error
              ? error
              : state?.paymentStatus === "PAID"
                ? "Payment confirmed. Your order is ready."
                : "We are still confirming your payment. This can take a moment."}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {state?.orderId && (
              <Link
                href={`/orders/${state.orderId}`}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b0d13]"
              >
                View order
              </Link>
            )}
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-6 py-3 text-sm"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0d13] text-white">
          Finalizing payment...
        </div>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
