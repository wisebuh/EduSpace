import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertCourseOwner } from "../../lib/access";
import { deleteCourseFiles } from "../courseUpload/courseUpload.service";

export async function listCourses(user: AuthUser, opts: { mine?: boolean; q?: string }) {
  const where: Prisma.CourseWhereInput = {};

  // Unpublished courses are only visible to their teacher and admins.
  if (user.role !== "ADMIN") {
    where.OR = [{ published: true }, { teacherId: user.id }];
  }
  if (opts.q) where.title = { contains: opts.q, mode: "insensitive" };

  if (opts.mine) {
    if (user.role === "STUDENT") where.enrollments = { some: { userId: user.id } };
    if (user.role === "TEACHER") where.teacherId = user.id;
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      teacher: { select: { id: true, name: true } },
      _count: { select: { enrollments: true, classes: true } },
      classes: {
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          name: true,
          schedule: true,
          startsAt: true,
          ...(user.role === "STUDENT" ? {} : { meetingUrl: true }),
          cohortStartDate: true,
          cohortEndDate: true,
        },
      },
      enrollments: {
        where: { userId: user.id },
        include: { class: true },
      },
    },
  });

  return courses.map(({ enrollments, ...course }) => ({
    ...course,
    isEnrolled: enrollments.length > 0,
    enrollment: enrollments[0] ?? null,
  }));
}

export async function getCourse(user: AuthUser, id: string) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, name: true, avatarUrl: true } },
      classes: {
        orderBy: { startsAt: "asc" },
        select: {
          id: true,
          name: true,
          schedule: true,
          startsAt: true,
          ...(user.role === "STUDENT" ? {} : { meetingUrl: true }),
          cohortStartDate: true,
          cohortEndDate: true,
        },
      },
      _count: { select: { enrollments: true } },
      enrollments: {
        where: { userId: user.id },
        include: { class: true },
      },
    },
  });

  const hidden =
    !course || (!course.published && user.role !== "ADMIN" && course.teacherId !== user.id);
  if (hidden) throw new HttpError(404, "Course not found");

  const { enrollments, ...rest } = course;
  return { ...rest, isEnrolled: enrollments.length > 0, enrollment: enrollments[0] ?? null };
}

export async function createCourse(
  user: AuthUser,
  data: { title: string; description?: string; published?: boolean }
) {
  return prisma.course.create({ data: { ...data, teacherId: user.id } });
}

export async function updateCourse(
  user: AuthUser,
  id: string,
  data: { title?: string; description?: string; published?: boolean }
) {
  await assertCourseOwner(user, id);
  return prisma.course.update({ where: { id }, data });
}

export async function deleteCourse(user: AuthUser, id: string) {
  await assertCourseOwner(user, id);
  await deleteCourseFiles(id);
  await prisma.course.delete({ where: { id } });
}

export async function enroll(user: AuthUser, courseId: string, classId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.published) throw new HttpError(404, "Course not found");

  const selectedClass = await prisma.class.findFirst({ where: { id: classId, courseId } });
  if (!selectedClass) throw new HttpError(400, "Choose a class in this cohort");

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });

  if (existing?.classId && existing.classId !== classId) {
    throw new HttpError(409, "You are already enrolled in a different class for this cohort.");
  }
  if (existing) {
    if (!existing.classId) {
      return prisma.enrollment.update({ where: { id: existing.id }, data: { classId } });
    }
    return existing;
  }
  return prisma.enrollment.create({ data: { userId: user.id, courseId, classId } });
}

export async function unenroll(user: AuthUser, courseId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { class: { select: { cohortStartDate: true } } },
  });

  if (!enrollment) return;
  if (enrollment.class?.cohortStartDate && enrollment.class.cohortStartDate <= new Date()) {
    throw new HttpError(409, "You can only unenroll before the cohort starts.");
  }

  await prisma.enrollment.delete({ where: { id: enrollment.id } });
}

export async function listStudents(user: AuthUser, courseId: string) {
  await assertCourseOwner(user, courseId);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });
  return enrollments.map((e) => ({ ...e.user, enrolledAt: e.createdAt }));
}