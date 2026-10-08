import { z } from "zod";

export const examGradeSchema = z.object({
  studentId: z.string().min(1),
  score: z.number().int().min(0).max(100),
});
