"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock3, FileText, Pencil, Save, X } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { AppSubmission, fetchMySubmissions, submitAssignment } from "@/lib/app-api";

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<AppSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSubmissions = async () => {
    const result = await fetchMySubmissions();
    setSubmissions(result.submissions ?? []);
  };

  useEffect(() => {
    document.title = "My Submissions";
    void Promise.resolve()
      .then(loadSubmissions)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load submissions.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (
    event: FormEvent<HTMLFormElement>,
    submission: AppSubmission
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = String(formData.get("content") ?? "").trim();
    const fileUrl = String(formData.get("fileUrl") ?? "").trim();

    if (!content && !fileUrl) {
      setError("Add an answer or a file link before saving.");
      return;
    }
    if (fileUrl) {
      try {
        new URL(fileUrl);
      } catch {
        setError("Enter a valid file link.");
        return;
      }
    }

    setSavingId(submission.id);
    setError("");
    setMessage("");
    try {
      await submitAssignment(submission.assignment.id, {
        content: content || null,
        fileUrl: fileUrl || null,
      });
      await loadSubmissions();
      setEditingId(null);
      setMessage(`“${submission.assignment.title}” was updated successfully.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update this submission.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your submitted work"
        title="My Submissions"
        description="Review the answers and files you have submitted. You can update a submission at any time."
      />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading your submissions...
        </div>
      ) : submissions.length ? (
        <div className="space-y-4">
          {submissions.map((submission) => {
            const graded = submission.grade !== null && submission.grade !== undefined;
            const editing = editingId === submission.id;

            return (
              <article
                key={submission.id}
                id={submission.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        {submission.assignment.class.course?.title ?? submission.assignment.class.name}
                      </p>
                      <h2 className="mt-1 text-lg font-bold">{submission.assignment.title}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Clock3 size={13} />
                        Submitted {new Date(submission.submittedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:justify-end">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                      graded
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    }`}>
                      {graded ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
                      {graded ? `Graded: ${submission.grade}/${submission.assignment.maxScore}` : "Submitted"}
                    </span>
                    {!editing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(submission.id);
                          setError("");
                          setMessage("");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                    )}
                  </div>
                </div>

                {editing ? (
                  <form onSubmit={(event) => handleSave(event, submission)} className="space-y-4 p-5 sm:p-6">
                    {graded && (
                      <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                        <AlertCircle size={17} className="mt-0.5 shrink-0" />
                        Editing this graded submission will clear its grade and feedback so your instructor can review the updated work.
                      </p>
                    )}
                    <label className="block text-sm font-semibold">
                      Written answer
                      <textarea
                        name="content"
                        rows={6}
                        maxLength={10000}
                        defaultValue={submission.content ?? ""}
                        placeholder="Write or update your answer..."
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      File link
                      <input
                        name="fileUrl"
                        type="url"
                        defaultValue={submission.fileUrl ?? ""}
                        placeholder="https://..."
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={savingId === submission.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                      >
                        <Save size={15} /> {savingId === submission.id ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === submission.id}
                        onClick={() => {
                          setEditingId(null);
                          setError("");
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <X size={15} /> Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 p-5 sm:p-6">
                    {submission.content ? (
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-300">
                        {submission.content}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-500">No written answer attached.</p>
                    )}
                    {submission.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-300 dark:hover:bg-slate-800"
                      >
                        <FileText size={15} /> Open submitted file
                      </a>
                    )}
                    {submission.feedback && (
                      <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Instructor feedback</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
          <FileText className="mx-auto text-slate-400" size={36} />
          <h2 className="mt-4 font-semibold">No submissions yet</h2>
          <p className="mt-1 text-sm text-slate-500">Once you submit an assignment, it will appear here for review and editing.</p>
          <Link href="/assignments" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            View assignments
          </Link>
        </div>
      )}
    </div>
  );
}
