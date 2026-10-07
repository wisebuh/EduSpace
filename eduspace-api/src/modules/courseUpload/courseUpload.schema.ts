import { z } from "zod";

export const uploadBodySchema = z.object({
  // If left empty, the file name is used as the title.
  title: z.string().trim().max(150).optional(),
});