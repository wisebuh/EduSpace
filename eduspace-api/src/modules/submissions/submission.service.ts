import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertCourseAccess, assertCourseOwner } from "../../lib/access";

export async function submit(
  user: AuthUser,
  assignmentId: string,
  data: { content?: string | null; fileUrl?: string | null }
) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { classId: true, class: { select: { courseId: true } } },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  // Only students enrolled in the class can submit its assignments.
  const enrolled = await prisma.enrollment.findFirst({
    where: { userId: user.id, classId: assignment.classId },
  });
  if (!enrolled) throw new HttpError(403, "Enroll in this class to submit work");

  // Submitting again replaces the earlier answer and clears the old grade.
  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    create: { assignmentId, studentId: user.id, ...data },
    update: { ...data, submittedAt: new Date(), grade: null, feedback: null },
  });
}

export async function listForAssignment(user: AuthUser, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { class: { select: { courseId: true } } },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  await assertCourseOwner(user, assignment.class.courseId);

  return prisma.submission.findMany({
    where: { assignmentId },
    orderBy: { submittedAt: "asc" },
    include: { student: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
}

export async function listMine(user: AuthUser) {
  return prisma.submission.findMany({
    where: { studentId: user.id },
    orderBy: { submittedAt: "desc" },
    include: {
      assignment: {
        select: {
          id: true,
          title: true,
          maxScore: true,
          dueDate: true,
          class: { select: { name: true, course: { select: { title: true } } } },
        },
      },
    },
  });
}

export async function getSubmission(user: AuthUser, id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true, maxScore: true, class: { select: { courseId: true } } } },
    },
  });
  if (!submission) throw new HttpError(404, "Submission not found");

  if (submission.studentId !== user.id) {
    await assertCourseOwner(user, submission.assignment.class.courseId);
  }
  return submission;
}

export async function gradeSubmission(
  user: AuthUser,
  id: string,
  data: { grade: number; feedback?: string }
) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { assignment: { select: { maxScore: true, class: { select: { courseId: true } } } } },
  });
  if (!submission) throw new HttpError(404, "Submission not found");

  await assertCourseOwner(user, submission.assignment.class.courseId);

  if (data.grade > submission.assignment.maxScore) {
    throw new HttpError(400, `Grade cannot be higher than ${submission.assignment.maxScore}`);
  }

  return prisma.submission.update({
    where: { id },
    data: { grade: data.grade, feedback: data.feedback },
  });
}