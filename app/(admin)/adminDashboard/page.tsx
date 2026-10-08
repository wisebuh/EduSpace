"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Users,
  Search,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  RefreshCw,
  UserCheck,
  Globe,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  fetchAdminDashboard,
  fetchAdminUsers,
  updateUserRole,
  deleteAdminUser,
  fetchAdminCourses,
  setAdminCoursePublished,
  AdminUserItem,
  AdminCourseItem,
  useAppSession,
} from "@/lib/app-api";

type Overview = Awaited<ReturnType<typeof fetchAdminDashboard>>;

export default function AdminDashboardPage() {
  const { user: currentUser } = useAppSession();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "courses">("users");

  // Overview data
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Users data
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("");
  const [userActionLoadingId, setUserActionLoadingId] = useState<string | null>(null);

  // Courses data
  const [courses, setCourses] = useState<AdminCourseItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [coursePublishedFilter, setCoursePublishedFilter] = useState<"" | "true" | "false">("");
  const [courseActionLoadingId, setCourseActionLoadingId] = useState<string | null>(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load Overview
  const loadOverview = async () => {
    setOverviewLoading(true);
    try {
      const data = await fetchAdminDashboard();
      setOverview(data);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Unable to load the admin overview.",
      });
    } finally {
      setOverviewLoading(false);
    }
  };

  // Load Users
  const loadUsers = async (search = userSearch, role = userRoleFilter) => {
    setUsersLoading(true);
    try {
      const data = await fetchAdminUsers({ q: search || undefined, role: role || undefined });
      setUsers(data.users);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load users list.",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Load Courses
  const loadCourses = async (search = courseSearch, published = coursePublishedFilter) => {
    setCoursesLoading(true);
    try {
      const data = await fetchAdminCourses({
        q: search || undefined,
        published: published || undefined,
      });
      setCourses(data.courses);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to load courses list.",
      });
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Admin Management Dashboard";
    loadOverview();
    loadUsers();
    loadCourses();
  }, []);

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(userSearch, userRoleFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCourses(courseSearch, coursePublishedFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [courseSearch, coursePublishedFilter]);

  // Handle Role Change / Upgrade to Teacher
  const handleRoleChange = async (userId: string, newRole: "STUDENT" | "TEACHER" | "ADMIN") => {
    setUserActionLoadingId(userId);
    setFeedback(null);
    try {
      await updateUserRole(userId, newRole);
      setFeedback({
        type: "success",
        message: `User role successfully updated to ${newRole}.`,
      });
      // Refresh local user list and stats
      loadUsers();
      loadOverview();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update user role.",
      });
    } finally {
      setUserActionLoadingId(null);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;

    setUserActionLoadingId(userId);
    setFeedback(null);
    try {
      await deleteAdminUser(userId);
      setFeedback({
        type: "success",
        message: `User "${userName}" has been deleted.`,
      });
      loadUsers();
      loadOverview();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to delete user.",
      });
    } finally {
      setUserActionLoadingId(null);
    }
  };

  // Handle Toggle Course Publish
  const handleTogglePublish = async (courseId: string, currentPublished: boolean) => {
    setCourseActionLoadingId(courseId);
    setFeedback(null);
    try {
      await setAdminCoursePublished(courseId, !currentPublished);
      setFeedback({
        type: "success",
        message: `Course ${!currentPublished ? "published" : "unpublished"} successfully.`,
      });
      loadCourses();
      loadOverview();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to update course status.",
      });
    } finally {
      setCourseActionLoadingId(null);
    }
  };

  const stats = overview?.stats;
  const cards = [
    {
      label: "Platform users",
      value: stats?.totalUsers,
      note: `${stats?.newUsersThisWeek ?? 0} joined this week`,
      icon: Users,
      color: "blue",
    },
    {
      label: "Courses",
      value: stats?.totalCourses,
      note: `${stats?.publishedCourses ?? 0} published`,
      icon: BookOpen,
      color: "violet",
    },
    {
      label: "Enrollments",
      value: stats?.enrollments,
      note: `${stats?.usersByRole?.STUDENT ?? 0} students`,
      icon: GraduationCap,
      color: "green",
    },
    {
      label: "Awaiting review",
      value: stats?.waitingForGrade,
      note: `${stats?.submissions ?? 0} submissions total`,
      icon: ClipboardCheck,
      color: "orange",
    },
  ] as const;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform Administration"
        title="Admin Dashboard"
        description="Manage accounts, promote teachers, oversee courses, and monitor platform activity."
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/cohorts"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cohorts & Classes
            </Link>
            <Link
              href="/courseUpload"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Course Uploads <ArrowRight size={16} />
            </Link>
          </div>
        }
      />

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Stat Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, color }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
              <span
                className={`rounded-xl p-2.5 ${
                  color === "blue"
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : color === "violet"
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : color === "green"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                }`}
              >
                <Icon size={19} />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value ?? "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{note}</p>
          </article>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "users"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck size={18} />
          User Management
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {stats?.totalUsers ?? users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "courses"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <BookOpen size={18} />
          Course Oversight
          <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {stats?.totalCourses ?? courses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <ShieldCheck size={18} />
          Activity & Insights
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === "users" && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Platform Users</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Upgrade students to teachers, assign admin rights, and manage account status.
              </p>
            </div>

            <button
              onClick={() => loadUsers()}
              disabled={usersLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} className={usersLoading ? "animate-spin" : ""} />
              Refresh Users
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: "All Roles", value: "" },
                { label: "Students", value: "STUDENT" },
                { label: "Teachers", value: "TEACHER" },
                { label: "Admins", value: "ADMIN" },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setUserRoleFilter(filter.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${
                    userRoleFilter === filter.value
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Current Role</th>
                  <th className="px-4 py-3.5">Activity</th>
                  <th className="px-4 py-3.5">Registered</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {usersLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Loader2 size={24} className="mx-auto mb-2 animate-spin text-blue-600" />
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No users match your search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((person) => {
                    const isCurrentUser = person.id === currentUser?.id;
                    const isActing = userActionLoadingId === person.id;

                    return (
                      <tr
                        key={person.id}
                        className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      >
                        {/* Name & Email */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            {person.avatarUrl ? (
                              <img
                                src={person.avatarUrl}
                                alt={person.name}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                {person.name[0]?.toUpperCase() ?? "U"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-900 dark:text-white">
                                {person.name}
                                {isCurrentUser && (
                                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                {person.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                              person.role === "ADMIN"
                                ? "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                                : person.role === "TEACHER"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                            }`}
                          >
                            {person.role === "ADMIN" && <ShieldCheck size={12} />}
                            {person.role === "TEACHER" && <GraduationCap size={12} />}
                            {person.role === "STUDENT" && <Users size={12} />}
                            {person.role}
                          </span>
                        </td>

                        {/* Activity */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {person.role === "TEACHER" && (
                            <span>{person._count.coursesTeaching} course(s) teaching</span>
                          )}
                          {person.role === "STUDENT" && (
                            <span>{person._count.enrollments} active enrollment(s)</span>
                          )}
                          {person.role === "ADMIN" && <span>Platform Administrator</span>}
                        </td>

                        {/* Joined Date */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {new Date(person.createdAt).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Quick Upgrade to Teacher button if student */}
                            {person.role === "STUDENT" && (
                              <button
                                onClick={() => handleRoleChange(person.id, "TEACHER")}
                                disabled={isActing}
                                title="Promote Student to Teacher"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-600 active:scale-95 disabled:opacity-50"
                              >
                                {isActing ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <GraduationCap size={13} />
                                )}
                                Upgrade to Teacher
                              </button>
                            )}

                            {/* Role Select Dropdown */}
                            <select
                              value={person.role}
                              disabled={isActing || isCurrentUser}
                              onChange={(e) =>
                                handleRoleChange(
                                  person.id,
                                  e.target.value as "STUDENT" | "TEACHER" | "ADMIN"
                                )
                              }
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                            >
                              <option value="STUDENT">Student</option>
                              <option value="TEACHER">Teacher</option>
                              <option value="ADMIN">Admin</option>
                            </select>

                            {/* Delete User */}
                            {!isCurrentUser && (
                              <button
                                onClick={() => handleDeleteUser(person.id, person.name)}
                                disabled={isActing}
                                title="Delete User Account"
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-950/40"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: COURSE OVERSIGHT */}
      {activeTab === "courses" && (
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Course Oversight</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Review course programs, publish or unpublish catalog courses.
              </p>
            </div>

            <button
              onClick={() => loadCourses()}
              disabled={coursesLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <RefreshCw size={14} className={coursesLoading ? "animate-spin" : ""} />
              Refresh Courses
            </button>
          </div>

          {/* Course Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses by title..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-950 dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { label: "All Status", value: "" as const },
                { label: "Published", value: "true" as const },
                { label: "Drafts", value: "false" as const },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setCoursePublishedFilter(filter.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition ${
                    coursePublishedFilter === filter.value
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Courses List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/60 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3.5">Course Title</th>
                  <th className="px-4 py-3.5">Teacher</th>
                  <th className="px-4 py-3.5">Enrollments</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {coursesLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <Loader2 size={24} className="mx-auto mb-2 animate-spin text-blue-600" />
                      Loading courses...
                    </td>
                  </tr>
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No courses found.
                    </td>
                  </tr>
                ) : (
                  courses.map((course) => {
                    const isActing = courseActionLoadingId === course.id;

                    return (
                      <tr
                        key={course.id}
                        className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                          {course.title}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-300">
                          {course.teacher.name}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {course._count.enrollments} student(s)
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${
                              course.published
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                            }`}
                          >
                            <Globe size={11} />
                            {course.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => handleTogglePublish(course.id, course.published)}
                            disabled={isActing}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-95 disabled:opacity-50 ${
                              course.published
                                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                : "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700"
                            }`}
                          >
                            {isActing ? (
                              <Loader2 size={13} className="animate-spin inline mr-1" />
                            ) : null}
                            {course.published ? "Unpublish" : "Publish to Catalog"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: OVERVIEW & RECENT ACTIVITY */}
      {activeTab === "overview" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Recent Registrations */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Users</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Latest account registrations
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                {stats?.totalUsers ?? 0} total
              </span>
            </div>

            {overview?.recentUsers.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {overview.recentUsers.map((person) => (
                  <div key={person.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {person.name}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {person.email}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {person.role}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {new Date(person.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                {overview ? "No users yet." : "Loading users..."}
              </p>
            )}
          </section>

          {/* Recent Courses */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Courses</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Newly created learning programs
              </p>
            </div>

            {overview?.recentCourses.length ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {overview.recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {course.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Instructor: {course.teacher.name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        course.published
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}
                    >
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                {overview ? "No courses yet." : "Loading courses..."}
              </p>
            )}

            <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Link
                href="/cohorts"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Manage courses & cohorts →
              </Link>
              <Link
                href="/announcements"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Announcements →
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
