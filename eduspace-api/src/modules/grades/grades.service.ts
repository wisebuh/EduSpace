import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertCourseOwner } from "../../lib/access";
import { calculateGradeBreakdown, GRADE_WEIGHTS } from "./gradeWeights";

function utcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function attendanceDate(date?: string) {
  if (!date) return utcDayStart();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, "Attendance date must use YYYY-MM-DD format");
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new HttpError(400, "Attendance date is invalid");
  }
  return parsed;
}

export async function getGradebook(user: AuthUser, classId: string) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      course: { select: { id: true, title: true, teacherId: true, teacher: { select: { name: true } } } },
      assignments: {
        orderBy: { createdAt: "asc" },
        include: { submissions: true },
      },
      enrollments: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      },
      attendanceRecords: true,
      certificates: true,
    },
  });

  if (!cls) throw new HttpError(404, "Class not found");

  // Only course teacher or admin can view gradebook
  if (user.role !== "ADMIN") {
    await assertCourseOwner(user, cls.courseId);
  }

  const assignments = cls.assignments.filter((a) => a.type === "ASSIGNMENT");
  const projects = cls.assignments.filter((a) => a.type === "PROJECT");

  const students = cls.enrollments.map((e) => {
    const student = e.user;

    // Assignment scores & completion
    const assignmentSubmissions = assignments.map((a) => {
      const sub = a.submissions.find((s) => s.studentId === student.id);
      return {
        assignmentId: a.id,
        submissionId: sub?.id ?? null,
        title: a.title,
        maxScore: a.maxScore,
        submitted: !!sub,
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? null,
        submittedAt: sub?.submittedAt ?? null,
        content: sub?.content ?? null,
        fileUrl: sub?.fileUrl ?? null,
        fileName: sub?.fileName ?? null,
      };
    });

    const completedAssignmentsCount = assignmentSubmissions.filter((s) => s.submitted).length;
    const assignmentCompletionRate = assignments.length > 0
      ? Math.round((completedAssignmentsCount / assignments.length) * 100)
      : 100;

    const gradedAssignments = assignmentSubmissions.filter((s) => typeof s.grade === "number");
    const assignmentAverage = gradedAssignments.length > 0
      ? Math.round(
          gradedAssignments.reduce((acc, curr) => acc + (curr.grade! / curr.maxScore) * 100, 0) /
            gradedAssignments.length
        )
      : null;

    // Project scores & completion
    const projectSubmissions = projects.map((p) => {
      const sub = p.submissions.find((s) => s.studentId === student.id);
      return {
        assignmentId: p.id,
        submissionId: sub?.id ?? null,
        title: p.title,
        maxScore: p.maxScore,
        submitted: !!sub,
        grade: sub?.grade ?? null,
        feedback: sub?.feedback ?? null,
        submittedAt: sub?.submittedAt ?? null,
        content: sub?.content ?? null,
        fileUrl: sub?.fileUrl ?? null,
        fileName: sub?.fileName ?? null,
      };
    });

    const completedProjectsCount = projectSubmissions.filter((s) => s.submitted).length;
    const projectCompletionRate = projects.length > 0
      ? Math.round((completedProjectsCount / projects.length) * 100)
      : 100;

    const gradedProjects = projectSubmissions.filter((s) => typeof s.grade === "number");
    const projectAverage = gradedProjects.length > 0
      ? Math.round(
          gradedProjects.reduce((acc, curr) => acc + (curr.grade! / curr.maxScore) * 100, 0) /
            gradedProjects.length
        )
      : null;

    // Attendance calculation
    const studentAttendanceRecords = cls.attendanceRecords.filter((r) => r.studentId === student.id);
    const totalSessions = studentAttendanceRecords.length;
    const presentCount = studentAttendanceRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    ).length;

    const attendancePercentage = totalSessions > 0
      ? Math.round((presentCount / totalSessions) * 100)
      : 100; // Default to 100% if no session logged yet

    const gradeBreakdown = calculateGradeBreakdown({
      assignmentScores: assignmentSubmissions.map((submission) => ({
        grade: submission.grade,
        maxScore: submission.maxScore,
      })),
      attendancePercentage,
      examScore: e.examScore,
    });

    // Eligibility check: >= 90% attendance & 100% assignments & 100% projects completed
    const isEligibleForCertificate =
      attendancePercentage >= 90 &&
      assignmentCompletionRate >= 100 &&
      projectCompletionRate >= 100;

    const existingCert = cls.certificates.find((c) => c.userId === student.id);

    return {
      student,
      assignmentSubmissions,
      projectSubmissions,
      completedAssignmentsCount,
      totalAssignmentsCount: assignments.length,
      assignmentCompletionRate,
      assignmentAverage,
      completedProjectsCount,
      totalProjectsCount: projects.length,
      projectCompletionRate,
      projectAverage,
      attendanceRecords: studentAttendanceRecords,
      attendancePercentage,
      examScore: e.examScore,
      gradeBreakdown,
      totalSessions,
      presentCount,
      overallGrade: gradeBreakdown.total,
      isEligibleForCertificate,
      certificate: existingCert ?? null,
    };
  });

  return {
    class: {
      id: cls.id,
      name: cls.name,
      courseId: cls.courseId,
      courseTitle: cls.course.title,
    },
    gradingWeights: GRADE_WEIGHTS,
    assignments: assignments.map((a) => ({ id: a.id, title: a.title, maxScore: a.maxScore, type: a.type })),
    projects: projects.map((p) => ({ id: p.id, title: p.title, maxScore: p.maxScore, type: p.type })),
    students,
  };
}

export async function updateStudentGrade(
  user: AuthUser,
  classId: string,
  data: { studentId: string; assignmentId: string; grade: number; feedback?: string }
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: data.assignmentId },
    select: { classId: true, maxScore: true, class: { select: { courseId: true } } },
  });

  if (!assignment || assignment.classId !== classId) {
    throw new HttpError(404, "Assignment not found in this class");
  }

  if (user.role !== "ADMIN") {
    await assertCourseOwner(user, assignment.class.courseId);
  }

  if (data.grade < 0 || data.grade > assignment.maxScore) {
    throw new HttpError(400, `Grade must be between 0 and ${assignment.maxScore}`);
  }

  return prisma.submission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: data.assignmentId,
        studentId: data.studentId,
      },
    },
    create: {
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      grade: data.grade,
      feedback: data.feedback,
      submittedAt: new Date(),
    },
    update: {
      grade: data.grade,
      feedback: data.feedback,
    },
  });
}

export async function updateExamGrade(
  user: AuthUser,
  classId: string,
  data: { studentId: string; score: number }
) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { courseId: true },
  });
  if (!cls) throw new HttpError(404, "Class not found");
  if (user.role !== "ADMIN") await assertCourseOwner(user, cls.courseId);
  if (!Number.isInteger(data.score) || data.score < 0 || data.score > 100) {
    throw new HttpError(400, "Exam score must be a whole number between 0 and 100");
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: data.studentId, classId },
    select: { id: true },
  });
  if (!enrollment) throw new HttpError(404, "Student is not enrolled in this class");

  return prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { examScore: data.score },
  });
}

export async function recordAttendance(
  user: AuthUser,
  classId: string,
  data: {
    records: Array<{
      studentId: string;
      date?: string;
      status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
      notes?: string;
    }>;
  }
) {
  const cls = await prisma.class.findUnique({
    where: { id: classId },
    select: { courseId: true },
  });

  if (!cls) throw new HttpError(404, "Class not found");

  if (user.role !== "ADMIN") {
    await assertCourseOwner(user, cls.courseId);
  }

  const enrolledStudents = await prisma.enrollment.findMany({
    where: { classId, userId: { in: data.records.map((record) => record.studentId) } },
    select: { userId: true },
  });
  const enrolledStudentIds = new Set(enrolledStudents.map((enrollment) => enrollment.userId));
  if (data.records.some((record) => !enrolledStudentIds.has(record.studentId))) {
    throw new HttpError(400, "Attendance can only be recorded for students enrolled in this class");
  }

  const results = [];
  for (const item of data.records) {
    const recordDate = attendanceDate(item.date);

    const rec = await prisma.attendanceRecord.upsert({
      where: {
        classId_studentId_date: {
          classId,
          studentId: item.studentId,
          date: recordDate,
        },
      },
      create: {
        classId,
        studentId: item.studentId,
        date: recordDate,
        status: item.status,
        notes: item.notes,
      },
      update: {
        status: item.status,
        notes: item.notes,
      },
    });
    results.push(rec);
  }

  return results;
}

export async function getMyTodayAttendance(user: AuthUser) {
  const today = utcDayStart();
  return prisma.attendanceRecord.findMany({
    where: {
      studentId: user.id,
      OR: [
        { date: today },
        {
          class: {
            startsAt: {
              gte: new Date(Date.now() - 15 * 60 * 1000),
              lte: new Date(Date.now() + 10 * 60 * 1000),
            },
          },
        },
      ],
    },
    select: { classId: true, date: true, status: true },
  });
}

export async function markMyAttendance(user: AuthUser, classId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, classId },
    select: { id: true, class: { select: { startsAt: true } } },
  });
  if (!enrollment || !enrollment.class) throw new HttpError(403, "Enroll in this class to check in");

  const startsAt = enrollment.class.startsAt;
  if (!startsAt) {
    throw new HttpError(400, "Your instructor has not set the class start time, so attendance check-in is unavailable.");
  }

  const now = new Date();
  const opensAt = startsAt.getTime() - 10 * 60 * 1000;
  const closesAt = startsAt.getTime() + 15 * 60 * 1000;
  const date = utcDayStart(startsAt);
  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: { classId_studentId_date: { classId, studentId: user.id, date } },
  });
  if (existingRecord?.status === "PRESENT") return existingRecord;
  if (now.getTime() < opensAt || now.getTime() > closesAt) {
    throw new HttpError(400, "Attendance check-in is only available from 10 minutes before until 15 minutes after class starts.");
  }

  return prisma.attendanceRecord.upsert({
    where: { classId_studentId_date: { classId, studentId: user.id, date } },
    create: { classId, studentId: user.id, date, status: "PRESENT" },
    update: { status: "PRESENT", notes: null },
  });
}

export async function getStudentGrades(user: AuthUser) {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: { select: { id: true, title: true, description: true, teacher: { select: { name: true } } } },
      class: {
        include: {
          assignments: {
            orderBy: { createdAt: "asc" },
            include: {
              submissions: { where: { studentId: user.id } },
            },
          },
          attendanceRecords: { where: { studentId: user.id } },
        },
      },
    },
  });

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    include: {
      user: { select: { name: true } },
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          teacher: { select: { name: true } },
        },
      },
      class: { select: { name: true } },
    },
  });

  return enrollments.map((e) => {
    const cls = e.class;
    if (!cls) {
      return {
        course: e.course,
        class: null,
        cohortCompleted: false,
        attendancePercentage: 100,
        assignmentCompletionRate: 100,
        projectCompletionRate: 100,
        examScore: null,
        gradeBreakdown: {
          assignmentPoints: 0,
          attendancePoints: 0,
          examPoints: 0,
          total: 0,
        },
        overallGrade: null,
        isEligibleForCertificate: false,
        certificate: null,
      };
    }

    const assignments = cls.assignments.filter((a) => a.type === "ASSIGNMENT");
    const projects = cls.assignments.filter((a) => a.type === "PROJECT");

    const completedAssignments = assignments.filter((a) => a.submissions.length > 0).length;
    const assignmentCompletionRate = assignments.length > 0
      ? Math.round((completedAssignments / assignments.length) * 100)
      : 100;

    const completedProjects = projects.filter((p) => p.submissions.length > 0).length;
    const projectCompletionRate = projects.length > 0
      ? Math.round((completedProjects / projects.length) * 100)
      : 100;

    const attendanceRecords = cls.attendanceRecords;
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter(
      (r) => r.status === "PRESENT" || r.status === "LATE"
    ).length;

    const attendancePercentage = totalSessions > 0
      ? Math.round((presentCount / totalSessions) * 100)
      : 100;

    const assignmentScores = assignments.map((assignment) => ({
      grade: assignment.submissions[0]?.grade ?? null,
      maxScore: assignment.maxScore,
    }));
    const gradeBreakdown = calculateGradeBreakdown({
      assignmentScores,
      attendancePercentage,
      examScore: e.examScore,
    });
    const overallGrade = gradeBreakdown.total;

    const isEligibleForCertificate =
      attendancePercentage >= 90 &&
      assignmentCompletionRate >= 100 &&
      projectCompletionRate >= 100;

    const existingCert = certificates.find((c) => c.courseId === e.courseId);
    const cohortCompleted =
      !!cls.cohortEndDate && cls.cohortEndDate < utcDayStart();

    return {
      course: e.course,
      class: { id: cls.id, name: cls.name, cohortEndDate: cls.cohortEndDate },
      cohortCompleted,
      attendancePercentage,
      examScore: e.examScore,
      gradeBreakdown,
      assignmentCompletionRate,
      projectCompletionRate,
      overallGrade,
      isEligibleForCertificate: isEligibleForCertificate && cohortCompleted,
      certificate: cohortCompleted ? existingCert ?? null : null,
    };
  });
}
