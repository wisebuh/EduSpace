"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

type ClassCountdownProps = {
  startsAt?: string | null;
  cohortStartDate?: string | null;
};

export default function ClassCountdown({ startsAt, cohortStartDate }: ClassCountdownProps) {
  const [now, setNow] = useState<number | null>(null);
  const target = startsAt ?? cohortStartDate;

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!target) {
    return <p className="text-sm font-medium text-slate-500">Class time to be announced</p>;
  }
  if (now === null) {
    return <p className="text-sm font-medium text-slate-500">Calculating countdown...</p>;
  }

  const remaining = new Date(target).getTime() - now;
  if (remaining <= 0) {
    return startsAt ? (
      <p className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400">
        <Radio size={16} className="animate-pulse" /> Class time reached — check the YouTube stream
      </p>
    ) : (
      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
        This cohort has started
      </p>
    );
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  const units = [
    ...(days ? [{ label: "days", value: days }] : []),
    { label: "hours", value: hours },
    { label: "minutes", value: minutes },
    { label: "seconds", value: seconds },
  ];

  return (
    <div
      aria-label={`Class starts in ${units.map(({ label, value }) => `${value} ${label}`).join(", ")}`}
      className="flex flex-wrap gap-2"
    >
      {units.map(({ label, value }) => (
        <span key={label} className="min-w-16 rounded-xl bg-slate-950 px-3 py-2 text-center text-white">
          <span className="block text-lg font-bold tabular-nums">{String(value).padStart(2, "0")}</span>
          <span className="text-[10px] uppercase tracking-wider text-slate-300">{label}</span>
        </span>
      ))}
    </div>
  );
}
