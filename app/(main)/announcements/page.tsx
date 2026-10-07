"use client";

import { FormEvent, useEffect, useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  AppAnnouncement,
  AppCourse,
  createAnnouncement,
  deleteAnnouncement,
  fetchAnnouncements,
  fetchCourses,
  useAppSession,
} from "@/lib/app-api";

export default function AnnouncementsPage() {
  const { user } = useAppSession();
  const canPost = user?.role === "TEACHER" || user?.role === "ADMIN";
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [announcements, setAnnouncements] = useState<AppAnnouncement[]>([]);
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAnnouncements = async () => {
    const result = await fetchAnnouncements();
    setAnnouncements(result.announcements ?? []);
  };

  useEffect(() => {
    document.title = "Announcements";
    const load = Promise.resolve().then(() => canPost
      ? Promise.all([fetchCourses(), fetchAnnouncements()]).then(([courseResult, announcementResult]) => {
          const nextCourses = courseResult.courses ?? [];
          setCourses(nextCourses);
          setCourseId(nextCourses[0]?.id ?? "");
          setAnnouncements(announcementResult.announcements ?? []);
        })
      : loadAnnouncements());
    void load.catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load announcements.");
    }).finally(() => setLoading(false));
  }, [canPost]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createAnnouncement({
        courseId,
        title: String(form.get("title") ?? "").trim(),
        body: String(form.get("body") ?? "").trim(),
      });
      formElement.reset();
      await loadAnnouncements();
      setMessage("Announcement posted. Enrolled students received an in-app notification. Email is sent when SMTP is configured and enabled in their settings.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to publish announcement.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (announcement: AppAnnouncement) => {
    setError("");
    setMessage("");
    try {
      await deleteAnnouncement(announcement.id);
      setAnnouncements((current) => current.filter((item) => item.id !== announcement.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete announcement.");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={canPost ? "Teaching updates" : "Course updates"}
        title="Announcements"
        description={canPost
          ? "Post course announcements for enrolled students. In-app alerts work automatically; email delivery requires SMTP configuration."
          : "Updates posted by your instructors for courses you are enrolled in."}
      />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}

      {canPost && courses.length > 0 && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Megaphone size={20} className="text-blue-600" />Post an announcement</h2>
          <label className="block text-sm font-medium">Course
            <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium">Title<input name="title" required minLength={2} maxLength={150} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
          <label className="block text-sm font-medium">Message<textarea name="body" required minLength={2} maxLength={5000} rows={4} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
          <button disabled={saving || !courseId} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Posting..." : "Post announcement"}</button>
        </form>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading announcements...</div>
      ) : announcements.length ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">{announcement.course.title}</p>
                  <h2 className="mt-1 text-lg font-bold">{announcement.title}</h2>
                </div>
                {canPost && (
                  <button type="button" onClick={() => void handleDelete(announcement)} aria-label={`Delete ${announcement.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{announcement.body}</p>
              <p className="mt-4 text-xs text-slate-400">{announcement.author.name} · {new Date(announcement.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <Megaphone className="mx-auto text-slate-400" size={24} />
          <p className="mt-3 font-semibold">No announcements yet</p>
          <p className="mt-1 text-sm text-slate-500">New course updates will appear here.</p>
        </div>
      )}
    </div>
  );
}
