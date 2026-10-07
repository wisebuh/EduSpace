import Link from "next/link";
import { ArrowUpRight, BookOpen, LifeBuoy, ShieldCheck } from "lucide-react";
import EduSpaceMark from "@/components/brand/EduSpaceMark";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto grid w-full max-w-[1600px] gap-8 px-5 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr] md:items-center lg:px-8">
        <div className="flex items-start gap-3">
          <EduSpaceMark className="h-10 w-10 shrink-0" />
          <div>
            <Link href="/dashboard" className="font-bold tracking-tight text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300">
              EduSpace
            </Link>
            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              A space to learn, build skills, and make progress—one class at a time.
            </p>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:justify-self-end">
          <Link href="/my-courses" className="inline-flex items-center gap-2 text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300">
            <BookOpen size={15} /> Explore courses
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-2 text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300">
            <LifeBuoy size={15} /> Help & support
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-2 text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300">
            <ShieldCheck size={15} /> Privacy & security
          </Link>
          <Link href="/settings" className="inline-flex items-center gap-2 text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300">
            Terms of service <ArrowUpRight size={14} />
          </Link>
        </nav>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800">
        <p className="mx-auto max-w-[1600px] px-5 py-4 text-xs text-slate-500 dark:text-slate-400 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} EduSpace. Learn at your own pace.
        </p>
      </div>
    </footer>
  );
}