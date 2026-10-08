"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Play,
  Search,
  UserRoundMinus,
  Users,
} from "lucide-react";
import { formatCohortDate } from "@/lib/youtube";
import PageHeader from "@/components/ui/PageHeader";
import {
  AppCourse,
  enrollInCourse,
  fetchAvailableCourses,
  unenrollFromCourse,
} from "@/lib/app-api";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [unenrollingCourseId, setUnenrollingCourseId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Explore Cohorts | EduSpace";
    const updateCurrentTime = () => setCurrentTime(Date.now());
    updateCurrentTime();
    const clockInterval = window.setInterval(updateCurrentTime, 60_000);
    fetchAvailableCourses()
      .then(({ courses: available }) => setCourses(available ?? []))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load cohorts.");
      })
      .finally(() => setLoading(false));
    return () => window.clearInterval(clockInterval);
  }, []);

  const filteredCourses = courses.filter((course) =>
    `${course.title} ${course.teacher?.name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleEnroll = async (event: FormEvent<HTMLFormElement>, course: AppCourse) => {
    event.preventDefault();
    const classId = course.enrollment?.classId ?? selectedClasses[course.id];
    if (!classId) {
      setError("Choose a class before enrolling.");
      return;
    }

    setEnrollingCourseId(course.id);
    setError("");
    try {
      await enrollInCourse(course.id, classId);
      const result = await fetchAvailableCourses();
      setCourses(result.courses ?? []);
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : "Unable to enroll in this class.");
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const handleUnenroll = async (course: AppCourse) => {
    if (
      !window.confirm(
        `Unenroll from "${course.title}"? You can only leave before the cohort starts.`
      )
    ) {
      return;
    }

    setUnenrollingCourseId(course.id);
    setError("");
    try {
      await unenrollFromCourse(course.id);
      const result = await fetchAvailableCourses();
      setCourses(result.courses ?? []);
    } catch (unenrollError) {
      setError(
        unenrollError instanceof Error
          ? unenrollError.message
          : "Unable to unenroll from this cohort."
      );
    } finally {
      setUnenrollingCourseId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="YouTube live learning"
        title="Choose your cohort"
        description="Join a course, then choose one scheduled class. Your place is reserved in one class per cohort."
      />

      <section className="mb-8 overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-9">
        <div className="flex max-w-3xl items-start gap-4">
          <div className="rounded-2xl bg-red-600 p-3">
            <Play size={26} fill="currentColor" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-300">
              Learn together, live on YouTube
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Pick a class time that works for you.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Each cohort has scheduled classes with a countdown to the next live
              stream. Once enrolled, your class stream and schedule appear in My Classes.
            </p>
          </div>
        </div>
      </section>

      <div className="mb-6 max-w-lg">
        <label htmlFor="cohort-search" className="sr-only">Search cohorts</label>
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="cohort-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search courses or instructors..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading available cohorts...
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredCourses.map((course) => {
            const selectedClassId = course.enrollment?.classId ?? selectedClasses[course.id] ?? "";
            const alreadyEnrolled = Boolean(course.enrollment?.classId);
            const hasCohortStarted = Boolean(
              course.enrollment?.class?.cohortStartDate &&
                new Date(course.enrollment.class.cohortStartDate).getTime() <= currentTime
            );

            return (
              <article
                key={course.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between bg-linear-to-r from-slate-950 to-slate-800 p-5 text-white">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                    <BookOpen size={16} /> Cohort
                  </span>
                  {course.isEnrolled && (
                    <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 size={14} /> Enrolled
                    </span>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <h2 className="text-xl font-bold">{course.title}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Instructor: {course.teacher?.name ?? "EduSpace instructor"}
                  </p>
                  {course.description && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {course.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Users size={15} /> {course._count?.enrollments ?? 0} students
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} /> {course.classes?.length ?? 0} class options
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock3 size={15} /> Live schedule
                    </span>
                  </div>

                  <form onSubmit={(event) => handleEnroll(event, course)} className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                    <label htmlFor={`class-${course.id}`} className="mb-2 block text-sm font-semibold">
                      {alreadyEnrolled ? "Your class in this cohort" : "Choose your class"}
                    </label>
                    {alreadyEnrolled ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
                        {course.enrollment?.class?.name ?? "Selected class"}
                        {course.enrollment?.class?.startsAt && (
                          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                            {new Date(course.enrollment.class.startsAt).toLocaleString()}
                          </p>
                        )}
                        {(course.enrollment?.class?.cohortStartDate || course.enrollment?.class?.cohortEndDate) && (
                          <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-300">
                            Cohort: {formatCohortDate(course.enrollment.class.cohortStartDate) ?? "TBD"} – {formatCohortDate(course.enrollment.class.cohortEndDate) ?? "TBD"}
                          </p>
                        )}
                      </div>
                    ) : (
                      <select
                        id={`class-${course.id}`}
                        value={selectedClassId}
                        onChange={(event) => setSelectedClasses((current) => ({ ...current, [course.id]: event.target.value }))}
                        disabled={!course.classes?.length}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:disabled:bg-slate-800"
                      >
                        <option value="">
                          {course.classes?.length ? "Select a class schedule" : "No classes scheduled yet"}
                        </option>
                        {course.classes?.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                            {item.cohortStartDate || item.startsAt
                              ? ` · ${item.cohortStartDate ? formatCohortDate(item.cohortStartDate) : new Date(item.startsAt!).toLocaleString()}`
                              : " · Schedule to be announced"}
                          </option>
                        ))}
                      </select>
                    )}

                    {alreadyEnrolled ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                          href="/my-classes"
                          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Go to my class <ArrowRight size={16} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleUnenroll(course)}
                          disabled={unenrollingCourseId === course.id || hasCohortStarted}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <UserRoundMinus size={16} />
                          {unenrollingCourseId === course.id
                            ? "Unenrolling..."
                            : hasCohortStarted
                              ? "Cohort started"
                              : "Unenroll"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={!selectedClassId || enrollingCourseId === course.id || !course.classes?.length}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {enrollingCourseId === course.id ? "Enrolling..." : "Enroll in this class"}
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
          <BookOpen className="mx-auto text-slate-400" size={32} />
          <p className="mt-3 font-semibold">No cohorts found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search or check back for new classes.</p>
        </div>
      )}
    </div>
  );
}
