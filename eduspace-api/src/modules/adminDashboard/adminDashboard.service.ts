import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { ListCoursesQuery, ListUsersQuery } from "./adminDashboard.schema";

export async function getOverview() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    roleCounts,
    totalCourses,
    publishedCourses,
    enrollments,
    submissions,
    waitingForGrade,
    newUsersThisWeek,
    recentUsers,
    recentCourses,
    popularCourses,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.course.count(),
    prisma.course.count({ where: { published: true } }),
    prisma.enrollment.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { grade: null } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        published: true,
        createdAt: true,
        teacher: { select: { name: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { enrollments: { _count: "desc" } },
      take: 5,
      select: { id: true, title: true, _count: { select: { enrollments: true } } },
    }),
  ]);

  const usersByRole: Record<Role, number> = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
  for (const row of roleCounts) usersByRole[row.role] = row._count._all;

  return {
    stats: {
      totalUsers: usersByRole.STUDENT + usersByRole.TEACHER + usersByRole.ADMIN,
      usersByRole,
      newUsersThisWeek,
      totalCourses,
      publishedCourses,
      draftCourses: totalCourses - publishedCourses,
      enrollments,
      submissions,
      waitingForGrade,
    },
    recentUsers,
    recentCourses,
    popularCourses,
  };
}

export async function listUsers({ q, role, page, pageSize }: ListUsersQuery) {
  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { enrollments: true, coursesTeaching: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, pageSize };
}

export async function deleteUser(adminId: string, targetId: string) {
  if (adminId === targetId) throw new HttpError(400, "You cannot delete your own account here");

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, coursesTeaching: { select: { id: true } } },
  });
  if (!target) throw new HttpError(404, "User not found");

  // Deleting a teacher would also delete their courses, so make that a deliberate step.
  if (target.coursesTeaching.length > 0) {
    throw new HttpError(409, "This teacher still has courses. Delete or hand over their courses first");
  }

  await prisma.user.delete({ where: { id: targetId } });
}

export async function listCourses({ q, published, page, pageSize }: ListCoursesQuery) {
  const where: Prisma.CourseWhereInput = {};
  if (published) where.published = published === "true";
  if (q) where.title = { contains: q, mode: "insensitive" };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, classes: true, materials: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, pageSize };
}

export async function setCoursePublished(id: string, published: boolean) {
  return prisma.course.update({ where: { id }, data: { published } });
}