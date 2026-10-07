import { z } from "zod";

export const submitSchema = z
  .object({
    content: z.string().trim().max(10000).nullable().optional(),
    fileUrl: z.string().url().nullable().optional(),
  })
  .refine((d) => d.content || d.fileUrl, {
    message: "Add your answer or a file link",
    path: ["content"],
  });

export const gradeSchema = z.object({
  grade: z.number().int().min(0),
  feedback: z.string().trim().max(2000).optional(),
});