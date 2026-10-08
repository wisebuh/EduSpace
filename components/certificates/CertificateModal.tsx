"use client";

import React from "react";
import { X } from "lucide-react";
import CertificateView from "./CertificateView";
import { AppCertificate } from "@/lib/app-api";

interface CertificateModalProps {
  certificate: AppCertificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CertificateModal({
  certificate,
  isOpen,
  onClose,
}: CertificateModalProps) {
  if (!isOpen || !certificate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-white p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="pt-2">
          <CertificateView certificate={certificate} showActions={true} />
        </div>
      </div>
    </div>
  );
}
