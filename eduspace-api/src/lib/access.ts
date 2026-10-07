import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { HttpError } from "./httpError";

export type AuthUser = { id: string; role: Role };

/** Only the course's teacher (or an admin) may continue. */
export async function assertCourseOwner(user: AuthUser, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });

  if (!course) throw new HttpError(404, "Course not found");
  if (user.role !== "ADMIN" && course.teacherId !== user.id) {
    throw new HttpError(403, "You do not manage this course");
  }
}

/** The teacher, an enrolled student, or an admin may continue. */
export async function assertCourseAccess(user: AuthUser, courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      teacherId: true,
      enrollments: { where: { userId: user.id }, select: { id: true } },
    },
  });

  if (!course) throw new HttpError(404, "Course not found");
  if (user.role === "ADMIN" || course.teacherId === user.id || course.enrollments.length > 0) {
    return;
  }
  throw new HttpError(403, "Enroll in this course first");
}

/** Only the selected class's students, its teacher, or an admin may continue. */
export async function assertClassAccess(user: AuthUser, classId: string) {
  const found = await prisma.class.findUnique({
    where: { id: classId },
    select: { courseId: true },
  });
  if (!found) throw new HttpError(404, "Class not found");

  if (user.role === "STUDENT") {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id, classId },
      select: { id: true },
    });
    if (!enrollment) throw new HttpError(403, "Enroll in this class first");
    return;
  }

  await assertCourseOwner(user, found.courseId);
}