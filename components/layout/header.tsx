"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  LogOut,
  UserRound,
  CheckCheck,
} from "lucide-react";
import {
  AppNotification,
  fetchNotifications,
  logoutUser,
  markAllNotificationsRead,
  markNotificationRead,
  useAppSession,
} from "@/lib/app-api";
import { useThemeStore } from "@/store/theme-store";
import EduSpaceMark from "@/components/brand/EduSpaceMark";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { user, loading } = useAppSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const authenticated = !loading && !!user;
  const username = user?.name || "Student";

  useEffect(() => {
    if (!authenticated) return;
    let active = true;
    const load = () =>
      fetchNotifications()
        .then((data) => {
          if (!active) return;
          setNotifications(data.notifications);
          setUnreadCount(data.unreadCount);
          setNotificationError("");
        })
        .catch((error: unknown) => {
          if (active) setNotificationError(error instanceof Error ? error.message : "Unable to load notifications.");
        });
    void load();
    const interval = window.setInterval(() => void load(), 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [authenticated]);

  const markReadAndOpen = async (notification: AppNotification) => {
    try {
      await markNotificationRead(notification.id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - (notification.readAt ? 0 : 1)));
      setNotificationsOpen(false);
      router.push(notification.href);
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Unable to open notification.");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu size={22} />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5">
          <EduSpaceMark className="h-9 w-9" />

          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            EduSpace
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          title="Toggle appearance"
          className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        {authenticated ? (
          <>
            <div className="relative">
              <button
                type="button"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
                className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <h2 className="font-semibold text-slate-900 dark:text-white">Notifications</h2>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await markAllNotificationsRead();
                            setNotifications((current) =>
                              current.map((item) => ({ ...item, readAt: new Date().toISOString() }))
                            );
                            setUnreadCount(0);
                          } catch (error) {
                            setNotificationError(error instanceof Error ? error.message : "Unable to update notifications.");
                          }
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  {notificationError && <p role="alert" className="px-3 py-2 text-xs text-red-600">{notificationError}</p>}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length ? notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void markReadAndOpen(notification)}
                        className={`block w-full rounded-xl px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          notification.readAt ? "" : "bg-blue-50/70 dark:bg-blue-500/10"
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-900 dark:text-white">{notification.title}</span>
                            <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{notification.message}</span>
                            <span className="mt-1 block text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</span>
                          </span>
                        </span>
                      </button>
                    )) : (
                      <p className="px-3 py-8 text-center text-sm text-slate-500">You’re all caught up.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setProfileOpen((open) => !open)}
                aria-expanded={profileOpen}
                className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                  {username.charAt(0).toUpperCase()}
                </span>

                <span className="hidden text-left sm:block">
                  <span className="block text-sm font-semibold text-slate-800 dark:text-white">
                    {username}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {user?.role === "ADMIN" ? "Administrator" : user?.role === "TEACHER" ? "Teacher" : "Student"}
                  </span>
                </span>

                <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserRound size={17} />
                    Profile & Settings
                  </Link>

                  <button
                    type="button"
                    onClick={async () => {
                      setProfileOpen(false);
                      try {
                        await logoutUser();
                      } finally {
                        router.push("/sign-in");
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}