"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import {
  UploadCloud,
  FileText,
  Trash2,
  Download,
  BookOpen,
  CheckCircle2,
  Plus,
  ClipboardPlus,
  FileUp,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  fetchMyCourses,
  fetchMyClasses,
  uploadCourseMaterial,
  fetchCourseMaterials,
  deleteCourseMaterial,
  createAssignment,
  AppMaterial,
  AppClass,
  openProtectedFile,
  downloadProtectedFile,
  getMaterialDownloadUrl,
  getMaterialViewUrl,
} from "@/lib/app-api";

export default function CourseMaterialsPage() {
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [materials, setMaterials] = useState<AppMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // Material upload state
  const [materialTitle, setMaterialTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Assignment publish state
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [assignmentType, setAssignmentType] = useState<"ASSIGNMENT" | "PROJECT">("ASSIGNMENT");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [publishingAssignment, setPublishingAssignment] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const availableClasses = useMemo(
    () => classes.filter((item) => item.course?.id === selectedCourseId),
    [classes, selectedCourseId]
  );

  useEffect(() => {
    document.title = "Course Uploads & Materials | EduSpace";

    Promise.all([fetchMyCourses(), fetchMyClasses()])
      .then(([courseRes, classRes]) => {
        const cList = (courseRes.courses || []) as Array<{ id: string; title: string }>;
        const clsList = classRes.classes || [];
        setCourses(cList);
        setClasses(clsList);
        if (cList.length > 0) {
          setSelectedCourseId(cList[0].id);
          const firstClass = clsList.find((cls) => cls.course?.id === cList[0].id);
          if (firstClass) setSelectedClassId(firstClass.id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const loadMaterials = async (courseId: string) => {
    if (!courseId) return;
    try {
      const res = await fetchCourseMaterials(courseId);
      setMaterials(res.materials || []);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Unable to load course materials.");
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      void Promise.resolve().then(() => loadMaterials(selectedCourseId));
    }
  }, [selectedCourseId]);

  const handleMaterialUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !file) return;

    setUploadingMaterial(true);
    setError("");
    setMessage("");

    try {
      await uploadCourseMaterial(selectedCourseId, file, materialTitle || file.name);
      setMessage(`Material "${materialTitle || file.name}" uploaded successfully!`);
      setMaterialTitle("");
      setFile(null);
      await loadMaterials(selectedCourseId);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to upload material.");
    } finally {
      setUploadingMaterial(false);
    }
  };

  const handlePublishAssignment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !assignmentTitle) {
      setError("Please select a valid class cohort and enter a title.");
      return;
    }

    setPublishingAssignment(true);
    setError("");
    setMessage("");

    try {
      await createAssignment(selectedClassId, {
        title: assignmentTitle,
        description: assignmentDesc || undefined,
        type: assignmentType,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        maxScore: Number(maxScore),
      }, assignmentFile ?? undefined);

      setMessage(`${assignmentType === "PROJECT" ? "Course Project" : "Class Assignment"} "${assignmentTitle}" published successfully!`);
      setAssignmentTitle("");
      setAssignmentDesc("");
      setDueDate("");
      setAssignmentFile(null);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to publish assignment.");
    } finally {
      setPublishingAssignment(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteCourseMaterial(id);
      await loadMaterials(selectedCourseId);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to delete material.");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Instructor Space"
        title="Course Uploads & Learning Materials"
        description="Publish class assignments and final projects, and upload study documents, slide decks, and code files."
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 size={18} /> {message}
        </div>
      )}

      {/* Course Picker Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Target Course:
        </label>
        {loading ? (
          <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : (
          <select
            value={selectedCourseId}
            onChange={(e) => {
              const courseId = e.target.value;
              setSelectedCourseId(courseId);
              setSelectedClassId(classes.find((cls) => cls.course?.id === courseId)?.id ?? "");
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        {/* Publish Assignment / Project Form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <ClipboardPlus size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold">Publish Assignment or Project</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Add up to four graded assignments per cohort (7.5% each); projects are graded separately.
              </p>
            </div>
          </div>

          <form onSubmit={handlePublishAssignment} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Class Cohort
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
              >
                {availableClasses.length > 0 ? (
                  availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))
                ) : (
                  <option value="">No active cohorts for this course</option>
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Task Type
              </label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as "ASSIGNMENT" | "PROJECT")}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold outline-none dark:border-slate-800 dark:bg-slate-950"
              >
                <option value="ASSIGNMENT">Class Assignment</option>
                <option value="PROJECT">Final Course Project</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Title
              </label>
              <input
                type="text"
                required
                value={assignmentTitle}
                onChange={(e) => setAssignmentTitle(e.target.value)}
                placeholder="e.g. Project 1: Full-Stack LMS Integration"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Instructions / Description
              </label>
              <textarea
                rows={3}
                value={assignmentDesc}
                onChange={(e) => setAssignmentDesc(e.target.value)}
                placeholder="Details, submission guidelines..."
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assignment File (Optional)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg,.mp4,.zip"
                onChange={(event) => setAssignmentFile(event.target.files?.[0] ?? null)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Students can download the file from their assignment page.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Max Score
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={publishingAssignment || !selectedClassId}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Plus size={16} /> {publishingAssignment ? "Publishing..." : "Publish Task"}
            </button>
          </form>
        </section>

        {/* Upload Course Material Form */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-xl bg-purple-50 p-3 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <FileUp size={22} />
            </span>
            <div>
              <h2 className="text-lg font-bold">Upload Course Document</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Share PDFs, slide decks, ZIP archives, or videos.
              </p>
            </div>
          </div>

          <form onSubmit={handleMaterialUpload} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Display Title
              </label>
              <input
                type="text"
                value={materialTitle}
                onChange={(e) => setMaterialTitle(e.target.value)}
                placeholder="e.g. Lecture 1 Slides & Reading Notes"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Course File
              </label>
              <input
                type="file"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-500 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingMaterial || !file}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700 transition disabled:opacity-50"
            >
              <UploadCloud size={16} /> {uploadingMaterial ? "Uploading..." : "Upload Document"}
            </button>
          </form>

          {/* Uploaded Materials List */}
          <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
            <h3 className="mb-4 font-bold text-slate-900 dark:text-white">
              Course Material Library ({materials.length})
            </h3>

            {materials.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500 dark:border-slate-800">
                No files uploaded for this course yet.
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-400">{formatBytes(item.size)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.mimeType === "application/pdf" && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await openProtectedFile(getMaterialViewUrl(item.id));
                            } catch (error) {
                              setError(error instanceof Error ? error.message : "Unable to open this PDF.");
                            }
                          }}
                          className="rounded-lg p-1.5 text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="View PDF"
                        >
                          <BookOpen size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await downloadProtectedFile(getMaterialDownloadUrl(item.id), item.originalName);
                          } catch (error) {
                            setError(error instanceof Error ? error.message : "Unable to download this file.");
                          }
                        }}
                        className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        title="Download file"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(item.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                        title="Delete material"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
