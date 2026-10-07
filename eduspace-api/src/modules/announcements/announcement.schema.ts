import { z } from "zod";

export const announcementSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(150),
  body: z.string().trim().min(2).max(5000),
});
