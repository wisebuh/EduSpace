"use client";

import { useEffect, useState } from "react";
import {
  Search,
  CheckCircle2,
  Edit3,
  Download,
  Calendar,
  X,
  Award,
  BookOpen,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import {
  fetchMyClasses,
  fetchGradebook,
  updateStudentGrade,
  updateExamGrade,
  recordAttendance,
  downloadSubmissionFile,
  AppClass,
  AppGradebook,
} from "@/lib/app-api";

export default function InstructorGradebookPage() {
  const [classes, setClasses] = useState<AppClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [gradebook, setGradebook] = useState<AppGradebook | null>(null);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingGradebook, setLoadingGradebook] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");

  // Grade Edit Modal state
  const [editingGrade, setEditingGrade] = useState<{
    student: { id: string; name: string };
    assignment: { id: string; title: string; maxScore: number };
    currentGrade: number | null;
    currentFeedback: string;
    submission: {
      submitted: boolean;
      id: string | null;
      content: string | null;
      fileUrl: string | null;
      fileName: string | null;
      submittedAt: string | null;
    };
  } | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

  // Attendance Modal state
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceState, setAttendanceState] = useState<
    Record<string, "PRESENT" | "ABSENT" | "EXCUSED" | "LATE">
  >({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [examDrafts, setExamDrafts] = useState<Record<string, string>>({});
  const [savingExamStudentId, setSavingExamStudentId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Gradebook & Attendance | EduSpace";

    fetchMyClasses()
      .then((res) => {
        const clsList = res.classes || [];
        setClasses(clsList);
        setLoadError("");
        if (clsList.length > 0) {
          setSelectedClassId(clsList[0].id);
        } else {
          setLoadingGradebook(false);
        }
        setLoadingClasses(false);
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : "Unable to load your classes.");
        setLoadingGradebook(false);
        setLoadingClasses(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    fetchGradebook(selectedClassId)
      .then((data) => {
        setGradebook(data);
        setLoadError("");
        setLoadingGradebook(false);
      })
      .catch((error: unknown) => {
        setGradebook(null);
        setLoadError(error instanceof Error ? error.message : "Unable to load the gradebook.");
        setLoadingGradebook(false);
      });
  }, [selectedClassId]);

  const handleOpenAttendanceModal = () => {
    if (!gradebook) return;
    const initialState: Record<string, "PRESENT" | "ABSENT" | "EXCUSED" | "LATE"> = {};
    gradebook.students.forEach((s) => {
      initialState[s.student.id] = "PRESENT";
    });
    setAttendanceState(initialState);
    setAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId) return;
    setSavingAttendance(true);
    try {
      const records = Object.entries(attendanceState).map(([studentId, status]) => ({
        studentId,
        date: attendanceDate,
        status,
      }));
      await recordAttendance(selectedClassId, { records });
      // Reload gradebook
      const updated = await fetchGradebook(selectedClassId);
      setGradebook(updated);
      setAttendanceModalOpen(false);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to save attendance.");
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedClassId || !editingGrade) return;
    setSavingGrade(true);
    try {
      await updateStudentGrade(selectedClassId, {
        studentId: editingGrade.student.id,
        assignmentId: editingGrade.assignment.id,
        grade: editingGrade.currentGrade ?? 0,
        feedback: editingGrade.currentFeedback,
      });
      // Reload gradebook
      const updated = await fetchGradebook(selectedClassId);
      setGradebook(updated);
      setEditingGrade(null);
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to update grade.");
    } finally {
      setSavingGrade(false);
    }
  };

  const handleSaveExamGrade = async (studentId: string, currentScore: number | null) => {
    const draft = examDrafts[studentId] ?? (currentScore === null ? "" : String(currentScore));
    const score = Number(draft);
    if (draft.trim() === "" || !Number.isInteger(score) || score < 0 || score > 100) {
      alert("Enter a whole-number exam score from 0 to 100.");
      return;
    }

    setSavingExamStudentId(studentId);
    try {
      await updateExamGrade(selectedClassId, { studentId, score });
      setGradebook(await fetchGradebook(selectedClassId));
      setExamDrafts((current) => {
        const next = { ...current };
        delete next[studentId];
        return next;
      });
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to save the exam score.");
    } finally {
      setSavingExamStudentId(null);
    }
  };

  const filteredStudents = (gradebook?.students || []).filter((s) =>
    s.student.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        eyebrow="Instructor Portal"
        title="Class Gradebook & Attendance"
        description="View student performance, manage attendance, and edit grades for assignments and projects."
      />

      {loadError && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {loadError}
        </p>
      )}

      {/* Class Selector & Header Controls */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Class:
          </label>
          {loadingClasses ? (
            <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => {
                setLoadingGradebook(true);
                setGradebook(null);
                setSelectedClassId(e.target.value);
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.course?.title})
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedClassId && (
          <button
            onClick={handleOpenAttendanceModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Calendar size={18} /> Mark Attendance Session
          </button>
        )}
      </div>

      {loadingGradebook ? (
        <div className="flex flex-col items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading gradebook matrix...</p>
        </div>
      ) : !gradebook ? (
        <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-800">
          <BookOpen className="mx-auto text-slate-400" size={40} />
          <h3 className="mt-4 text-lg font-bold">No Gradebook Data</h3>
          <p className="mt-1 text-sm text-slate-500">
            Select an active class cohort to manage student grades and attendance.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Total Enrolled Students</p>
              <p className="mt-2 text-2xl font-bold">{gradebook.students.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Class Assignments</p>
              <p className="mt-2 text-2xl font-bold">{gradebook.assignments.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Course Projects</p>
              <p className="mt-2 text-2xl font-bold">{gradebook.projects.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500">Eligible for Certificate</p>
              <p className="mt-2 text-2xl font-bold text-amber-500">
                {gradebook.students.filter((s) => s.isEligibleForCertificate).length} /{" "}
                {gradebook.students.length}
              </p>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter students by name or email..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          {/* Gradebook Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4 text-center">Attendance · {gradebook.gradingWeights.attendance}%</th>
                  <th className="p-4 text-center">Assignments · 4 × {gradebook.gradingWeights.assignment}%</th>
                  <th className="p-4 text-center">Course Projects</th>
                  <th className="p-4 text-center">Exam · {gradebook.gradingWeights.exam}%</th>
                  <th className="p-4 text-center">Weighted Total / 100</th>
                  <th className="p-4 text-center">Certificate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStudents.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    {/* Student Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {item.student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {item.student.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Attendance % */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          item.attendancePercentage >= 90
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {item.attendancePercentage}% ({item.presentCount}/{item.totalSessions} sessions)
                      </span>
                    </td>

                    {/* Class Assignments Grid */}
                    <td className="p-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {item.assignmentSubmissions.slice(0, 4).map((sub) => (
                          <button
                            key={sub.assignmentId}
                            onClick={() =>
                              setEditingGrade({
                                student: item.student,
                                assignment: {
                                  id: sub.assignmentId,
                                  title: sub.title,
                                  maxScore: sub.maxScore,
                                },
                                currentGrade: sub.grade,
                                currentFeedback: sub.feedback || "",
                                submission: {
                                  submitted: sub.submitted,
                                  id: sub.submissionId,
                                  content: sub.content,
                                  fileUrl: sub.fileUrl,
                                  fileName: sub.fileName,
                                  submittedAt: sub.submittedAt,
                                },
                              })
                            }
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition hover:ring-2 hover:ring-blue-500 ${
                              typeof sub.grade === "number"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                : sub.submitted
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            }`}
                            title={`${sub.title}: ${typeof sub.grade === "number" ? `${sub.grade}/${sub.maxScore}` : sub.submitted ? "Submitted; click to grade" : "Not submitted; click to enter a grade"}`}
                            aria-label={`Grade ${sub.title} for ${item.student.name}`}
                          >
                            <span>{sub.title}</span>
                            <span className="font-bold">
                              {typeof sub.grade === "number" ? `${sub.grade}/${sub.maxScore}` : sub.submitted ? "Submitted" : "Pending"}
                            </span>
                            <Edit3 size={12} className="opacity-60" />
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* Projects Grid */}
                    <td className="p-4 text-center">
                      <div className="flex flex-wrap justify-center gap-2">
                        {item.projectSubmissions.map((sub) => (
                          <button
                            key={sub.assignmentId}
                            onClick={() =>
                              setEditingGrade({
                                student: item.student,
                                assignment: {
                                  id: sub.assignmentId,
                                  title: sub.title,
                                  maxScore: sub.maxScore,
                                },
                                currentGrade: sub.grade,
                                currentFeedback: sub.feedback || "",
                                submission: {
                                  submitted: sub.submitted,
                                  id: sub.submissionId,
                                  content: sub.content,
                                  fileUrl: sub.fileUrl,
                                  fileName: sub.fileName,
                                  submittedAt: sub.submittedAt,
                                },
                              })
                            }
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition hover:ring-2 hover:ring-purple-500 ${
                              typeof sub.grade === "number"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                                : sub.submitted
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                            }`}
                            title={`${sub.title}: ${typeof sub.grade === "number" ? `${sub.grade}/${sub.maxScore}` : sub.submitted ? "Submitted; click to grade" : "Not submitted; click to enter a grade"}`}
                            aria-label={`Grade project ${sub.title} for ${item.student.name}`}
                          >
                            <span>{sub.title}</span>
                            <span className="font-bold">
                              {typeof sub.grade === "number" ? `${sub.grade}/${sub.maxScore}` : sub.submitted ? "Submitted" : "Pending"}
                            </span>
                            <Edit3 size={12} className="opacity-60" />
                          </button>
                        ))}
                      </div>
                      {item.assignmentSubmissions.length === 0 && (
                        <p className="text-xs text-slate-400">No assignments yet</p>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          aria-label={`Exam score for ${item.student.name}`}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={examDrafts[item.student.id] ?? (item.examScore === null ? "" : String(item.examScore))}
                          onChange={(event) =>
                            setExamDrafts((current) => ({
                              ...current,
                              [item.student.id]: event.target.value,
                            }))
                          }
                          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm dark:border-slate-700 dark:bg-slate-950"
                          placeholder="0–100"
                        />
                        <button
                          type="button"
                          onClick={() => void handleSaveExamGrade(item.student.id, item.examScore)}
                          disabled={savingExamStudentId === item.student.id}
                          className="rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingExamStudentId === item.student.id ? "Saving" : "Save"}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.examScore === null ? "Not graded" : `${item.examScore}/100 · ${item.gradeBreakdown.examPoints}/50 pts`}
                      </p>
                    </td>

                    {/* Overall Grade */}
                    <td className="p-4 text-center font-bold">
                      {typeof item.overallGrade === "number" ? `${item.overallGrade}/100` : "N/A"}
                      <p className="mt-1 text-xs font-normal text-slate-500">
                        A {item.gradeBreakdown.assignmentPoints}/30 · Att {item.gradeBreakdown.attendancePoints}/20 · Exam {item.gradeBreakdown.examPoints}/50
                      </p>
                      {item.projectSubmissions.length === 0 && (
                        <p className="text-xs text-slate-400">No projects yet</p>
                      )}
                    </td>

                    {/* Certificate Eligibility */}
                    <td className="p-4 text-center">
                      {item.certificate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 size={14} /> Issued
                        </span>
                      ) : item.isEligibleForCertificate ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <Award size={14} /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                          Ineligible (&lt;90% or incomplete)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grade Edit Modal */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Edit Student Grade
              </h3>
              <button
                onClick={() => setEditingGrade(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Student</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {editingGrade.student.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Assignment / Project</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {editingGrade.assignment.title} (Max: {editingGrade.assignment.maxScore})
                </p>
              </div>

              <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Submitted work</h4>
                {editingGrade.submission.submitted ? (
                  <div className="mt-2 space-y-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Submitted {editingGrade.submission.submittedAt
                        ? new Date(editingGrade.submission.submittedAt).toLocaleString()
                        : ""}
                    </p>
                    {editingGrade.submission.content ? (
                      <div className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-950">
                        {editingGrade.submission.content}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No written answer was included.</p>
                    )}
                    {editingGrade.submission.fileUrl && (
                      <a
                        href={editingGrade.submission.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex text-sm font-semibold text-blue-600 underline dark:text-blue-400"
                      >
                        Open submitted file
                      </a>
                    )}
                    {editingGrade.submission.fileName && (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await downloadSubmissionFile(
                              editingGrade.submission.id!,
                              editingGrade.submission.fileName!
                            );
                          } catch (error) {
                            alert(error instanceof Error ? error.message : "Unable to download submitted work.");
                          }
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Download size={15} /> Download {editingGrade.submission.fileName}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">This student has not submitted work yet.</p>
                )}
              </section>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Grade Score (0 - {editingGrade.assignment.maxScore})
                </label>
                <input
                  type="number"
                  min={0}
                  max={editingGrade.assignment.maxScore}
                  value={editingGrade.currentGrade ?? ""}
                  onChange={(e) =>
                    setEditingGrade({
                      ...editingGrade,
                      currentGrade: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Instructor Feedback / Notes
                </label>
                <textarea
                  rows={3}
                  value={editingGrade.currentFeedback}
                  onChange={(e) =>
                    setEditingGrade({ ...editingGrade, currentFeedback: e.target.value })
                  }
                  placeholder="Optional comments for student..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditingGrade(null)}
                className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={savingGrade}
                onClick={handleSaveGrade}
                className="w-1/2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingGrade ? "Saving..." : "Save Grade"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Logging Modal */}
      {attendanceModalOpen && gradebook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Log Attendance Session: {gradebook.class.name}
              </h3>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Session Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student Roster
                </p>
                {gradebook.students.map((item) => (
                  <div
                    key={item.student.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {item.student.name}
                    </span>

                    <select
                      value={attendanceState[item.student.id] || "PRESENT"}
                      onChange={(e) => {
                        const status = (["PRESENT", "ABSENT", "EXCUSED", "LATE"] as const)
                          .find((value) => value === e.target.value);
                        if (!status) return;
                        setAttendanceState({
                          ...attendanceState,
                          [item.student.id]: status,
                        });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold outline-none dark:border-slate-700 dark:bg-slate-800"
                    >
                      <option value="PRESENT">Present</option>
                      <option value="LATE">Late</option>
                      <option value="ABSENT">Absent</option>
                      <option value="EXCUSED">Excused</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="w-1/2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={savingAttendance}
                onClick={handleSaveAttendance}
                className="w-1/2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {savingAttendance ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
