import { z } from "zod";

export const assignmentSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(150),
  description: z.string().trim().max(5000).optional(),
  dueDate: z.coerce.date().optional(),
  maxScore: z.number().int().min(1).max(1000).default(100),
});

export const assignmentUpdateSchema = assignmentSchema.partial();