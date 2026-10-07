"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  UserRound,
  Bell,
  ShieldCheck,
  Palette,
  Check,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/ui/PageHeader";
import { deleteMyAccount, getCurrentUser, updateProfile } from "@/lib/app-api";
import { useThemeStore, AccentColor } from "@/store/theme-store";

const settingsHeaderContent = {
  Profile: {
    title: "Profile",
    description: "Update your basic account details and personal information.",
  },
  Appearance: {
    title: "Appearance",
    description: "Customize the look and feel of your learning workspace.",
  },
  Notifications: {
    title: "Notifications",
    description: "Choose which reminders and updates you want to receive.",
  },
  Security: {
    title: "Security",
    description: "Manage your password and protect your account.",
  },
} as const;

const colorThemes: {
  id: AccentColor;
  label: string;
  bgClass: string;
}[] = [
  { id: "blue", label: "Ocean Blue", bgClass: "bg-blue-600" },
  { id: "emerald", label: "Emerald Green", bgClass: "bg-emerald-600" },
  { id: "purple", label: "Royal Purple", bgClass: "bg-purple-600" },
  { id: "amber", label: "Warm Amber", bgClass: "bg-amber-600" },
];

// Tailwind helper mapping for active accent colors
const accentStyles: Record<
  AccentColor,
  {
    bg: string;
    bgHover: string;
    lightBg: string;
    text: string;
    border: string;
    accent: string;
  }
> = {
  blue: {
    bg: "bg-blue-600",
    bgHover: "hover:bg-blue-700",
    lightBg: "bg-blue-50 dark:bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500",
    accent: "accent-blue-600",
  },
  emerald: {
    bg: "bg-emerald-600",
    bgHover: "hover:bg-emerald-700",
    lightBg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500",
    accent: "accent-emerald-600",
  },
  purple: {
    bg: "bg-purple-600",
    bgHover: "hover:bg-purple-700",
    lightBg: "bg-purple-50 dark:bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500",
    accent: "accent-purple-600",
  },
  amber: {
    bg: "bg-amber-600",
    bgHover: "hover:bg-amber-700",
    lightBg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    accent: "accent-amber-600",
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const accentColor = useThemeStore((state) => state.accentColor);
  const setAccentColor = useThemeStore((state) => state.setAccentColor);

  const activeAccent = accentStyles[accentColor] || accentStyles.blue;

  const [activeTab, setActiveTab] = useState<
    "Profile" | "Appearance" | "Notifications" | "Security"
  >("Profile");

  useEffect(() => {
    document.title = settingsHeaderContent[activeTab].title;
  }, [activeTab]);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [assignmentReminders, setAssignmentReminders] = useState(true);
  const [classReminders, setClassReminders] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await getCurrentUser();
        setName(user?.name ?? "");
        setEmail(user?.email ?? "");
        setEmailNotifications(user?.emailNotificationsEnabled ?? true);
      } catch {
        setSettingsError("Unable to load your settings.");
      }
    };

    loadSettings();
  }, []);

  const navItems = [
    { label: "Profile" as const, icon: UserRound },
    { label: "Appearance" as const, icon: Palette },
    { label: "Notifications" as const, icon: Bell },
    { label: "Security" as const, icon: ShieldCheck },
  ];

  const saveSettings = async () => {
    setSettingsError("");
    try {
      await updateProfile({ name, emailNotificationsEnabled: emailNotifications });
      setSaved(true);
    } catch (error) {
      setSaved(false);
      setSettingsError(error instanceof Error ? error.message : "Unable to save your settings.");
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Delete your account permanently? This action cannot be undone."
      )
    ) {
      return;
    }

    setSettingsError("");
    setIsDeletingAccount(true);
    try {
      await deleteMyAccount();
      router.replace("/sign-in");
    } catch (error) {
      setSettingsError(
        error instanceof Error ? error.message : "Unable to delete your account."
      );
      setIsDeletingAccount(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Personal preferences"
        title={settingsHeaderContent[activeTab].title}
        description={settingsHeaderContent[activeTab].description}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[220px_1fr]">
        {/* Side Nav */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;

            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveTab(item.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                  isActive
                    ? `${activeAccent.lightBg} font-semibold${activeAccent.text}`
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Dynamic Section Container */}
        <div className="space-y-6">
          {activeTab === "Profile" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6">
                <h2 className="text-lg font-bold">Profile information</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Update your basic account details.
                </p>
              </div>

              <div className="mb-6 flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${activeAccent.lightBg} ${activeAccent.text} text-xl font-bold`}
                >
                  {name.trim().charAt(0).toUpperCase() || "W"}
                </div>
                <div>
                  <p className="font-semibold">{name || "Your name"}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Student account
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium">
                    Full name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSaved(false);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSaved(false);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === "Appearance" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6">
                <h2 className="text-lg font-bold">Appearance</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Choose how EduSpace looks on your device.
                </p>
              </div>

              {/* Theme Mode Toggle */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "light" as const, label: "Light mode", icon: Sun, detail: "Bright and clean" },
                  { value: "dark" as const, label: "Dark mode", icon: Moon, detail: "Easy on the eyes" },
                ].map((option) => {
                  const Icon = option.icon;
                  const active = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTheme(option.value)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        active
                          ? `${activeAccent.border}${activeAccent.lightBg}`
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon
                        size={21}
                        className={active ? activeAccent.text : "text-slate-500"}
                      />

                      <span className="flex-1">
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                          {option.detail}
                        </span>
                      </span>

                      {active && <Check size={18} className={activeAccent.text} />}
                    </button>
                  );
                })}
              </div>

              {/* Functional Accent Color Selector */}
              <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                <h3 className="text-sm font-bold">Accent & Highlight Color</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Customize the accent theme across side navigation and primary controls.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {colorThemes.map((c) => {
                    const isSelected = accentColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setAccentColor(c.id);
                          setSaved(false);
                        }}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                          isSelected
                            ? "border-slate-400 bg-slate-100 dark:border-slate-600 dark:bg-slate-800"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span className={`h-4 w-4 rounded-full ${c.bgClass}`} />
                        {c.label}
                        {isSelected && <Check size={14} className="ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Monitor size={15} className="mt-0.5 shrink-0" />
                Your theme preferences are automatically saved in local storage.
              </div>
            </section>
          )}

          {activeTab === "Notifications" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6">
                <h2 className="text-lg font-bold">Notifications</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Choose which reminders you want to receive.
                </p>
              </div>

              <div className="space-y-5">
                {[
                  {
                    label: "Email notifications",
                    description: "Course announcements, new assignments, and learning materials.",
                    checked: emailNotifications,
                    onChange: setEmailNotifications,
                  },
                  {
                    label: "Assignment reminders",
                    description: "Reminders about upcoming deadlines.",
                    checked: assignmentReminders,
                    onChange: setAssignmentReminders,
                  },
                  {
                    label: "Class reminders",
                    description: "Reminders before scheduled classes.",
                    checked: classReminders,
                    onChange: setClassReminders,
                  },
                ].map((item) => (
                  <label key={item.label} className="flex cursor-pointer items-center justify-between gap-4">
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {item.description}
                      </span>
                    </span>

                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => {
                        item.onChange(e.target.checked);
                        setSaved(false);
                      }}
                      className={`h-4 w-4 ${activeAccent.accent}`}
                    />
                  </label>
                ))}
              </div>
            </section>
          )}

          {activeTab === "Security" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6">
                <h2 className="text-lg font-bold">Security</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage your password and security settings.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="current-password" className="mb-2 block text-sm font-medium">
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-medium">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">
                  Delete account
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Permanently delete your account and sign out. This action cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={isDeletingAccount}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={16} />
                  {isDeletingAccount ? "Deleting account..." : "Delete account"}
                </button>
              </div>
            </section>
          )}

          {settingsError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {settingsError}
            </p>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {saved ? "Settings saved." : ""}
            </p>

            <button
              onClick={saveSettings}
              className={`rounded-xl ${activeAccent.bg} ${activeAccent.bgHover} px-5 py-3 text-sm font-semibold text-white transition`}
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}