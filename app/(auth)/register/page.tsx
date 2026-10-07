"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  Lock,
  Phone,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import GoogleButton from "@/components/GoogleButton";
import EduSpaceMark from "@/components/brand/EduSpaceMark";
import PasswordInput from "@/components/PasswordInput";
import Spinner from "@/components/Spinner";
import {
  getCurrentUser,
  registerUser,
  resendVerificationEmail,
} from "@/lib/app-api";

const inputWrapperClass =
  "group relative flex items-center rounded-xl border border-slate-200 bg-slate-50/50 transition-all duration-200 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-600/10 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:focus-within:border-blue-500 dark:focus-within:bg-slate-900 dark:focus-within:ring-blue-500/15";

const inputClass =
  "w-full bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none dark:text-white dark:placeholder:text-slate-500";

const callingCodes = [
  { country: "United States", flag: "🇺🇸", code: "+1" },
  { country: "Canada", flag: "🇨🇦", code: "+1" },
  { country: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { country: "Australia", flag: "🇦🇺", code: "+61" },
  { country: "Ghana", flag: "🇬🇭", code: "+233" },
  { country: "Nigeria", flag: "🇳🇬", code: "+234" },
  { country: "Kenya", flag: "🇰🇪", code: "+254" },
  { country: "India", flag: "🇮🇳", code: "+91" },
  { country: "South Africa", flag: "🇿🇦", code: "+27" },
  { country: "Germany", flag: "🇩🇪", code: "+49" },
  { country: "France", flag: "🇫🇷", code: "+33" },
  { country: "United Arab Emirates", flag: "🇦🇪", code: "+971" },
] as const;

const getPasswordStrength = (value: string) => {
  const checks = {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  if (!value) return { passed: 0, isStrong: false, label: "" };
  if (passed <= 2) return { passed, isStrong: false, label: "Weak" };
  return {
    passed,
    isStrong: passed === 5,
    label: passed === 5 ? "Strong" : passed >= 3 ? "Moderate" : "Weak",
  };
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resending, setResending] = useState(false);
  
  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    document.title = "Create Account | EduSpace";
    getCurrentUser().then(() => router.replace("/dashboard")).catch(() => undefined);
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name.trim() || !email.trim() || !phoneNumber.trim() || !dateOfBirth || !password.trim()) {
      setError("Please complete all required fields.");
      setLoading(false);
      return;
    }

    if (!/^\d{6,15}$/.test(phoneNumber.trim())) {
      setError("Please enter a valid phone number with digits only.");
      setLoading(false);
      return;
    }

    if (new Date(`${dateOfBirth}T00:00:00`) >= new Date(new Date().toDateString())) {
      setError("Date of birth must be a past date.");
      setLoading(false);
      return;
    }

    if (!passwordStrength.isStrong) {
      setError("Password must meet all 5 security conditions below.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const result = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        phoneCountryCode,
        phoneNumber: phoneNumber.trim(),
        dateOfBirth,
      });
      setVerificationMessage(result.message);
      setVerificationPending(true);
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Unable to create your account. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setError("");
    try {
      const result = await resendVerificationEmail(email.trim());
      setVerificationMessage(result.message);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Unable to resend verification email."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-blue-500 selection:text-white">
      <div className="flex min-h-screen">
        
        {/* Decorative Brand Section (Left) */}
        <section className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 lg:flex">
          {/* Subtle Glow Spheres */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/25 blur-[120px]" />
          <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[150px]" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">
            <Link href="/" className="flex items-center gap-3">
              <EduSpaceMark className="h-11 w-11 drop-shadow-lg drop-shadow-blue-500/30" />
              <span className="text-2xl font-black tracking-tight text-white">
                EduSpace<span className="text-blue-500">.</span>
              </span>
            </Link>

            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-400 backdrop-blur-md">
                <Sparkles size={14} /> Next-Generation Learning Hub
              </div>

              <h1 className="text-5xl font-black leading-[1.15] text-white xl:text-6xl">
                Master new skills with confidence.
              </h1>

              <p className="text-lg leading-relaxed text-slate-400">
                Join thousands of students and professionals learning from industry-crafted courses with real-time feedback and tracking.
              </p>

              {/* Feature Highlights */}
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Interactive Assignments</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p className="text-xs text-slate-400 mt-1">Resource Availability</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} EduSpace Technologies Inc. All rights reserved.
            </p>
          </div>
        </section>

        {/* Form Container (Right) */}
        <section className="flex flex-1 items-center justify-center bg-white px-6 py-12 dark:bg-slate-950 sm:px-12">
          <div className="w-full max-w-lg">
            
            {/* Mobile Header */}
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link href="/" className="flex items-center gap-2.5">
                <EduSpaceMark className="h-10 w-10" />
                <span className="text-xl font-bold text-slate-900 dark:text-white">EduSpace</span>
              </Link>
            </div>

            {verificationPending ? (
              <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-8 dark:border-blue-900/40 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                  <ShieldCheck size={26} />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Verify your email
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {verificationMessage} Check <strong className="text-slate-900 dark:text-white">{email}</strong> and verify your address to continue.
                </p>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <RefreshCw size={16} className={resending ? "animate-spin" : ""} />
                  {resending ? "Sending link..." : "Resend email link"}
                </button>

                <Link
                  href="/sign-in"
                  className="mt-4 block text-center text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Return to sign in
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Start learning today with free lifetime platform access.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                      <XCircle size={16} className="shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Full Name
                    </label>
                    <div className={inputWrapperClass}>
                      <span className="pl-4 text-slate-400">
                        <User size={18} />
                      </span>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setError(""); }}
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Email Address
                    </label>
                    <div className={inputWrapperClass}>
                      <span className="pl-4 text-slate-400">
                        <Mail size={18} />
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Phone Number & Country Select */}
                  <div>
                    <label htmlFor="phoneNumber" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Phone Number
                    </label>
                    <div className={inputWrapperClass}>
                      <div className="relative flex shrink-0 items-center border-r border-slate-200 pl-3 pr-2 dark:border-slate-800">
                        <span aria-hidden="true" className="mr-1.5 text-base">
                          {callingCodes.find((item) => item.code === phoneCountryCode)?.flag ?? "🌐"}
                        </span>
                        <select
                          value={phoneCountryCode}
                          aria-label="Country Code"
                          onChange={(e) => { setPhoneCountryCode(e.target.value); setError(""); }}
                          className="h-full bg-transparent py-3.5 pr-4 text-xs font-bold text-slate-800 outline-none dark:text-slate-200"
                        >
                          {callingCodes.map((item) => (
                            <option key={`${item.country}-${item.code}`} value={item.code}>
                              {item.code} ({item.country})
                            </option>
                          ))}
                        </select>
                      </div>
                      <span className="pl-3 text-slate-400">
                        <Phone size={18} />
                      </span>
                      <input
                        id="phoneNumber"
                        type="tel"
                        inputMode="numeric"
                        value={phoneNumber}
                        onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "")); setError(""); }}
                        placeholder="801 234 5678"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label htmlFor="dateOfBirth" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Date of Birth
                    </label>
                    <div className={inputWrapperClass}>
                      <span className="pl-4 text-slate-400">
                        <Calendar size={18} />
                      </span>
                      <input
                        id="dateOfBirth"
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        value={dateOfBirth}
                        onChange={(e) => { setDateOfBirth(e.target.value); setError(""); }}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Password
                    </label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                    />

                    {/* Dynamic Password Strength Progress Bar */}
                    {password && (
                      <div className="mt-3 space-y-2">
                        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`transition-all duration-300 ${
                              passwordStrength.passed <= 2
                                ? "w-1/3 bg-red-500"
                                : passwordStrength.passed < 5
                                ? "w-2/3 bg-amber-500"
                                : "w-full bg-emerald-500"
                            }`}
                          />
                        </div>

                        {/* Interactive Requirements Checklist */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                          {[
                            { label: "8+ characters", ok: password.length >= 8 },
                            { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
                            { label: "Lowercase letter", ok: /[a-z]/.test(password) },
                            { label: "Number", ok: /\d/.test(password) },
                            { label: "Special character", ok: /[^A-Za-z0-9]/.test(password) },
                          ].map((rule) => (
                            <div key={rule.label} className="flex items-center gap-1.5">
                              {rule.ok ? (
                                <CheckCircle2 size={13} className="text-emerald-500" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700 ml-1 mr-0.5" />
                              )}
                              <span className={rule.ok ? "font-medium text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                                {rule.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Confirm Password
                    </label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Spinner /> : null}
                    {loading ? "Creating your account..." : "Create Account"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  <span className="text-xs font-medium uppercase text-slate-400">Or join with</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                </div>

                <GoogleButton label="Sign up with Google" />

                <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}