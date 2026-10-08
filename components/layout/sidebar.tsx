"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  GraduationCap,
  CalendarDays,
  FileCheck2,
  Settings,
  LogOut,
  X,
  LifeBuoy,
  Upload,
  Megaphone,
  Award,
  MessageSquare,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { logoutUser, useAppSession } from "@/lib/app-api";

const navigation: {
  title: string;
  items: { label: string; href: string; icon: LucideIcon }[];
}[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Admin dashboard", href: "/adminDashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Learning",
    items: [
      { label: "My Courses", href: "/my-courses", icon: BookOpen },
      { label: "My Classes", href: "/my-classes", icon: Users },
      { label: "Assignments", href: "/assignments", icon: ClipboardList },
      { label: "My Submissions", href: "/submissions", icon: FileCheck2 },
      { label: "My Certificates", href: "/certificates", icon: Award },
      { label: "LMS", href: "/lms", icon: GraduationCap },
    ],
  },
  {
    title: "Teaching",
    items: [
      { label: "Manage cohorts", href: "/cohorts", icon: CalendarDays },
      { label: "Grader & Attendance", href: "/gradebook", icon: Award },
      { label: "Course Materials", href: "/courseUpload", icon: Upload },
      { label: "Announcements", href: "/announcements", icon: Megaphone },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: "logout", href: "/sign-in", icon: LogOut },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  mobileOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAppSession();

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-72 flex-col
          border-r border-slate-200 bg-white p-4
          transition-transform duration-200
          dark:border-slate-800 dark:bg-slate-950
          lg:sticky lg:top-16 lg:z-20 lg:h-[calc(100vh-4rem)]
          lg:w-64 lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <span className="font-bold text-slate-900 dark:text-white">
            Navigation
          </span>

          <button
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto">
          {navigation.map((group) => {
            const items = group.items.filter(
              (item) => {
                if (item.href === "/adminDashboard") return user?.role === "ADMIN";
                if (item.href === "/dashboard") return user?.role !== "ADMIN";
                if (["/cohorts", "/courseUpload", "/gradebook"].includes(item.href)) {
                  return user?.role === "TEACHER" || user?.role === "ADMIN";
                }
                if (["/my-courses", "/my-classes", "/lms", "/certificates", "/assignments", "/submissions"].includes(item.href)) {
                  return user?.role === "STUDENT";
                }
                return true;
              }
            );
            if (items.length === 0) return null;

            return (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  if (item.label === "logout") {
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={async () => {
                          onClose();
                          try {
                            await logoutUser();
                          } finally {
                            router.push("/sign-in");
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                      >
                        <Icon size={19} strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900"
                      }`}
                    >
                      <Icon size={19} strokeWidth={1.8} />
                      <span>{item.label}</span>

                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            );
          })}
        </nav>

        {/* Discord Community Card */}
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 text-white shadow-sm border border-indigo-700/50">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare size={18} className="text-indigo-400" />
            <span className="text-sm font-bold text-indigo-100">Student Discord</span>
          </div>

          <p className="mb-3 text-[11px] leading-4 text-indigo-200">
            Join live voice office hours, study rooms, & peer networking.
          </p>

          <a
            href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "https://discord.gg/eduspace"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-indigo-500 transition"
          >
            Join Discord Community <ExternalLink size={13} />
          </a>
        </div>

        <div className="mt-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <div className="mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <LifeBuoy size={18} />
            <span className="text-sm font-semibold">Need help?</span>
          </div>

          <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Get assistance with your courses and assignments.
          </p>

          <Link
            href="/settings"
            onClick={onClose}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Get support →
          </Link>
        </div>
      </aside>
    </>
  );
}