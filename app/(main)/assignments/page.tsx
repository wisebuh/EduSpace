"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Download,
  X,
  Send,
  BookOpen,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import {
  downloadAssignmentAttachment,
  fetchAssignments,
  submitAssignment,
} from "@/lib/app-api";

type AssignmentRow = {
  id: string;
  title: string;
  type: "ASSIGNMENT" | "PROJECT";
  description?: string | null;
  course: string;
  due: string;
  rawDueDate?: string | null;
  maxScore: number;
  status: "Pending" | "In progress" | "Submitted" | "Graded";
  marks: number | "—";
  attachmentName?: string | null;
  mySubmission?: {
    id: string;
    grade?: number | null;
    submittedAt: string;
    content?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    feedback?: string | null;
  } | null;
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("All");

  // Submission / Details Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentRow | null>(null);
  const [textContent, setTextContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadAssignmentsData = async () => {
    try {
      const data = await fetchAssignments();
      const raw = data.assignments ?? [];
      setLoadError("");

      setAssignments(
        raw.map((item) => {
          const isGraded = typeof item.mySubmission?.grade === "number";
          const isSubmitted = !!item.mySubmission;
          const isOverdue = item.dueDate && new Date(item.dueDate) < new Date();

          let status: "Pending" | "In progress" | "Submitted" | "Graded";
          if (isGraded) status = "Graded";
          else if (isSubmitted) status = "Submitted";
          else if (isOverdue) status = "Pending";
          else status = "In progress";

          return {
            id: item.id,
            title: item.title,
            type: item.type ?? "ASSIGNMENT",
            description: item.description,
            course: [item.class?.course?.title, item.class?.name].filter(Boolean).join(" · ") || "Course",
            due: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date",
            rawDueDate: item.dueDate,
            maxScore: item.maxScore || 100,
            attachmentName: item.attachmentName,
            status,
            marks: item.mySubmission?.grade ?? "—",
            mySubmission: item.mySubmission,
          };
        })
      );
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Assignments | EduSpace";
    void Promise.resolve().then(loadAssignmentsData);
  }, []);

  const handleOpenModal = (item: AssignmentRow) => {
    setSelectedAssignment(item);
    setTextContent(item.mySubmission?.content || "");
    setFileUrl(item.mySubmission?.fileUrl || "");
    setSubmissionFile(null);
    setSuccessMsg("");
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!textContent.trim() && !fileUrl.trim() && !submissionFile) {
      alert("Write an answer, attach your completed assignment, or provide a file link.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg("");

    try {
      const { submission } = await submitAssignment(selectedAssignment.id, {
        content: textContent || undefined,
        fileUrl: fileUrl || undefined,
        file: submissionFile ?? undefined,
      });
      setSuccessMsg("Assignment submitted successfully!");
      setSubmissionFile(null);
      setSelectedAssignment((current) => current ? {
        ...current,
        status: "Submitted",
        mySubmission: {
          id: submission.id,
          grade: submission.grade,
          submittedAt: submission.submittedAt,
          content: submission.content,
          fileUrl: submission.fileUrl,
          fileName: submission.fileName,
          feedback: submission.feedback,
        },
      } : current);
      await loadAssignmentsData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = assignments.filter((item) => {
    if (filter === "All") return true;
    return item.status === filter;
  });

  const getFilterCount = (statusName: string) => {
    if (statusName === "All") return assignments.length;
    return assignments.filter((a) => a.status === statusName).length;
  };

  const statusStyle: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/50",
    "In progress": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border border-blue-200/50",
    Submitted: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 border border-purple-200/50",
    Graded: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200/50",
  };

  return (
    <div>
      <PageHeader
        eyebrow="Tasks & submissions"
        title="Assignments & Course Projects"
        description="Track your deadlines, submit your work, and review instructor feedback."
        action={
          <Link
            href="/submissions"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition"
          >
            <CheckCircle2 size={16} /> My Submissions
          </Link>
        }
      />

      {loadError && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => void loadAssignmentsData()}
            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
          >
            Try again
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total assignments"
          value={String(assignments.length)}
          detail="In your current list"
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          title="Awaiting submission"
          value={String(
            assignments.filter(
              (item) => item.status === "Pending" || item.status === "In progress"
            ).length
          )}
          detail="Pending or in progress"
          icon={Clock3}
          color="orange"
        />
        <StatCard
          title="Completed & Graded"
          value={String(
            assignments.filter(
              (item) => item.status === "Submitted" || item.status === "Graded"
            ).length
          )}
          detail="Submitted or graded"
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Interactive Filter Pills */}
      <div className="mb-6 flex flex-wrap gap-2.5">
        {["All", "Pending", "In progress", "Submitted", "Graded"].map((tab) => {
          const active = filter === tab;
          const count = getFilterCount(tab);

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Assignments List */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Assignments List</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Showing {filtered.length} of {assignments.length} assignments
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-xs text-slate-500">Loading assignments...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {item.status === "Graded" ? (
                    <CheckCircle2 size={21} className="text-emerald-500" />
                  ) : item.status === "Pending" ? (
                    <AlertCircle size={21} className="text-amber-500" />
                  ) : (
                    <ClipboardList size={21} className="text-blue-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{item.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {item.type === "PROJECT" ? "Project" : "Assignment"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {item.course}
                  </p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Clock3 size={13} /> Due: {item.due}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                        statusStyle[item.status]
                      }`}
                    >
                      {item.status}
                    </span>
                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                      Score: <strong className="text-slate-800 dark:text-slate-200">{item.marks} / {item.maxScore}</strong>
                    </p>
                  </div>

                  <button
                    onClick={() => handleOpenModal(item)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 transition"
                  >
                    {item.status === "Submitted" || item.status === "Graded" ? "View Work" : "Submit Work"}{" "}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">
                <BookOpen className="mx-auto text-slate-400" size={32} />
                <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
                  {assignments.length === 0 ? "No assignments assigned yet" : "No assignments found"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {assignments.length === 0
                    ? "Assignments appear here when your instructor publishes them to the class cohort you are enrolled in. Check My Classes or choose the matching cohort in My Courses."
                    : <>No assignments match the &quot;{filter}&quot; filter.</>}
                </p>
                {assignments.length === 0 && (
                  <div className="mt-4 flex justify-center gap-3">
                    <Link
                      href="/my-classes"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      My Classes
                    </Link>
                    <Link
                      href="/my-courses"
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Check My Cohort
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission & Details Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {selectedAssignment.course}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {selectedAssignment.title}
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {selectedAssignment.type === "PROJECT" ? "Course project" : "Class assignment"}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-950">
                <span>Due Date: <strong>{selectedAssignment.due}</strong></span>
                <span>Max Score: <strong>{selectedAssignment.maxScore} pts</strong></span>
              </div>

              {selectedAssignment.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500">Instructions</p>
                  <p className="mt-1 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {selectedAssignment.description}
                  </p>
                </div>
              )}

              {selectedAssignment.attachmentName && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Assignment file</p>
                    <p className="truncate text-xs text-slate-500">{selectedAssignment.attachmentName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadAssignmentAttachment(selectedAssignment.id, selectedAssignment.attachmentName!);
                      } catch (error) {
                        alert(error instanceof Error ? error.message : "Unable to download the assignment file.");
                      }
                    }}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    <Download size={14} /> Download
                  </button>
                </div>
              )}

              {(selectedAssignment.mySubmission?.fileName || selectedAssignment.mySubmission?.fileUrl) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Your submitted work</p>
                  {selectedAssignment.mySubmission.fileName && (
                    <p className="mt-1 text-xs text-slate-700 dark:text-slate-200">
                      {selectedAssignment.mySubmission.fileName}
                    </p>
                  )}
                  {selectedAssignment.mySubmission.fileUrl && (
                    <a
                      href={selectedAssignment.mySubmission.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block break-all text-xs font-semibold text-blue-700 underline dark:text-blue-300"
                    >
                      Open submitted link
                    </a>
                  )}
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              {selectedAssignment.mySubmission?.grade != null && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Grade Result: {selectedAssignment.mySubmission.grade} / {selectedAssignment.maxScore} pts
                  </p>
                  {selectedAssignment.mySubmission.feedback && (
                    <p className="mt-2 text-xs italic text-emerald-900 dark:text-emerald-200">
                      Instructor Feedback: &quot;{selectedAssignment.mySubmission.feedback}&quot;
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmitWork} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Written Answer / Submission Notes
                  </label>
                  <textarea
                    rows={4}
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    placeholder="Type your solution, code snippets, or assignment answer here..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Upload completed assignment (Optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.mp4,.zip"
                    onChange={(event) => setSubmissionFile(event.target.files?.[0] ?? null)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                  {submissionFile && (
                    <p className="mt-1 text-xs text-slate-500">Selected: {submissionFile.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Or share a document URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    placeholder="https://github.com/... or https://drive.google.com/..."
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Send size={14} /> {submitting ? "Submitting..." : "Submit Work"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}