"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { verifyEmail } from "@/lib/app-api";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [message, setMessage] = useState("Verifying your email address...");
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    document.title = "Verify Email";
    if (!token) {
      return;
    }

    let active = true;
    verifyEmail(token)
      .then((result) => {
        if (active) {
          setMessage(result.message);
          setVerified(true);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to verify this email address."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {verified ? "Email verified" : "Email verification"}
        </h1>
        <p role="status" className="mt-4 text-sm leading-6 text-slate-600">
          {token ? message : "This verification link is missing its token."}
        </p>
        {verified && (
          <Link
            href="/sign-in"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue to sign in
          </Link>
        )}
        {!verified && token && message !== "Verifying your email address..." && (
          <Link
            href="/register"
            className="mt-6 inline-flex rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to registration
          </Link>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
          <p className="text-sm text-slate-600">Loading email verification...</p>
        </main>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
