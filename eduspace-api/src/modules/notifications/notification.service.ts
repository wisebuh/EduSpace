import nodemailer from "nodemailer";
import { prisma } from "../../lib/prisma";
import { AuthUser } from "../../lib/access";
import { env } from "../../config/env";

type Notice = { title: string; message: string; href: string };

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

async function deliver(userIds: string[], notice: Notice) {
  if (!userIds.length) return;

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...notice })),
  });

  const recipients = await prisma.user.findMany({
    where: { id: { in: userIds }, emailNotificationsEnabled: true },
    select: { email: true, name: true },
  });
  if (!recipients.length) return;
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_FROM) {
    console.error("Notification emails were not sent: SMTP_HOST, SMTP_PORT, and SMTP_FROM are required.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
  });
  const safeTitle = escapeHtml(notice.title);
  const safeMessage = escapeHtml(notice.message);
  const safeHref = new URL(notice.href, env.CLIENT_URL).toString();

  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      transporter.sendMail({
        from: env.SMTP_FROM!,
        to: recipient.email,
        subject: `EduSpace: ${notice.title}`,
        text: `Hi ${recipient.name},\n\n${notice.message}\n\nOpen EduSpace: ${safeHref}`,
        html: `<p>Hi ${escapeHtml(recipient.name)},</p><p><strong>${safeTitle}</strong></p><p>${safeMessage}</p><p><a href="${safeHref}">Open EduSpace</a></p>`,
      })
    )
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("An EduSpace notification email could not be sent:", result.reason);
    }
  }
}

export async function notifyCourseStudents(courseId: string, notice: Notice) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { userId: true },
  });
  await deliver([...new Set(enrollments.map(({ userId }) => userId))], notice);
}

export async function notifyClassStudents(classId: string, notice: Notice) {
  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    select: { userId: true },
  });
  await deliver([...new Set(enrollments.map(({ userId }) => userId))], notice);
}

export async function listNotifications(user: AuthUser) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  return { notifications, unreadCount };
}

export async function markNotificationRead(user: AuthUser, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function markAllNotificationsRead(user: AuthUser) {
  return prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
}
