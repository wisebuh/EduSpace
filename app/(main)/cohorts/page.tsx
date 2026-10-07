"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, CirclePlus, Play, Save } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  AppClass,
  AppCourse,
  ClassPayload,
  createCourse,
  createCourseClass,
  fetchCourses,
  updateCourseClass,
} from "@/lib/app-api";
import { formatCohortDate } from "@/lib/youtube";

const initialStartDate = "2027-01-01";

function toDateInput(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function toDateTimeInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function classPayload(form: HTMLFormElement): ClassPayload {
  const values = new FormData(form);
  const startsAt = String(values.get("startsAt") ?? "");
  return {
    name: String(values.get("name") ?? "").trim(),
    schedule: String(values.get("schedule") ?? "").trim() || null,
    startsAt: startsAt ? new Date(startsAt).toISOString() : null,
    cohortStartDate: String(values.get("cohortStartDate") ?? "") || null,
    cohortEndDate: String(values.get("cohortEndDate") ?? "") || null,
    meetingUrl: String(values.get("meetingUrl") ?? "").trim() || null,
  };
}

export default function CohortManagementPage() {
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [newCohortName, setNewCohortName] = useState("January 2027 Cohort");
  const [newStartDate, setNewStartDate] = useState(initialStartDate);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");

  const loadCourses = async (preferredCourseId?: string) => {
    const result = await fetchCourses();
    const nextCourses = result.courses ?? [];
    setCourses(nextCourses);
    setSelectedCourseId((current) => {
      const preferred = preferredCourseId ?? current;
      return nextCourses.some((course) => course.id === preferred)
        ? preferred
        : nextCourses[0]?.id ?? "";
    });
  };

  useEffect(() => {
    document.title = "Manage Cohorts";
    void Promise.resolve().then(() => loadCourses()).catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : "Unable to load courses.");
    }).finally(() => setLoading(false));
  }, []);

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  const handleCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await createCourse({
        title: newCourseTitle.trim(),
        description: newCourseDescription.trim() || undefined,
        published: true,
      });
      await loadCourses(result.course.id);
      setNewCourseTitle("");
      setNewCourseDescription("");
      setMessage("Course created. Add its January 2027 cohort below.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create this course.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse || !newStartDate) {
      setError("Choose a course and cohort start date.");
      return;
    }

    const payload = classPayload(event.currentTarget);
    if (!payload.cohortEndDate) {
      setError("Add an end date for this cohort.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createCourseClass(selectedCourse.id, payload);
      await loadCourses(selectedCourse.id);
      setMessage("Cohort created. Enrolled students will see its class and countdown on their dashboards.");
      setNewCohortName("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create this cohort.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (
    event: FormEvent<HTMLFormElement>,
    cohortClass: AppClass,
  ) => {
    event.preventDefault();
    if (!selectedCourse) return;

    const payload = classPayload(event.currentTarget);
    if (!payload.cohortStartDate || !payload.cohortEndDate) {
      setError("Each cohort needs a start date and an end date.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateCourseClass(cohortClass.id, payload);
      await loadCourses(selectedCourse.id);
      setEditingClassId(null);
      setMessage("Cohort details saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save cohort details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor tools"
        title="Manage cohorts"
        description="Set each cohort’s dates, schedule, and YouTube class link. Enrolled students see only the classes for their courses."
      />

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="text-lg font-bold">Create your first course</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Then add its cohort with a January 2027 start date and YouTube class link.
          </p>
          <form onSubmit={handleCreateCourse} className="mt-5 grid gap-4">
            <label className="text-sm font-medium">
              Course title
              <input
                required
                minLength={3}
                maxLength={120}
                value={newCourseTitle}
                onChange={(event) => setNewCourseTitle(event.target.value)}
                className="mt-2 w-full max-w-xl rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <label className="text-sm font-medium">
              Description
              <textarea
                maxLength={2000}
                rows={3}
                value={newCourseDescription}
                onChange={(event) => setNewCourseDescription(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <div>
              <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Creating course..." : "Create course"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <label htmlFor="course-select" className="mb-2 block text-sm font-semibold">
              Course
            </label>
            <select
              id="course-select"
              value={selectedCourseId}
              onChange={(event) => setSelectedCourseId(event.target.value)}
              className="w-full max-w-xl rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </section>

          {selectedCourse && (
            <>
              <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <span className="rounded-xl bg-blue-600 p-2.5 text-white"><CirclePlus size={20} /></span>
                  <div>
                    <h2 className="font-bold">Add a cohort</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      The first cohort is prefilled for January 2027; adjust the exact dates as needed.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-medium">
                    Cohort name
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={120}
                      value={newCohortName}
                      onChange={(event) => setNewCohortName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    YouTube video or live stream URL
                    <input
                      name="meetingUrl"
                      type="url"
                      placeholder="https://www.youtube.com/live/..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Cohort start date
                    <input
                      name="cohortStartDate"
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(event) => setNewStartDate(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Cohort end date
                    <input
                      name="cohortEndDate"
                      type="date"
                      required
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    First class date and time
                    <input
                      name="startsAt"
                      type="datetime-local"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <label className="text-sm font-medium">
                    Schedule notes
                    <input
                      name="schedule"
                      maxLength={200}
                      placeholder="e.g. Tuesdays at 6:00 PM"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950"
                    />
                  </label>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <CirclePlus size={16} /> {saving ? "Creating..." : "Create cohort"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={19} className="text-blue-600" />
                  <h2 className="text-lg font-bold">Cohorts for {selectedCourse.title}</h2>
                </div>
                {(selectedCourse.classes ?? []).length > 0 ? (
                  (selectedCourse.classes ?? []).map((cohortClass) => (
                    <article key={cohortClass.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                      {editingClassId === cohortClass.id ? (
                        <form onSubmit={(event) => handleUpdate(event, cohortClass)} className="grid gap-4 md:grid-cols-2">
                          <label className="text-sm font-medium">
                            Cohort name
                            <input name="name" required defaultValue={cohortClass.name} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" />
                          </label>
                          <label className="text-sm font-medium">
                            YouTube video or live stream URL
                            <input name="meetingUrl" type="url" defaultValue={cohortClass.meetingUrl ?? ""} placeholder="https://www.youtube.com/live/..." className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" />
                          </label>
                          <label className="text-sm font-medium">
                            Cohort start date
                            <input name="cohortStartDate" type="date" required defaultValue={toDateInput(cohortClass.cohortStartDate)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" />
                          </label>
                          <label className="text-sm font-medium">
                            Cohort end date
                            <input name="cohortEndDate" type="date" required defaultValue={toDateInput(cohortClass.cohortEndDate)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" />
                          </label>
                          <label className="text-sm font-medium">
                            First class date and time
                            <input name="startsAt" type="datetime-local" defaultValue={toDateTimeInput(cohortClass.startsAt)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" />
                          </label>
                          <label className="text-sm font-medium">
                            Schedule notes
                            <input name="schedule" maxLength={200} defaultValue={cohortClass.schedule ?? ""} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" />
                          </label>
                          <div className="flex gap-3 md:col-span-2">
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                              <Save size={16} /> {saving ? "Saving..." : "Save changes"}
                            </button>
                            <button type="button" onClick={() => setEditingClassId(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold dark:border-slate-700">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                          <div>
                            <h3 className="text-lg font-bold">{cohortClass.name}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatCohortDate(cohortClass.cohortStartDate) ?? "Start date not set"}
                              {" – "}
                              {formatCohortDate(cohortClass.cohortEndDate) ?? "End date not set"}
                            </p>
                            {cohortClass.meetingUrl && (
                              <a href={cohortClass.meetingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                                <Play size={16} fill="currentColor" /> Open YouTube link
                              </a>
                            )}
                          </div>
                          <button type="button" onClick={() => setEditingClassId(cohortClass.id)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                            Edit cohort
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700">
                    No cohorts for this course yet.
                  </p>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
