import { z } from "zod";
import { Role } from "@prisma/client";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80).optional(),
  avatarUrl: z.string().url("Enter a valid URL").max(2048).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password").optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const updateRoleSchema = z.object({
  role: z.nativeEnum(Role),
});