"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { FileUp, ClipboardPlus } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  AppClass,
  AppCourse,
  createAssignment,
  fetchCourses,
  fetchMyClasses,
  uploadCourseMaterial,
} from "@/lib/app-api";

export default function CourseUploadPage() {
  const [courses, setCourses] = useState<AppCourse[]>([]);
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [courseId, setCourseId] = useState("");
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const availableClasses = useMemo(
    () => classes.filter((item) => item.course?.id === courseId),
    [classes, courseId]
  );

  useEffect(() => {
    document.title = "Teaching uploads";
    Promise.all([fetchCourses(), fetchMyClasses()])
      .then(([courseResult, classResult]) => {
        const nextCourses = courseResult.courses ?? [];
        const nextClasses = classResult.classes ?? [];
        setCourses(nextCourses);
        setClasses(nextClasses);
        setCourseId(nextCourses[0]?.id ?? "");
        setClassId(nextClasses.find((item) => item.course?.id === nextCourses[0]?.id)?.id ?? "");
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load your courses.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!classId) {
      setError("Create a cohort/class before publishing an assignment.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await createAssignment(classId, {
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim() || undefined,
        dueDate: form.get("dueDate") ? new Date(String(form.get("dueDate"))).toISOString() : undefined,
        maxScore: Number(form.get("maxScore") ?? 100),
      });
      formElement.reset();
      setMessage("Assignment published. Enrolled students received an in-app notification. Email is sent when SMTP is configured and enabled in their settings.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to publish this assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || !file.size) {
      setError("Choose a course file to upload.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await uploadCourseMaterial(
        courseId,
        file,
        String(form.get("title") ?? "").trim() || undefined
      );
      formElement.reset();
      setMessage("Course material uploaded. Enrolled students received an in-app notification. Email is sent when SMTP is configured and enabled in their settings.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to upload this file.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Instructor tools"
        title="Assignments & course uploads"
        description="Publish work and learning materials to your courses. Enrolled students receive in-app alerts; email delivery requires SMTP to be configured by the administrator."
      />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}

      {loading ? (
        <p role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Loading teaching courses...</p>
      ) : courses.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold">No courses available</h2>
          <p className="mt-2 text-sm text-slate-500">Create a course and cohort before uploading assignments or materials.</p>
          <a href="/cohorts" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Manage cohorts</a>
        </section>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-xl bg-blue-50 p-3 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"><ClipboardPlus size={21} /></span>
              <div><h2 className="text-lg font-bold">Upload an assignment</h2><p className="text-sm text-slate-500">Make classwork visible to your cohort.</p></div>
            </div>
            <label className="mb-4 block text-sm font-medium">
              Course
              <select value={courseId} onChange={(event) => {
                const nextCourseId = event.target.value;
                setCourseId(nextCourseId);
                setClassId(classes.find((item) => item.course?.id === nextCourseId)?.id ?? "");
              }} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
            </label>
            <form onSubmit={handleAssignment} className="space-y-4">
              <label className="block text-sm font-medium">
                Class / cohort
                <select value={classId} onChange={(event) => setClassId(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                  {availableClasses.length ? availableClasses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">No classes in this course</option>}
                </select>
              </label>
              <label className="block text-sm font-medium">Assignment title<input name="title" required minLength={2} maxLength={150} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
              <label className="block text-sm font-medium">Instructions<textarea name="description" rows={4} maxLength={5000} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">Due date<input name="dueDate" type="datetime-local" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
                <label className="block text-sm font-medium">Maximum score<input name="maxScore" type="number" min={1} max={1000} defaultValue={100} required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
              </div>
              <button disabled={saving || !classId} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? "Publishing..." : "Publish assignment"}</button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="rounded-xl bg-violet-50 p-3 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"><FileUp size={21} /></span>
              <div><h2 className="text-lg font-bold">Upload course material</h2><p className="text-sm text-slate-500">Share notes, slides, documents, images, or videos.</p></div>
            </div>
            <form onSubmit={handleMaterial} className="space-y-4">
              <label className="block text-sm font-medium">
                Course
                <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950">
                  {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Display title<input name="title" maxLength={150} placeholder="Uses the file name if left blank" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-950" /></label>
              <label className="block text-sm font-medium">File<input name="file" type="file" required accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.mp4,.zip" className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950" /><span className="mt-2 block text-xs text-slate-500">Maximum 25 MB. PDF, Office, TXT, CSV, PNG/JPG, MP4, and ZIP.</span></label>
              <button disabled={saving} className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{saving ? "Uploading..." : "Upload material"}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
