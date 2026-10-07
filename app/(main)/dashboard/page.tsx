"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Clock3,
  CalendarDays,
  PlayCircle,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import ClassCountdown from "@/components/classes/ClassCountdown";
import {
  AppAssignment,
  AppClass,
  fetchAssignments,
  fetchDashboard,
  fetchMyClasses,
  getCurrentUser,
} from "@/lib/app-api";
import { formatCohortDate, getYouTubeEmbedUrl } from "@/lib/youtube";

type DashboardStat = {
  title: string;
  value: string;
  detail: string;
  icon: string;
  color: "blue" | "green" | "violet" | "orange";
};

const readNumber = (value: unknown) => (typeof value === "number" ? value : 0);

function TeacherDashboard() {
  const [name, setName] = useState("Teacher");
  const [stats, setStats] = useState<Record<string, unknown>>({});
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [assignments, setAssignments] = useState<AppAssignment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getCurrentUser(), fetchDashboard(), fetchMyClasses(), fetchAssignments()])
      .then(([user, dashboard, classResult, assignmentResult]) => {
        setName(user?.name ?? "Teacher");
        setStats(dashboard.stats ?? {});
        setClasses(classResult.classes ?? []);
        setAssignments(assignmentResult.assignments ?? []);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your teaching dashboard.");
      });
  }, []);

  const toGrade = readNumber(stats.toGrade);
  const metrics = [
    { label: "Courses", value: stats.courses, icon: BookOpen },
    { label: "Cohorts / classes", value: stats.classes, icon: CalendarDays },
    { label: "Enrolled students", value: stats.students, icon: Users },
    { label: "To grade", value: stats.toGrade, icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor workspace"
        title={`Welcome back, ${name}`}
        description="Manage your courses, cohorts, assignments, and student progress from one place."
        action={<Link href="/courseUpload" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Create assignment <ArrowRight size={16} /></Link>}
      />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400">
              {label}<span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><Icon size={19} /></span>
            </div>
            <p className="mt-4 text-3xl font-bold">{typeof value === "number" ? value : "—"}</p>
            <p className="mt-1 text-xs text-slate-500">{label === "To grade" ? "Student submissions awaiting review" : "Across your teaching workspace"}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Your cohorts</h2><p className="mt-1 text-sm text-slate-500">Classes and enrollment at a glance</p></div><Link href="/cohorts" className="text-sm font-semibold text-blue-600">Manage</Link></div>
          {classes.length ? <div className="space-y-3">{classes.slice(0, 5).map((item) => <article key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800"><div><p className="text-xs font-semibold text-blue-600">{item.course?.title ?? "Course"}</p><p className="mt-1 font-semibold">{item.name}</p></div><div className="text-right text-xs text-slate-500"><p>{item._count?.enrollments ?? 0} students</p><p>{item._count?.assignments ?? 0} assignments</p></div></article>)}</div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950">No cohorts yet. Create a course and cohort to get started.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-bold">Recent assignments</h2><p className="mt-1 text-sm text-slate-500">{toGrade} submissions awaiting grading</p></div><Link href="/assignments" className="text-sm font-semibold text-blue-600">View all</Link></div>
          {assignments.length ? <div className="space-y-3">{assignments.slice(0, 5).map((assignment) => <article key={assignment.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 dark:border-slate-800"><div><p className="font-semibold">{assignment.title}</p><p className="mt-1 text-xs text-slate-500">{assignment.class?.course?.title ?? ""} · {assignment.class?.name ?? ""}</p></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">{assignment._count?.submissions ?? 0} submitted</span></article>)}</div> : <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-950">No assignments have been published yet.</p>}
          <div className="mt-5 flex flex-wrap gap-3"><Link href="/courseUpload" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Upload assignments or materials</Link><Link href="/announcements" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">Post announcement</Link></div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [activities, setActivities] = useState<Array<{ title: string; category: string; progress: number; time: string; color: string }>>([]);
  const [cohortClasses, setCohortClasses] = useState<AppClass[]>([]);
  const [userName, setUserName] = useState("Student");

  useEffect(() => {
    document.title = "Dashboard";

    const loadDashboard = async () => {
      try {
        const [me, data] = await Promise.all([getCurrentUser(), fetchDashboard()]);
        setRole(me?.role ?? "STUDENT");
        if (me?.role === "ADMIN") {
          router.replace("/adminDashboard");
          return;
        }
        const classData = me?.role === "STUDENT" ? await fetchMyClasses() : null;
        const statsData = data.stats ?? {};
        const averageGrade = readNumber(statsData.averageGrade);
        const dashboardStats: DashboardStat[] = [
          {
            title: "Enrolled courses",
            value: String(readNumber(statsData.enrolledCourses)),
            detail: "Active learning paths",
            icon: "BookOpen",
            color: "blue" as const,
          },
          {
            title: "Pending assignments",
            value: String(readNumber(statsData.pendingAssignments)),
            detail: "Need action",
            icon: "ClipboardCheck",
            color: "orange" as const,
          },
          {
            title: "Graded submissions",
            value: String(readNumber(statsData.gradedSubmissions)),
            detail: "Reviewed work",
            icon: "TrendingUp",
            color: "green" as const,
          },
          {
            title: "Average grade",
            value: averageGrade ? `${averageGrade}%` : "—",
            detail: "Performance overview",
            icon: "Users",
            color: "violet" as const,
          },
        ] as DashboardStat[];

        setUserName(me?.name ?? "Student");
        setCohortClasses(classData?.classes ?? []);
        setStats(dashboardStats);
        setActivities(
          (data.upcomingAssignments ?? []).map((item, index) => {
            const classData =
              item.class && typeof item.class === "object"
                ? (item.class as Record<string, unknown>)
                : {};
            const courseData =
              classData.course && typeof classData.course === "object"
                ? (classData.course as Record<string, unknown>)
                : {};
            const dueDate = typeof item.dueDate === "string" ? item.dueDate : null;

            return {
              title: typeof item.title === "string" ? item.title : `Assignment ${index + 1}`,
              category: typeof courseData.title === "string" ? courseData.title : "Course",
              progress: 35 + (index * 15),
              time: dueDate ? new Date(dueDate).toLocaleDateString() : "Upcoming",
              color: ["bg-blue-600", "bg-emerald-600", "bg-violet-600", "bg-amber-600"][index % 4],
            };
          })
        );
      } catch {
        setUserName("Student");
        setStats([]);
        setActivities([]);
        setCohortClasses([]);
      }
    };

    loadDashboard();
  }, [router]);

  if (role === "TEACHER") return <TeacherDashboard />;
  if (role === "ADMIN") return <div role="status" className="p-8 text-center text-sm text-slate-500">Opening the admin dashboard...</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your learning space"
        title={`Welcome back, ${userName} 👋`}
        description="Here is your learning overview. Keep making progress toward your goals."
        action={
          <Link
            href="/my-courses"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Explore courses <ArrowRight size={16} />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const iconMap = {
            BookOpen,
            Users,
            ClipboardCheck,
            TrendingUp,
          } as const;
          const Icon = iconMap[stat.icon as keyof typeof iconMap] || BookOpen;

          return (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              detail={stat.detail}
              icon={Icon}
              color={stat.color}
            />
          );
        })}
      </div>

      {cohortClasses.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                Your enrolled cohorts
              </p>
              <h2 className="mt-1 text-xl font-bold">Your YouTube classes</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Class streams are visible only for courses you are enrolled in.
              </p>
            </div>
            <Link href="/my-classes" className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              All classes
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {cohortClasses.slice(0, 4).map((cohortClass) => {
              const embedUrl = cohortClass.meetingUrl
                ? getYouTubeEmbedUrl(cohortClass.meetingUrl)
                : null;

              return (
                <article
                  key={cohortClass.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  {embedUrl ? (
                    <div className="aspect-video bg-black">
                      <iframe
                        className="h-full w-full"
                        src={embedUrl}
                        title={`${cohortClass.name} YouTube class`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-950 px-6 text-center text-sm text-slate-300">
                      Your instructor has not added a YouTube stream yet.
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      {cohortClass.course?.title ?? "Enrolled course"}
                    </p>
                    <h3 className="mt-1 text-lg font-bold">{cohortClass.name}</h3>
                    {(cohortClass.cohortStartDate || cohortClass.cohortEndDate) && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Cohort: {formatCohortDate(cohortClass.cohortStartDate) ?? "TBD"} – {formatCohortDate(cohortClass.cohortEndDate) ?? "TBD"}
                      </p>
                    )}
                    <div className="mt-4">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Clock3 size={14} /> Countdown to class
                      </p>
                      <ClassCountdown
                        startsAt={cohortClass.startsAt}
                        cohortStartDate={cohortClass.cohortStartDate}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Continue learning</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pick up where you left off.
              </p>
            </div>

            <Link
              href="/my-courses"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              View all
            </Link>
          </div>

          <div className="space-y-5">
            {activities.map((course) => (
              <div
                key={course.title}
                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-3 text-white ${course.color}`}>
                    <BookOpen size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {course.category}
                    </p>
                    <h3 className="mt-1 font-semibold">{course.title}</h3>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full ${course.color}`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{course.progress}% complete</span>
                      <span>{course.time}</span>
                    </div>
                  </div>

                  <Link
                    href="/my-courses"
                    aria-label={`Continue ${course.title}`}
                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10"
                  >
                    <PlayCircle size={22} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6">
            <h2 className="text-lg font-bold">Upcoming deadlines</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Stay ahead of your assignments.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { title: "UI Design Project", date: "Oct 06", time: "11:59 PM" },
              { title: "Python Data Exercise", date: "Oct 08", time: "4:00 PM" },
              { title: "Web Development Quiz", date: "Oct 10", time: "9:00 AM" },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  <CalendarDays size={17} />
                  <span className="mt-0.5 text-[10px]">{item.date}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock3 size={13} /> {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/assignments"
            className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            View assignments <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </div>
  );
}