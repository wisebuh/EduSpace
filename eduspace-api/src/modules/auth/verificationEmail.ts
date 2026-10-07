import nodemailer from "nodemailer";
import { env } from "../../config/env";

export const isVerificationEmailConfigured = () =>
  Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

export async function sendVerificationEmail(email: string, name: string, token: string) {
  if (!isVerificationEmailConfigured()) {
    throw new Error("Email verification is not configured. Set SMTP_HOST, SMTP_PORT, and SMTP_FROM.");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === "true",
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
  });

  const verificationUrl = new URL("/verify-email", env.CLIENT_URL);
  verificationUrl.searchParams.set("token", token);
  const safeName = escapeHtml(name);

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "Verify your EduSpace email",
    text: `Hi ${name}, verify your email address by opening this link: ${verificationUrl.toString()}. This link expires in 30 minutes.`,
    html: `<p>Hi ${safeName},</p><p>Please verify your email address to finish creating your EduSpace account.</p><p><a href="${verificationUrl.toString()}">Verify my email</a></p><p>This link expires in 30 minutes.</p>`,
  });
}
