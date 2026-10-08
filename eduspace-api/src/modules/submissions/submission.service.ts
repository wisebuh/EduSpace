import fs from "fs/promises";
import path from "path";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertCourseAccess, assertCourseOwner } from "../../lib/access";
import { UPLOAD_DIR } from "../courseUpload/courseUpload.upload";

export async function submit(
  user: AuthUser,
  assignmentId: string,
  data: { content?: string | null; fileUrl?: string | null },
  file?: Express.Multer.File
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

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    select: { fileStoredName: true },
  });

  const submission = await prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
    create: {
      assignmentId,
      studentId: user.id,
      content: data.content,
      fileUrl: file ? null : data.fileUrl,
      ...(file
        ? {
            fileName: file.originalname,
            fileStoredName: file.filename,
            fileMimeType: file.mimetype,
            fileSize: file.size,
          }
        : {}),
    },
    update: {
      content: data.content,
      ...(file
        ? {
            fileUrl: null,
            fileName: file.originalname,
            fileStoredName: file.filename,
            fileMimeType: file.mimetype,
            fileSize: file.size,
          }
        : data.fileUrl !== undefined
          ? { fileUrl: data.fileUrl }
          : {}),
      submittedAt: new Date(),
      grade: null,
      feedback: null,
    },
  });
  if (file && existing?.fileStoredName) {
    await fs.unlink(path.join(UPLOAD_DIR, existing.fileStoredName)).catch(() => {});
  }
  return submission;
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
          type: true,
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

export async function getSubmissionFile(user: AuthUser, id: string) {
  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      studentId: true,
      fileName: true,
      fileStoredName: true,
      assignment: { select: { class: { select: { courseId: true } } } },
    },
  });
  if (!submission) throw new HttpError(404, "Submission not found");
  if (!submission.fileName || !submission.fileStoredName) {
    throw new HttpError(404, "No file was attached to this submission");
  }

  if (submission.studentId !== user.id) {
    await assertCourseOwner(user, submission.assignment.class.courseId);
  }
  return {
    path: path.join(UPLOAD_DIR, submission.fileStoredName),
    name: submission.fileName,
  };
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