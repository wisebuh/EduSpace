import { prisma } from "../../lib/prisma";
import { AuthUser } from "../../lib/access";

export async function getDashboard(user: AuthUser) {
  const now = new Date();

  if (user.role === "STUDENT") {
    const notSubmittedYet = {
      dueDate: { gte: now },
      class: { enrollments: { some: { userId: user.id } } },
      submissions: { none: { studentId: user.id } },
    };

    const [enrolledCourses, pendingAssignments, upcomingAssignments, graded] = await Promise.all([
      prisma.enrollment.count({ where: { userId: user.id } }),
      prisma.assignment.count({ where: notSubmittedYet }),
      prisma.assignment.findMany({
        where: notSubmittedYet,
        orderBy: { dueDate: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          dueDate: true,
          class: { select: { name: true, course: { select: { title: true } } } },
        },
      }),
      prisma.submission.aggregate({
        where: { studentId: user.id, grade: { not: null } },
        _avg: { grade: true },
        _count: true,
      }),
    ]);

    return {
      role: user.role,
      stats: {
        enrolledCourses,
        pendingAssignments,
        gradedSubmissions: graded._count,
        averageGrade: graded._avg.grade,
      },
      upcomingAssignments,
    };
  }

  if (user.role === "TEACHER") {
    const [courses, classes, students, toGrade] = await Promise.all([
      prisma.course.count({ where: { teacherId: user.id } }),
      prisma.class.count({ where: { course: { teacherId: user.id } } }),
      prisma.enrollment.count({ where: { course: { teacherId: user.id } } }),
      prisma.submission.count({
        where: { grade: null, assignment: { class: { course: { teacherId: user.id } } } },
      }),
    ]);

    return { role: user.role, stats: { courses, classes, students, toGrade } };
  }

  const [users, courses, enrollments, submissions] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.submission.count(),
  ]);

  return { role: user.role, stats: { users, courses, enrollments, submissions } };
}