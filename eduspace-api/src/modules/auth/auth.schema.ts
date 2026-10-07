import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Enter a valid email address");
const dateOfBirth = z.iso
  .date("Enter a valid date of birth")
  .refine((value) => value < new Date().toISOString().slice(0, 10), "Date of birth must be in the past");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
  phoneCountryCode: z.string().regex(/^\+\d{1,4}$/, "Enter a valid country calling code"),
  phoneNumber: z.string().regex(/^\d{6,15}$/, "Enter a valid phone number"),
  dateOfBirth,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const verificationSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({ email });