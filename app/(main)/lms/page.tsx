"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Search,
  X,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  AppMaterial,
  downloadMaterial,
  fetchMaterialBlob,
  fetchMyMaterials,
} from "@/lib/app-api";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPdf(material: AppMaterial) {
  return material.mimeType === "application/pdf" || material.originalName.toLowerCase().endsWith(".pdf");
}

export default function LMSPage() {
  const [materials, setMaterials] = useState<AppMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPdf, setSelectedPdf] = useState<AppMaterial | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [openingPdfId, setOpeningPdfId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleViewPdf = async (material: AppMaterial) => {
    setOpeningPdfId(material.id);
    setFileError("");
    try {
      const blob = await fetchMaterialBlob(material.id);
      setPdfUrl(URL.createObjectURL(blob));
      setSelectedPdf(material);
    } catch (viewError) {
      setFileError(viewError instanceof Error ? viewError.message : "Unable to open this PDF.");
    } finally {
      setOpeningPdfId(null);
    }
  };

  const handleDownload = async (material: AppMaterial) => {
    setDownloadingId(material.id);
    setFileError("");
    try {
      await downloadMaterial(material.id, material.originalName);
    } catch (downloadError) {
      setFileError(downloadError instanceof Error ? downloadError.message : "Unable to download this file.");
    } finally {
      setDownloadingId(null);
    }
  };

  const closePdf = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
    setSelectedPdf(null);
  };

  useEffect(() => {
    document.title = "Learning Hub";
    void Promise.resolve()
      .then(fetchMyMaterials)
      .then(({ materials: courseMaterials }) => {
        setMaterials(courseMaterials);
        setError("");
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load course materials.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return materials;
    return materials.filter((material) =>
      `${material.title} ${material.originalName} ${material.course?.title ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [materials, search]);

  return (
    <div>
      <PageHeader
        eyebrow="Learning management system"
        title="Course Materials"
        description="View and download study materials shared by instructors for your enrolled courses."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </p>
      )}
      {fileError && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {fileError}
        </p>
      )}

      <section>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Materials from your courses</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              PDFs can be read here or downloaded for offline access.
            </p>
          </div>
          <label className="relative block sm:w-80">
            <span className="sr-only">Search course materials</span>
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search materials or courses..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </label>
        </div>

        {loading ? (
          <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Loading course materials...
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMaterials.map((material) => {
              const pdf = isPdf(material);
              return (
                <article
                  key={material.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <FileText size={22} />
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {pdf ? "PDF" : material.mimeType.split("/").pop()?.toUpperCase() ?? "FILE"}
                    </span>
                  </div>

                  <p className="mt-5 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {material.course?.title ?? "Course material"}
                  </p>
                  <h3 className="mt-1 break-words font-bold">{material.title}</h3>
                  <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                    {material.originalName}
                  </p>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {formatBytes(material.size)}
                    {material.uploadedBy?.name ? ` · Shared by ${material.uploadedBy.name}` : ""}
                  </p>

                  <div className="mt-auto flex gap-2 pt-5">
                    {pdf && (
                      <button
                        type="button"
                        onClick={() => void handleViewPdf(material)}
                        disabled={openingPdfId === material.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        <ExternalLink size={16} /> {openingPdfId === material.id ? "Opening..." : "View PDF"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDownload(material)}
                      disabled={downloadingId === material.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      <Download size={16} /> {downloadingId === material.id ? "Downloading..." : "Download"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
            <FolderOpen className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 font-semibold">
              {materials.length === 0 ? "No course materials available yet" : "No matching materials"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {materials.length === 0
                ? "Materials uploaded to your enrolled courses will appear here."
                : "Try another title, file name, or course search."}
            </p>
          </div>
        )}
      </section>

      {selectedPdf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Viewing ${selectedPdf.title}`}
        >
          <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">{selectedPdf.title}</h2>
                <p className="truncate text-xs text-slate-500">
                  {selectedPdf.course?.title ?? selectedPdf.originalName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownload(selectedPdf)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  <Download size={16} /> <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  type="button"
                  onClick={closePdf}
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                  aria-label="Close PDF viewer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {pdfUrl ? (
              <iframe
                key={selectedPdf.id}
                src={pdfUrl}
                title={selectedPdf.title}
                className="min-h-0 flex-1 bg-slate-100"
              />
            ) : (
              <p role="status" className="flex min-h-0 flex-1 items-center justify-center bg-slate-100 text-sm text-slate-600">
                Loading PDF...
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
