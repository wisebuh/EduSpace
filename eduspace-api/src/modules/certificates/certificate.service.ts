import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser } from "../../lib/access";
import { calculateGradeBreakdown } from "../grades/gradeWeights";

function utcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function checkEligibility(user: AuthUser, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: {
      course: { select: { id: true, title: true, teacher: { select: { name: true } } } },
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

  if (!enrollment) throw new HttpError(404, "Enrollment not found");

  const cls = enrollment.class;
  const cohortCompleted = !!cls?.cohortEndDate && cls.cohortEndDate < utcDayStart();
  const existingCert = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });

  if (existingCert && cohortCompleted) {
    return {
      eligible: true,
      alreadyIssued: true,
      certificate: existingCert,
      stats: {
        attendancePercentage: existingCert.attendancePercentage,
        assignmentCompletion: existingCert.assignmentCompletion,
        projectCompletion: existingCert.projectCompletion,
        overallGrade: existingCert.overallGrade,
      },
    };
  }

  if (!cls) {
    return {
      eligible: false,
      reason: "You are not assigned to a class cohort for this course.",
      stats: { attendancePercentage: 0, assignmentCompletion: 0, projectCompletion: 0, overallGrade: null },
    };
  }

  const assignments = cls.assignments.filter((a) => a.type === "ASSIGNMENT");
  const projects = cls.assignments.filter((a) => a.type === "PROJECT");

  const completedAssignments = assignments.filter((a) => a.submissions.length > 0).length;
  const assignmentCompletion = assignments.length > 0
    ? Math.round((completedAssignments / assignments.length) * 100)
    : 100;

  const completedProjects = projects.filter((p) => p.submissions.length > 0).length;
  const projectCompletion = projects.length > 0
    ? Math.round((completedProjects / projects.length) * 100)
    : 100;

  const attendanceRecords = cls.attendanceRecords;
  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(
    (r) => r.status === "PRESENT" || r.status === "LATE"
  ).length;

  const attendancePercentage = totalSessions > 0
    ? Math.round((presentCount / totalSessions) * 100)
    : 100; // default 100 if teacher has not recorded attendance sessions yet

  const assignmentScores = assignments.map((assignment) => ({
    grade: assignment.submissions[0]?.grade ?? null,
    maxScore: assignment.maxScore,
  }));
  const overallGrade = calculateGradeBreakdown({
    assignmentScores,
    attendancePercentage,
    examScore: enrollment.examScore,
  }).total;

  const eligible =
    cohortCompleted &&
    attendancePercentage >= 90 &&
    assignmentCompletion >= 100 &&
    projectCompletion >= 100;

  return {
    eligible,
    alreadyIssued: false,
    reason: eligible
      ? "You meet all requirements (cohort completed, 90%+ attendance, 100% assignment & project completion)."
      : !cls.cohortEndDate
        ? "Your cohort completion date has not been set yet."
        : !cohortCompleted
          ? `Your certificate will be available after your cohort ends on ${cls.cohortEndDate.toISOString().slice(0, 10)}.`
          : "Must maintain 90%+ attendance and complete all class assignments and projects.",
    stats: {
      attendancePercentage,
      assignmentCompletion,
      projectCompletion,
      overallGrade,
    },
  };
}

export async function issueCertificate(user: AuthUser, courseId: string) {
  const check = await checkEligibility(user, courseId);
  if (check.alreadyIssued && check.certificate) {
    return check.certificate;
  }

  if (!check.eligible) {
    throw new HttpError(
      400,
      `Certificate criteria not met. ${check.reason || "Requires 90%+ attendance and full assignment & project completion."}`
    );
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    select: { classId: true },
  });

  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const certificateCode = `CERT-EDUSPACE-${user.id.slice(-4).toUpperCase()}-${randomPart}`;

  const cert = await prisma.certificate.create({
    data: {
      certificateCode,
      userId: user.id,
      courseId,
      classId: enrollment?.classId ?? null,
      attendancePercentage: check.stats.attendancePercentage,
      assignmentCompletion: check.stats.assignmentCompletion,
      projectCompletion: check.stats.projectCompletion,
      overallGrade: check.stats.overallGrade ?? null,
    },
    include: {
      course: { select: { title: true, teacher: { select: { name: true } } } },
      user: { select: { name: true, email: true } },
    },
  });

  // Notify student
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Course Certificate Issued!",
      message: `Congratulations! You earned your certificate for ${cert.course.title}. Code: ${certificateCode}`,
      href: "/certificates",
    },
  });

  return cert;
}

export async function listMine(user: AuthUser) {
  return prisma.certificate.findMany({
    where: {
      userId: user.id,
      class: { cohortEndDate: { lt: utcDayStart() } },
    },
    orderBy: { issuedAt: "desc" },
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
      class: { select: { name: true, cohortEndDate: true } },
    },
  });
}

export async function getByCode(certificateCode: string) {
  const cert = await prisma.certificate.findUnique({
    where: { certificateCode },
    include: {
      user: { select: { name: true, email: true, avatarUrl: true } },
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          teacher: { select: { name: true } },
        },
      },
      class: { select: { name: true, cohortEndDate: true } },
    },
  });

  if (!cert) throw new HttpError(404, "Certificate not found or verification code is invalid");
  if (!cert.class?.cohortEndDate || cert.class.cohortEndDate >= utcDayStart()) {
    throw new HttpError(404, "Certificate not found or verification code is invalid");
  }

  return cert;
}
