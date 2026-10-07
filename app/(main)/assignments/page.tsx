"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import { AppAssignment, fetchAssignments } from "@/lib/app-api";

type AssignmentRow = {
  id: string;
  title: string;
  course: string;
  due: string;
  status: string;
  marks: number | "—";
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);

  useEffect(() => {
    document.title = "Assignments";

    const loadAssignments = async () => {
      try {
        const data = await fetchAssignments();
        setAssignments(
          (data.assignments ?? []).map((item: AppAssignment) => ({
            id: item.id,
            title: item.title,
            course: item.class?.course?.title ?? item.class?.name ?? "Course",
            due: item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "No due date",
            status: item.mySubmission?.grade != null
              ? "Graded"
              : item.mySubmission
                ? "Submitted"
                : item.dueDate && new Date(item.dueDate) < new Date()
                  ? "Pending"
                  : "In progress",
            marks: item.mySubmission?.grade ?? "—",
          }))
        );
      } catch {
        setAssignments([]);
      }
    };

    loadAssignments();
  }, []);

  const [filter, setFilter] = useState("All");

  const filtered = assignments.filter(
    (item) => filter === "All" || item.status === filter
  );

  const statusStyle: Record<string, string> = {
    Pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    "In progress": "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    Submitted: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    Graded: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return (
    <div>
      <PageHeader
        eyebrow="Tasks & submissions"
        title="Assignments"
        description="Track your deadlines, complete tasks and review your results."
        action={
          <Link href="/submissions" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <CheckCircle2 size={16} /> My Submissions
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total assignments" value={String(assignments.length)} detail="In your current list" icon={ClipboardList} color="blue" />
        <StatCard title="Awaiting submission" value={String(assignments.filter((item) => item.status === "Pending" || item.status === "In progress").length)} detail="Pending or in progress" icon={Clock3} color="orange" />
        <StatCard title="Completed" value={String(assignments.filter((item) => item.status === "Submitted" || item.status === "Graded").length)} detail="Submitted or graded" icon={CheckCircle2} color="green" />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {["All", "Pending", "In progress", "Submitted", "Graded"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium ${
              filter === item
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="font-bold">Your assignments</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} assignment{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {item.status === "Graded" ? (
                  <CheckCircle2 size={21} />
                ) : item.status === "Pending" ? (
                  <AlertCircle size={21} />
                ) : (
                  <ClipboardList size={21} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {item.course}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock3 size={13} /> Due {item.due}
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="text-left sm:text-right">
                  <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle[item.status]}`}>
                    {item.status}
                  </span>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Score: {item.marks}
                  </p>
                </div>

                <button
                  onClick={() => window.alert(`Assignment details for "${item.title}" will be connected later.`)}
                  aria-label={`View ${item.title}`}
                  className="rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <ArrowUpRight size={17} />
                </button>
              </div>
            </article>
          ))}

          {filtered.length === 0 && (
            <p className="p-10 text-center text-sm text-slate-500">
              No assignments match this filter.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}