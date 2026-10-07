import { prisma } from "../../lib/prisma";
import { AuthUser, assertCourseAccess, assertCourseOwner } from "../../lib/access";
import { HttpError } from "../../lib/httpError";
import { notifyCourseStudents } from "../notifications/notification.service";

export async function listAnnouncements(user: AuthUser, courseId?: string) {
  const where = user.role === "ADMIN"
    ? (courseId ? { courseId } : {})
    : user.role === "TEACHER"
      ? { course: { teacherId: user.id }, ...(courseId ? { courseId } : {}) }
      : {
          course: { enrollments: { some: { userId: user.id } } },
          ...(courseId ? { courseId } : {}),
        };

  if (user.role === "STUDENT" && courseId) {
    await assertCourseAccess(user, courseId);
  }

  return prisma.announcement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      course: { select: { id: true, title: true } },
      author: { select: { id: true, name: true } },
    },
  });
}

export async function createAnnouncement(
  user: AuthUser,
  input: { courseId: string; title: string; body: string }
) {
  await assertCourseOwner(user, input.courseId);
  const announcement = await prisma.announcement.create({
    data: {
      ...input,
      authorId: user.id,
    },
    include: { course: { select: { id: true, title: true } } },
  });

  await notifyCourseStudents(input.courseId, {
    title: `New announcement: ${announcement.title}`,
    message: `${announcement.course.title}: ${announcement.body}`,
    href: "/announcements",
  });
  return announcement;
}

export async function deleteAnnouncement(user: AuthUser, id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { courseId: true },
  });
  if (!announcement) throw new HttpError(404, "Announcement not found");
  await assertCourseOwner(user, announcement.courseId);
  await prisma.announcement.delete({ where: { id } });
}
