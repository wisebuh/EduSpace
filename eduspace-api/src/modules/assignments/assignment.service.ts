import fs from "fs/promises";
import path from "path";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertClassAccess, assertCourseAccess, assertCourseOwner } from "../../lib/access";
import { notifyClassStudents } from "../notifications/notification.service";
import { UPLOAD_DIR } from "../courseUpload/courseUpload.upload";
import { discardUpload } from "../courseUpload/courseUpload.service";

type AssignmentInput = { title: string; description?: string; type?: "ASSIGNMENT" | "PROJECT"; dueDate?: Date; maxScore?: number };

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
          ? {
              where: { studentId: user.id },
              select: {
                id: true,
                grade: true,
                submittedAt: true,
                content: true,
                fileUrl: true,
                fileName: true,
                feedback: true,
              },
            }
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

export async function attachFile(user: AuthUser, id: string, file: Express.Multer.File, title?: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: {
      attachmentStoredName: true,
      class: { select: { courseId: true } },
    },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");
  await assertCourseOwner(user, assignment.class.courseId);

  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      attachmentName: title || file.originalname,
      attachmentStoredName: file.filename,
      attachmentMimeType: file.mimetype,
      attachmentSize: file.size,
    },
  });

  if (assignment.attachmentStoredName) {
    await fs.unlink(path.join(UPLOAD_DIR, assignment.attachmentStoredName)).catch(() => {});
  }
  return updated;
}

export async function getAssignmentFile(user: AuthUser, id: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: {
      attachmentName: true,
      attachmentStoredName: true,
      classId: true,
    },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");
  if (!assignment.attachmentStoredName || !assignment.attachmentName) {
    throw new HttpError(404, "No file was attached to this assignment");
  }
  await assertClassAccess(user, assignment.classId);
  return {
    path: path.join(UPLOAD_DIR, assignment.attachmentStoredName),
    name: assignment.attachmentName,
  };
}

export async function createAssignment(
  user: AuthUser,
  classId: string,
  data: AssignmentInput,
  file?: Express.Multer.File
) {
  const found = await prisma.class.findUnique({
    where: { id: classId },
    select: { courseId: true, name: true, course: { select: { title: true } } },
  });
  if (!found) throw new HttpError(404, "Class not found");

  await assertCourseOwner(user, found.courseId);
  let assignment;
  try {
    const createData = {
      ...data,
      classId,
      ...(file
        ? {
            attachmentName: file.originalname,
            attachmentStoredName: file.filename,
            attachmentMimeType: file.mimetype,
            attachmentSize: file.size,
          }
        : {}),
    };
    assignment = (data.type ?? "ASSIGNMENT") === "ASSIGNMENT"
      ? await prisma.$transaction(async (tx) => {
          const assignmentCount = await tx.assignment.count({
            where: { classId, type: "ASSIGNMENT" },
          });
          if (assignmentCount >= 4) {
            throw new HttpError(409, "A class cohort can have up to four graded assignments.");
          }
          return tx.assignment.create({ data: createData });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      : await prisma.assignment.create({ data: createData });
  } catch (error) {
    if (file) await discardUpload(file);
    throw error;
  }
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
  const assignment = await prisma.assignment.findUnique({
    where: { id },
    select: { classId: true, type: true, class: { select: { courseId: true } } },
  });
  if (!assignment) throw new HttpError(404, "Assignment not found");
  await assertCourseOwner(user, assignment.class.courseId);

  if (data.type === "ASSIGNMENT" && assignment.type !== "ASSIGNMENT") {
    return prisma.$transaction(async (tx) => {
      const assignmentCount = await tx.assignment.count({
        where: { classId: assignment.classId, type: "ASSIGNMENT" },
      });
      if (assignmentCount >= 4) {
        throw new HttpError(409, "A class cohort can have up to four graded assignments.");
      }
      return tx.assignment.update({ where: { id }, data });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  return prisma.assignment.update({ where: { id }, data });
}

export async function deleteAssignment(user: AuthUser, id: string) {
  await assertCourseOwner(user, await courseIdOf(id));
  await prisma.assignment.delete({ where: { id } });
}