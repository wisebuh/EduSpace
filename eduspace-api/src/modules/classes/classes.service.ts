import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertClassAccess, assertCourseAccess, assertCourseOwner } from "../../lib/access";

type ClassInput = {
  name: string;
  schedule?: string | null;
  meetingUrl?: string | null;
  startsAt?: Date | null;
  cohortStartDate?: Date | null;
  cohortEndDate?: Date | null;
};

export async function listForCourse(user: AuthUser, courseId: string) {
  await assertCourseAccess(user, courseId);
  return prisma.class.findMany({
    where: {
      courseId,
      ...(user.role === "STUDENT" ? { enrollments: { some: { userId: user.id } } } : {}),
    },
    orderBy: { startsAt: "asc" },
    include: { _count: { select: { assignments: true, enrollments: true } } },
  });
}

/** "My classes" page: classes from the courses I study or teach. */
export async function listMine(user: AuthUser) {
  const where: Prisma.ClassWhereInput =
    user.role === "ADMIN"
      ? {}
      : user.role === "TEACHER"
        ? { course: { teacherId: user.id } }
        : { enrollments: { some: { userId: user.id } } };

  return prisma.class.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: {
      course: { select: { id: true, title: true, teacher: { select: { id: true, name: true } } } },
      _count: { select: { assignments: true, enrollments: true } },
    },
  });
}

export async function getClass(user: AuthUser, id: string) {
  const found = await prisma.class.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
      assignments: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!found) throw new HttpError(404, "Class not found");

  await assertClassAccess(user, id);
  return found;
}

export async function createClass(user: AuthUser, courseId: string, data: ClassInput) {
  await assertCourseOwner(user, courseId);
  return prisma.class.create({ data: { ...data, courseId } });
}

export async function updateClass(user: AuthUser, id: string, data: Partial<ClassInput>) {
  const found = await prisma.class.findUnique({
    where: { id },
    select: { courseId: true, cohortStartDate: true, cohortEndDate: true },
  });
  if (!found) throw new HttpError(404, "Class not found");

  await assertCourseOwner(user, found.courseId);
  const cohortStartDate = data.cohortStartDate === undefined
    ? found.cohortStartDate
    : data.cohortStartDate;
  const cohortEndDate = data.cohortEndDate === undefined
    ? found.cohortEndDate
    : data.cohortEndDate;
  if (cohortStartDate && cohortEndDate && cohortStartDate > cohortEndDate) {
    throw new HttpError(400, "Cohort end date must be on or after its start date");
  }

  return prisma.class.update({ where: { id }, data });
}

export async function deleteClass(user: AuthUser, id: string) {
  const found = await prisma.class.findUnique({ where: { id }, select: { courseId: true } });
  if (!found) throw new HttpError(404, "Class not found");

  await assertCourseOwner(user, found.courseId);
  await prisma.class.delete({ where: { id } });
}