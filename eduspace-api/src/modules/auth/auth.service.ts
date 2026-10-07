import bcrypt from "bcryptjs";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { User } from "@prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { isVerificationEmailConfigured, sendVerificationEmail } from "./verificationEmail";

const googleClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID ?? "",
  env.GOOGLE_CLIENT_SECRET ?? "",
  env.GOOGLE_CALLBACK_URL
);

const isCredentialConfigured = (value: string | undefined) =>
  Boolean(
    value &&
      !/(your-|placeholder|change-me|example|^test(?:[-_]|$))/i.test(value)
  );

export const isGoogleOAuthConfigured = () =>
  isCredentialConfigured(env.GOOGLE_CLIENT_ID) &&
  env.GOOGLE_CLIENT_ID?.endsWith(".apps.googleusercontent.com") === true &&
  isCredentialConfigured(env.GOOGLE_CLIENT_SECRET);

/** Removes private fields before sending a user to the browser. */
export const toPublicUser = ({ passwordHash, googleId, ...user }: User) => user;

const hashVerificationToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

async function createVerificationToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.upsert({
    where: { userId },
    update: {
      tokenHash: hashVerificationToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
    create: {
      userId,
      tokenHash: hashVerificationToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });
  return token;
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phoneCountryCode: string;
  phoneNumber: string;
  dateOfBirth: string;
}) {
  if (!isVerificationEmailConfigured()) {
    throw new HttpError(503, "Email verification is not configured. Contact the site administrator.");
  }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new HttpError(409, "An account with this email already exists");
  const passwordHash = await bcrypt.hash(data.password, 12);
  const { user, token } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        phoneCountryCode: data.phoneCountryCode,
        phoneNumber: data.phoneNumber,
        dateOfBirth: new Date(`${data.dateOfBirth}T00:00:00.000Z`),
      },
    });
    const token = crypto.randomBytes(32).toString("hex");
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashVerificationToken(token),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
    return { user, token };
  });

  try {
    await sendVerificationEmail(user.email, user.name, token);
    return { user: toPublicUser(user), emailSent: true };
  } catch (error) {
    console.error("Verification email could not be sent:", error);
    return { user: toPublicUser(user), emailSent: false };
  }
}

export async function resendVerificationEmail(email: string) {
  if (!isVerificationEmailConfigured()) {
    throw new HttpError(503, "Email verification is not configured. Contact the site administrator.");
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.emailVerifiedAt) return;

  const token = await createVerificationToken(user.id);
  try {
    await sendVerificationEmail(user.email, user.name, token);
  } catch (error) {
    console.error("Verification email could not be resent:", error);
    throw new HttpError(503, "Unable to send the verification email right now. Please try again later.");
  }
}

export async function verifyEmail(token: string) {
  const tokenHash = hashVerificationToken(token);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.expiresAt <= new Date()) {
    throw new HttpError(400, "This verification link is invalid or has expired. Request a new one.");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.delete({ where: { id: record.id } }),
  ]);
}

export async function loginUser(data: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user?.passwordHash) {
    // Same message for "no account" and "Google-only account" so emails can't be probed.
    throw new HttpError(401, "Invalid email or password");
  }

  const matches = await bcrypt.compare(data.password, user.passwordHash);
  if (!matches) throw new HttpError(401, "Invalid email or password");
  if (!user.emailVerifiedAt) {
    throw new HttpError(403, "Verify your email before signing in.");
  }

  return toPublicUser(user);
}

export async function getCurrentUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new HttpError(401, "Please sign in");
  return toPublicUser(user);
}

export const googleAuthUrl = (state: string) => {
  if (!isGoogleOAuthConfigured()) {
    throw new HttpError(503, "Google sign-in is not configured");
  }

  return googleClient.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
};

export async function loginWithGoogleCode(code: string) {
  if (!isGoogleOAuthConfigured()) {
    throw new HttpError(503, "Google sign-in is not configured");
  }

  const { tokens } = await googleClient.getToken(code);
  if (!tokens.id_token) throw new HttpError(400, "Google did not return an ID token");

  const ticket = await googleClient.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const profile = ticket.getPayload();

  if (!profile?.email || !profile.email_verified) {
    throw new HttpError(400, "Your Google email is not verified");
  }

  const email = profile.email.toLowerCase();
  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId: profile.sub }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: profile.name ?? email.split("@")[0],
        email,
        googleId: profile.sub,
        avatarUrl: profile.picture,
        emailVerifiedAt: new Date(),
      },
    });
  } else if (!user.googleId || !user.emailVerifiedAt) {
    if (user.googleId && user.googleId !== profile.sub) {
      throw new HttpError(409, "This email is already linked to another Google account");
    }
    // Existing email/password account: link Google to it.
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.sub,
        avatarUrl: user.avatarUrl ?? profile.picture,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });
  }

  return toPublicUser(user);
}