"use client";

import { useEffect, useState } from "react";
import { Award, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, BookOpen, Clock, FileCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import CertificateModal from "@/components/certificates/CertificateModal";
import {
  fetchMyGrades,
  fetchMyCertificates,
  issueCertificate,
  AppStudentGradeSummary,
  AppCertificate,
} from "@/lib/app-api";

export default function StudentCertificatesPage() {
  const [grades, setGrades] = useState<AppStudentGradeSummary[]>([]);
  const [certificates, setCertificates] = useState<AppCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<AppCertificate | null>(null);
  const [claimingCourseId, setClaimingCourseId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  const loadData = async () => {
    try {
      const [gradesRes, certsRes] = await Promise.all([
        fetchMyGrades(),
        fetchMyCertificates(),
      ]);
      setGrades(gradesRes.grades || []);
      setCertificates(certsRes.certificates || []);
      setLoadError("");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load certificate eligibility.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "My Certificates | EduSpace";
    void Promise.resolve().then(loadData);
  }, []);

  const handleClaimCertificate = async (courseId: string) => {
    setClaimingCourseId(courseId);
    try {
      const res = await issueCertificate(courseId);
      setSelectedCert(res.certificate);
      await loadData();
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Could not issue certificate. Please verify eligibility.");
    } finally {
      setClaimingCourseId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Academic Achievements"
        title="My Certificates & Eligibility"
        description="Certificates become available after your cohort is complete and you meet the attendance, assignment, and project requirements."
      />

      {loadError && (
        <p role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {loadError}
        </p>
      )}

      {/* Hero Banner */}
      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <Award size={14} /> CERTIFICATE REQUIREMENTS
            </span>
            <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
              Earn Your Industry-Recognized Certificate
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Certificates are automatically awarded when you achieve at least{" "}
              <strong className="text-amber-300">90% Attendance</strong>, complete{" "}
              <strong className="text-amber-300">100% of Class Assignments</strong>, and complete{" "}
              <strong className="text-amber-300">100% of Course Projects</strong>.
            </p>
            <p className="mt-3 text-xs text-slate-300">
              Final grade: four assignments × 7.5% (30%), attendance 20%, and exam 50%.
              Projects are graded separately.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
              <ShieldCheck size={32} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-amber-300">{certificates.length}</p>
              <p className="text-xs text-slate-300">Certificates Earned</p>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading course performance...</p>
        </div>
      ) : grades.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-800">
          <BookOpen className="mx-auto text-slate-400" size={40} />
          <h3 className="mt-4 text-lg font-bold">No Course Enrollments Found</h3>
          <p className="mt-1 text-sm text-slate-500">
            Enroll in a course to start tracking your attendance, assignments, and certificates.
          </p>
          <a
            href="/my-courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Browse Courses <ArrowRight size={16} />
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Enrolled Courses Eligibility</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {grades.map((item) => {
              const cert = item.certificate || certificates.find((c) => c.courseId === item.course.id);
              const isEligible = item.isEligibleForCertificate || !!cert;

              return (
                <div
                  key={item.course.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {item.class ? item.class.name : "Enrolled Course"}
                        </span>
                        <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                          {item.course.title}
                        </h3>
                      </div>

                      {cert ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 size={13} /> Issued
                        </span>
                      ) : isEligible ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <Award size={13} /> Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Progress Metrics Grid */}
                    <div className="mt-6 space-y-4">
                      <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Weighted final grade: {item.overallGrade === null ? "Not available" : `${item.overallGrade}/100`}
                        <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                          Assignments {item.gradeBreakdown.assignmentPoints}/30 · Attendance {item.gradeBreakdown.attendancePoints}/20 · Exam {item.gradeBreakdown.examPoints}/50
                        </span>
                      </p>
                      {/* Attendance Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Clock size={14} className="text-emerald-500" /> Class Attendance
                          </span>
                          <span className={item.attendancePercentage >= 90 ? "text-emerald-600" : "text-amber-600"}>
                            {item.attendancePercentage}% / 90% Target
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.attendancePercentage >= 90 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(item.attendancePercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Class Assignment Completion Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <FileCheck size={14} className="text-blue-500" /> Class Assignments
                          </span>
                          <span className={item.assignmentCompletionRate >= 100 ? "text-emerald-600" : "text-blue-600"}>
                            {item.assignmentCompletionRate}% Completed
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.assignmentCompletionRate >= 100 ? "bg-emerald-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${Math.min(item.assignmentCompletionRate, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Project Completion Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Award size={14} className="text-purple-500" /> Course Projects
                          </span>
                          <span className={item.projectCompletionRate >= 100 ? "text-emerald-600" : "text-purple-600"}>
                            {item.projectCompletionRate}% Completed
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.projectCompletionRate >= 100 ? "bg-emerald-500" : "bg-purple-600"
                            }`}
                            style={{ width: `${Math.min(item.projectCompletionRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {cert ? (
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3 text-sm font-semibold text-white shadow-md hover:from-amber-700 hover:to-amber-600 transition"
                      >
                        <Award size={18} /> View / Print Certificate
                      </button>
                    ) : item.isEligibleForCertificate ? (
                      <button
                        disabled={claimingCourseId === item.course.id}
                        onClick={() => handleClaimCertificate(item.course.id)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                      >
                        <ShieldCheck size={18} />{" "}
                        {claimingCourseId === item.course.id ? "Issuing Certificate..." : "Claim My Certificate"}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl bg-amber-50/60 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                        <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                          {!item.cohortCompleted
                            ? item.class?.cohortEndDate
                              ? `Your certificate becomes available after your cohort ends on ${new Date(item.class.cohortEndDate).toLocaleDateString()}.`
                              : "Your certificate will be available after your instructor sets the cohort end date and the cohort is complete."
                            : "Must reach 90% attendance & complete all assignments & projects to claim your certificate."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      <CertificateModal
        certificate={selectedCert}
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
      />
    </div>
  );
}
