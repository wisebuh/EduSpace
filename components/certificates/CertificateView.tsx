"use client";

import React from "react";
import { ShieldCheck, Printer, Share2, ExternalLink } from "lucide-react";
import { AppCertificate } from "@/lib/app-api";

interface CertificateViewProps {
  certificate: AppCertificate;
  showActions?: boolean;
}

export default function CertificateView({ certificate, showActions = true }: CertificateViewProps) {
  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/verify-certificate/${certificate.certificateCode}`;
    navigator.clipboard.writeText(link);
    alert("Certificate verification link copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center">
      {/* Printable Certificate Frame */}
      <div
        id="printable-certificate"
        className="relative w-full max-w-4xl overflow-hidden border-2 border-slate-400 bg-white px-10 py-14 text-slate-900 shadow-xl print:border print:px-10 print:py-12 print:shadow-none"
      >
        <div className="pointer-events-none absolute inset-2 border border-slate-300" />
        <div className="pointer-events-none absolute inset-4 border border-slate-200" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-slate-400 bg-white" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 border border-slate-400 bg-white" />

        <div className="relative z-10 flex min-h-[440px] flex-col items-center text-center">
          <p className="mb-5 text-[10px] font-semibold tracking-[0.28em] text-slate-600">
            EDUSPACE ACADEMY
          </p>
          <h1 className="font-serif text-xl font-medium tracking-[0.18em] text-slate-800 sm:text-2xl">
            CERTIFICATE OF COMPLETION
          </h1>

          <p className="mt-7 text-[11px] tracking-wide text-slate-500">
            This is to certify that
          </p>

          <h2 className="mt-3 max-w-full break-words font-serif text-3xl font-bold text-slate-950 sm:text-4xl">
            {certificate.user?.name || "Student Name"}
          </h2>

          <p className="mt-4 text-xs text-slate-500">has completed the course</p>
          <h3 className="mt-3 max-w-full break-words font-serif text-xl font-bold text-slate-900 sm:text-2xl">
            {certificate.course?.title || "Course Title"}
          </h3>
          <div className="mt-5 flex items-center gap-3 text-[10px] tracking-[0.16em] text-slate-500">
            <span className="h-px w-8 bg-slate-300" />
            <span>PRESENTED BY EDUSPACE ACADEMY</span>
            <span className="h-px w-8 bg-slate-300" />
          </div>

          <div className="mt-auto grid w-full grid-cols-1 items-end gap-8 pt-12 sm:grid-cols-3">
            <div className="order-2 text-center sm:order-1 sm:text-left">
              <p className="border-b border-slate-400 pb-2 font-serif text-base italic text-slate-800">
                {certificate.course?.teacher?.name || "Course Instructor"}
              </p>
              <p className="mt-2 text-[10px] tracking-wide text-slate-500">INSTRUCTOR</p>
            </div>

            <div className="order-1 flex justify-center sm:order-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-400 text-slate-700">
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
            </div>

            <div className="order-3 text-center sm:text-right">
              <p className="border-b border-slate-400 pb-2 font-serif text-base text-slate-800">
                {formattedDate}
              </p>
              <p className="mt-2 text-[10px] tracking-wide text-slate-500">DATE ISSUED</p>
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col items-center justify-between gap-2 border-t border-slate-200 pt-3 text-[9px] text-slate-500 sm:flex-row">
            <span>
              Certificate ID: <strong className="font-mono font-medium text-slate-700">{certificate.certificateCode}</strong>
            </span>
            <span>Verify at eduspace.org/verify</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700"
          >
            <Printer size={16} /> Print / Save PDF
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Share2 size={16} /> Share Link
          </button>

          <a
            href={`/verify-certificate/${certificate.certificateCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            <ExternalLink size={16} /> Public Page
          </a>
        </div>
      )}
    </div>
  );
}
