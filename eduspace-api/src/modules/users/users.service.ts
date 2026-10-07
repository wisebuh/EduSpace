import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { toPublicUser } from "../auth/auth.service";

export async function updateProfile(userId: string, data: {
  name?: string;
  avatarUrl?: string;
  emailNotificationsEnabled?: boolean;
}) {
  const user = await prisma.user.update({ where: { id: userId }, data });
  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  data: { currentPassword?: string; newPassword: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "User not found");

  if (user.passwordHash) {
    if (!data.currentPassword) throw new HttpError(400, "Enter your current password");
    const matches = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!matches) throw new HttpError(400, "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

export async function deleteAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}

export async function listUsers(page: number, pageSize: number) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count(),
  ]);
  return { users: users.map(toPublicUser), total, page, pageSize };
}

export async function updateRole(targetId: string, role: Role, actingAdminId: string) {
  if (targetId === actingAdminId) throw new HttpError(400, "You cannot change your own role");
  const user = await prisma.user.update({ where: { id: targetId }, data: { role } });
  return toPublicUser(user);
}