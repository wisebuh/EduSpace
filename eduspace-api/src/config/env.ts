import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  GOOGLE_CLIENT_ID: z.string().trim().optional(),
  GOOGLE_CLIENT_SECRET: z.string().trim().optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .url()
    .default("http://localhost:4000/api/auth/google/callback"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().min(1).optional(),
});

const parsed = schema.superRefine((values, context) => {
  if (Boolean(values.GOOGLE_CLIENT_ID) !== Boolean(values.GOOGLE_CLIENT_SECRET)) {
    context.addIssue({
      code: "custom",
      message: "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together",
      path: ["GOOGLE_CLIENT_ID"],
    });
  }
}).safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;