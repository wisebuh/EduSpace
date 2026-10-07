import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertClassAccess, assertCourseAccess, assertCourseOwner } from "../../lib/access";
import { notifyClassStudents } from "../notifications/notification.service";

type AssignmentInput = { title: string; description?: string; dueDate?: Date; maxScore?: number };

/** "Assignments" page: everything for the courses I study or teach. */
export async function listMine(user: AuthUser) {
  const where: Prisma.AssignmentWhereInput =
    user.role === "ADMIN"
      ? {}
      : user.role === "TEACHER"
        ? { class: { course: { teacherId: user.id } } }
        : { class: { enrollments: { some: { userId: user.id } } } };

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: {
      class: { select: { id: true, name: true, course: { select: { id: true, title: true } } } },
      // Students see their own submission; teachers see a count.
      submissions:
        user.role === "STUDENT"
          ? { where: { studentId: user.id }, select: { id: true, grade: true, submittedAt: true } }
          : false,
      _count: { select: { submissions: true } },
    },
  });

  return assignments.map(({ submissions, ...a }) => ({
    ...a,
    mySubmission: Array.isArray(submissions) ? (submissions[0] ?? null) : undefined,
  }));
}

export async function getAssignment(user: AuthUser, id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      class: { select: { id: true, name: true, courseId: true, course: { select: { title: true } } } },
    },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");

  await assertClassAccess(user, assignment.classId);

  const mySubmission =
    user.role === "STUDENT"
      ? await prisma.submission.findUnique({
          where: { assignmentId_studentId: { assignmentId: id, studentId: user.id } },
        })
      : undefined;

  return { ...assignment, mySubmission };
}

export async function createAssignment(user: AuthUser, classId: string, data: AssignmentInput) {
  const found = await prisma.class.findUnique({
    where: { id: classId },
    select: { courseId: true, name: true, course: { select: { title: true } } },
  });
  if (!found) throw new HttpError(404, "Class not found");

  await assertCourseOwner(user, found.courseId);
  const assignment = await prisma.assignment.create({ data: { ...data, classId } });
  await notifyClassStudents(classId, {
    title: `New assignment: ${assignment.title}`,
    message: `${found.course.title} · ${found.name}${assignment.dueDate ? ` · Due ${assignment.dueDate.toLocaleString()}` : ""}`,
    href: "/assignments",
  });
  return assignment;
}

async function courseIdOf(assignmentId: string) {
  const found = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { class: { select: { courseId: true } } },
  });
  if (!found) throw new HttpError(404, "Assignment not found");
  return found.class.courseId;
}

export async function updateAssignment(user: AuthUser, id: string, data: Partial<AssignmentInput>) {
  await assertCourseOwner(user, await courseIdOf(id));
  return prisma.assignment.update({ where: { id }, data });
}

export async function deleteAssignment(user: AuthUser, id: string) {
  await assertCourseOwner(user, await courseIdOf(id));
  await prisma.assignment.delete({ where: { id } });
}