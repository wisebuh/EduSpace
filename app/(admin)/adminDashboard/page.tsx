"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { fetchAdminDashboard } from "@/lib/app-api";

type Overview = Awaited<ReturnType<typeof fetchAdminDashboard>>;

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Admin Dashboard";
    fetchAdminDashboard()
      .then(setOverview)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load the admin overview.");
      });
  }, []);

  const stats = overview?.stats;
  const cards = [
    { label: "Platform users", value: stats?.totalUsers, note: `${stats?.newUsersThisWeek ?? 0} joined this week`, icon: Users, color: "blue" },
    { label: "Courses", value: stats?.totalCourses, note: `${stats?.publishedCourses ?? 0} published`, icon: BookOpen, color: "violet" },
    { label: "Enrollments", value: stats?.enrollments, note: `${stats?.usersByRole.STUDENT ?? 0} students`, icon: GraduationCap, color: "green" },
    { label: "Awaiting review", value: stats?.waitingForGrade, note: `${stats?.submissions ?? 0} submissions total`, icon: ClipboardCheck, color: "orange" },
  ] as const;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform administration"
        title="Admin dashboard"
        description="Monitor EduSpace activity, accounts, courses, and student work."
        action={<Link href="/courseUpload" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Teaching uploads <ArrowRight size={16} /></Link>}
      />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
              <span className={`rounded-xl p-2.5 ${color === "blue" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300" : color === "violet" ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" : color === "green" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}><Icon size={19} /></span>
            </div>
            <p className="mt-4 text-3xl font-bold">{value ?? "—"}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Recent users</h2><p className="mt-1 text-sm text-slate-500">Latest account registrations</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">{stats?.totalUsers ?? 0} total</span></div>
          {overview?.recentUsers.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{overview.recentUsers.map((person) => <div key={person.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{person.name}</p><p className="truncate text-xs text-slate-500">{person.email}</p></div><div className="shrink-0 text-right"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">{person.role}</span><p className="mt-1 text-[11px] text-slate-400">{new Date(person.createdAt).toLocaleDateString()}</p></div></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">{overview ? "No users yet." : "Loading users..."}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5"><h2 className="text-lg font-bold">Recent courses</h2><p className="mt-1 text-sm text-slate-500">Newly created learning programs</p></div>
          {overview?.recentCourses.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{overview.recentCourses.map((course) => <div key={course.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{course.title}</p><p className="text-xs text-slate-500">Instructor: {course.teacher.name}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${course.published ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"}`}>{course.published ? "Published" : "Draft"}</span></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">{overview ? "No courses yet." : "Loading courses..."}</p>}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cohorts" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Manage courses & cohorts</Link>
            <Link href="/announcements" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Announcements</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
