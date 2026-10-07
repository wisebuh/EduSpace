import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(120),
  description: z.string().trim().max(2000).optional(),
  published: z.boolean().optional(),
});

export const courseUpdateSchema = courseSchema.partial();

export const enrollmentSchema = z.object({
  classId: z.string().min(1, "Choose a class in this cohort"),
});