"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Play,
  Users,
} from "lucide-react";
import ClassCountdown from "@/components/classes/ClassCountdown";
import PageHeader from "@/components/ui/PageHeader";
import { AppClass, fetchMyClasses } from "@/lib/app-api";
import { formatCohortDate, getYouTubeEmbedUrl } from "@/lib/youtube";

export default function MyClassesPage() {
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "My YouTube Classes | EduSpace";
    fetchMyClasses()
      .then(({ classes: enrolledClasses }) => setClasses(enrolledClasses ?? []))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your classes.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Your live timetable"
        title="My Classes"
        description="Your selected cohort classes, YouTube streams, and countdowns to the next session."
      />

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading your classes...
        </div>
      ) : classes.length > 0 ? (
        <div className="space-y-6">
          {classes.map((item) => {
            const embedUrl = item.meetingUrl ? getYouTubeEmbedUrl(item.meetingUrl) : null;
            return (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
                  <div className="bg-slate-950 p-4 sm:p-6">
                    {embedUrl ? (
                      <div className="aspect-video overflow-hidden rounded-xl bg-black">
                        <iframe
                          className="h-full w-full"
                          src={embedUrl}
                          title={`${item.name} YouTube class`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-linear-to-br from-slate-900 to-slate-800 text-center text-white">
                        <Play size={42} className="text-red-500" fill="currentColor" />
                        <p className="mt-3 font-semibold">YouTube stream not posted yet</p>
                        <p className="mt-1 text-xs text-slate-400">Your instructor will add the class link.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center p-5 sm:p-7">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                      <Play size={16} fill="currentColor" /> YouTube live class
                    </div>
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                      {item.course?.title ?? "Your cohort"}
                    </p>
                    <h2 className="mt-1 text-xl font-bold">{item.name}</h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Instructor: {item.course?.teacher?.name ?? "EduSpace instructor"}
                    </p>

                    <div className="mt-5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <CalendarDays size={15} className="mt-0.5 shrink-0" />
                      <span>
                        {item.startsAt ? new Date(item.startsAt).toLocaleString() : item.schedule ?? "Schedule to be announced"}
                      </span>
                    </div>
                    {(item.cohortStartDate || item.cohortEndDate) && (
                      <p className="mt-2 pl-6 text-xs text-slate-500 dark:text-slate-400">
                        Cohort: {formatCohortDate(item.cohortStartDate) ?? "TBD"} – {formatCohortDate(item.cohortEndDate) ?? "TBD"}
                      </p>
                    )}
                    {item.schedule && item.startsAt && (
                      <p className="mt-1 pl-6 text-xs text-slate-500 dark:text-slate-400">{item.schedule}</p>
                    )}

                    <div className="mt-5">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Clock3 size={14} /> Time until class
                      </p>
                      <ClassCountdown startsAt={item.startsAt} cohortStartDate={item.cohortStartDate} />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Users size={14} /> {item._count?.enrollments ?? 0} students in this class
                      </span>
                      {item.meetingUrl && (
                        <a
                          href={item.meetingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Open on YouTube <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
          <Play className="mx-auto text-red-500" size={38} fill="currentColor" />
          <h2 className="mt-4 font-semibold">No class selected yet</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a class in a cohort to see its schedule and YouTube stream here.</p>
          <Link href="/my-courses" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
            Explore cohorts
          </Link>
        </div>
      )}
    </div>
  );
}
