import type { LucideIcon } from "lucide-react";

export default function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "violet" | "orange";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <span className={`rounded-xl p-3 ${styles[color]}`}>
          <Icon size={21} />
        </span>
      </div>

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </div>
  );
}