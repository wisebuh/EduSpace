"use client";

import { useEffect, useState } from "react";
import {
  Search,
  PlayCircle,
  FileText,
  Video,
  BookOpen,
  Download,
  Clock3,
  FolderOpen,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { fetchLmsResources } from "@/lib/app-api";

export default function LMSPage() {
  const [resources, setResources] = useState<Array<Record<string, any>>>([]);

  useEffect(() => {
    document.title = "Learning Hub";

    const loadResources = async () => {
      try {
        const items = await fetchLmsResources();
        setResources(
          (items as Array<Record<string, any>>).map((course: Record<string, any>, index: number) => ({
            title: `${course.title} Overview`,
            course: course.title,
            duration: "12 min",
            type: ["Video", "Lesson", "Document"][index % 3],
            icon: ["Video", "PlayCircle", "FileText"][index % 3],
            color: ["bg-blue-600", "bg-emerald-600", "bg-violet-600"][index % 3],
          }))
        );
      } catch {
        setResources([]);
      }
    };

    loadResources();
  }, []);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");

  const filtered = resources.filter((resource) => {
    const matchesType = type === "All" || resource.type === type;
    const matchesSearch = `${resource.title} ${resource.course}`
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div>
      <PageHeader
        eyebrow="Learning management system"
        title="Learning Hub"
        description="Find your lessons, study materials and resources in one place."
      />

      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white sm:p-9">
        <div className="max-w-2xl">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
            YOUR DIGITAL CLASSROOM
          </span>

          <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
            Make time for what you want to learn.
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
            Explore your learning materials, revisit lessons and build your
            knowledge one step at a time.
          </p>

          <a
            href="/my-courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            Browse my courses <BookOpen size={17} />
          </a>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Learning resources", value: String(resources.length), icon: FolderOpen },
          { label: "Video lessons", value: String(resources.filter((item) => item.type === "Video").length), icon: Video },
          { label: "Study documents", value: String(resources.filter((item) => item.type === "Document").length), icon: FileText },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Icon size={22} />
              </span>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <section>
        <div className="mb-5">
          <h2 className="text-xl font-bold">Learning resources</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Browse materials from your enrolled courses.
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lessons and materials..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
          >
            <option>All</option>
            <option>Video</option>
            <option>Lesson</option>
            <option>Document</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((resource) => {
            const iconMap = {
              Video,
              FileText,
              PlayCircle,
            } as const;
            const Icon = iconMap[resource.icon as keyof typeof iconMap] || FolderOpen;

            return (
              <article
                key={resource.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <span className={`rounded-xl p-3 ${resource.color}`}>
                    <Icon size={22} />
                  </span>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {resource.type}
                  </span>
                </div>

                <p className="mt-5 text-xs font-medium text-blue-600 dark:text-blue-400">
                  {resource.course}
                </p>

                <h3 className="mt-1 font-bold">{resource.title}</h3>

                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <Clock3 size={14} /> {resource.duration}
                </p>

                <button
                  onClick={() =>
                    window.alert(
                      `The actual content for "${resource.title}" will be connected when your LMS materials are available.`
                    )
                  }
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  {resource.type === "Document" ? (
                    <Download size={16} />
                  ) : (
                    <PlayCircle size={16} />
                  )}
                  Open resource
                </button>
              </article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
            <FolderOpen className="mx-auto text-slate-400" size={30} />
            <p className="mt-3 font-semibold">No resources found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search or resource type.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}