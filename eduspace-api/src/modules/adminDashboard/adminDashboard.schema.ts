import { z } from "zod";
import { Role } from "@prisma/client";

export const assignmentSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(150),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.coerce.date().optional(),
  maxScore: z.number().int().min(1).max(1000).default(100),
});

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

export const listUsersQuery = z.object({
  q: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
  ...paging,
});

export const listCoursesQuery = z.object({
  q: z.string().trim().optional(),
  published: z.enum(["true", "false"]).optional(),
  ...paging,
});

export const publishSchema = z.object({
  published: z.boolean(),
});

export const assignmentUpdateSchema = assignmentSchema.partial();

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuery>;
export type PublishSchema = z.infer<typeof publishSchema>;