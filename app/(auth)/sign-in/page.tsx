"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";
import Spinner from "@/components/Spinner";
import EduSpaceMark from "@/components/brand/EduSpaceMark";
import { getCurrentUser, loginUser } from "@/lib/app-api";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const authError = searchParams.get("error");
  const authErrorMessage =
    authError === "google_state"
      ? "Google returned to the app, but the sign-in state cookie was missing or did not match. Retry in the same browser and use localhost consistently (not 127.0.0.1)."
      : authError === "google_redirect"
        ? "Google returned to EduSpace, but rejected the callback URL during sign-in. Ensure the exact API callback URL in GOOGLE_CALLBACK_URL is listed under Authorized redirect URIs for the same Google OAuth client."
        : authError === "google_client"
          ? "Google returned to EduSpace, but rejected the OAuth client credentials. Confirm the client ID and secret are both from the same Google Cloud Web application."
          : authError === "google_expired"
            ? "Google’s authorization code expired or was already used. Start a fresh sign-in and complete it in one tab."
                : authError === "google_token"
                  ? "EduSpace reached the callback, but Google rejected the authorization-code exchange. Confirm the callback URL, client ID, and client secret are from the same OAuth Web application, then restart the API."
                  : authError === "google_identity"
                    ? "EduSpace received an invalid Google identity token. Confirm the API client ID matches the OAuth Web client used for sign-in, then restart the API."
                    : authError === "google_database"
                      ? "Google verified your sign-in, but EduSpace could not read or save your account. Check that the API database is running and reachable, then restart the API."
                      : authError === "google_account_conflict"
                        ? "This email is linked to a different Google account. Sign in with the previously linked Google account or contact an administrator."
          : authError === "google_callback"
        ? "Google accepted the sign-in, but the API could not complete it. Check the API terminal for the callback error and confirm the Google client ID, client secret, and callback URL belong to the same OAuth client."
        : authError === "google_code"
          ? "Google returned without an authorization code. Start sign-in again."
          : authError === "google_provider"
            ? "Google did not authorize the sign-in. Try again and approve the requested access."
            : authError === "google"
              ? "Google sign-in could not be completed. Please try again."
              : authError === "google_unavailable"
                ? "Google sign-in is not configured yet. Please use your email and password."
                : "";

  useEffect(() => {
    document.title = "Sign In";
    getCurrentUser().then(() => router.replace("/dashboard")).catch(() => undefined);
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    try {
      await loginUser({ email: email.trim(), password });
      router.push("/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Invalid email or password. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">

        {/* Left side */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:w-1/2">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.35),_transparent_45%)]" />
          <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            <div className="flex items-center gap-3">
              <EduSpaceMark className="h-10 w-10" />

              <span className="text-xl font-bold text-white">
                EduSpace
              </span>
            </div>

            <div className="max-w-xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
                Your learning journey
              </p>

              <h1 className="text-5xl font-bold leading-tight text-white xl:text-6xl">
                Learn more.
                <br />
                Achieve more.
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
                Access your courses, classes, assignments and learning
                resources from one simple place.
              </p>
            </div>

            <p className="text-sm text-slate-500">
              © 2026 EduSpace. All rights reserved.
            </p>
          </div>
        </section>

        {/* Right side */}
        <section className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <EduSpaceMark className="h-10 w-10" />

              <span className="text-xl font-bold text-slate-900">
                EduSpace
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue your learning journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {(error || authErrorMessage) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error || authErrorMessage}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Spinner />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs text-slate-400">
                OR
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="space-y-3">
              <GoogleButton label="Continue with Google" />
            </div>

            <p className="mt-8 text-center text-sm text-slate-500">
              Do not have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create an account
              </Link>
            </p>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInForm />
    </Suspense>
  );
}