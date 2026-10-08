"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import CertificateView from "@/components/certificates/CertificateView";
import { verifyCertificate, AppCertificate } from "@/lib/app-api";

export default function VerifyCertificatePage() {
  const params = useParams();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;

  const [certificate, setCertificate] = useState<AppCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Verify Certificate | EduSpace";

    if (!code) return;

    verifyCertificate(code)
      .then((res) => {
        setCertificate(res.certificate);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Invalid or unverified certificate code");
        setLoading(false);
      });
  }, [code]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-slate-900 sm:p-8">
      {/* Top Header Branding */}
      <div className="mb-8 flex items-center justify-between w-full max-w-4xl">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-950">
          <ArrowLeft size={16} /> Back to EduSpace
        </Link>
        <div className="flex items-center gap-2 font-bold tracking-wide text-lg text-slate-900">
          <ShieldCheck size={22} /> EduSpace Verification Portal
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-transparent" />
          <p className="mt-4 font-medium text-slate-600">Verifying certificate authenticity...</p>
        </div>
      ) : error ? (
        <div className="w-full max-w-lg rounded-2xl border border-red-500/30 bg-red-950/20 p-8 text-center backdrop-blur-md">
          <AlertCircle size={48} className="mx-auto text-red-400" />
          <h1 className="mt-4 text-2xl font-bold text-red-200">Invalid Certificate</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <p className="mt-4 text-xs text-slate-400">
          Certificate Code checked: <code className="text-slate-800">{code}</code>
          </p>
          <Link
            href="/"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Return Home
          </Link>
        </div>
      ) : certificate ? (
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center gap-3 border border-slate-300 bg-white p-4 text-slate-800">
            <CheckCircle2 size={24} className="shrink-0 text-slate-700" />
            <div>
              <p className="font-bold text-slate-900">Verified Official Certificate</p>
              <p className="text-xs text-slate-600">
                Issued to <strong className="text-slate-900">{certificate.user?.name}</strong> on{" "}
                {new Date(certificate.issuedAt).toLocaleDateString()}.
              </p>
            </div>
          </div>

          <CertificateView certificate={certificate} showActions={true} />
        </div>
      ) : null}
    </div>
  );
}
