import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../../config/env";
import { COOKIE_NAME, cookieOptions, signToken } from "../../lib/jwt";
import * as service from "./auth.service";

const STATE_COOKIE = "oauth_state";

const setAuthCookie = (res: Response, user: { id: string; role: any }) =>
  res.cookie(COOKIE_NAME, signToken({ sub: user.id, role: user.role }), cookieOptions);

export async function register(req: Request, res: Response) {
  const result = await service.registerUser(req.body);
  res.status(201).json({
    email: result.user.email,
    emailSent: result.emailSent,
    message: result.emailSent
      ? "Check your inbox for a verification link before signing in."
      : env.NODE_ENV === "development"
      ? "Account created and verified for development! You can now sign in."
      : "Your account was created, but the verification email could not be sent. Request a new verification email to try again.",
  });
}

export async function verifyEmail(req: Request, res: Response) {
  await service.verifyEmail(req.body.token);
  res.json({ message: "Email verified. You can now sign in." });
}

export async function resendVerification(req: Request, res: Response) {
  await service.resendVerificationEmail(req.body.email);
  res.json({
    message: "If an unverified account exists for that email, a verification link has been sent.",
  });
}

export async function login(req: Request, res: Response) {
  const user = await service.loginUser(req.body);
  setAuthCookie(res, user);
  res.json({ user });
}

export function logout(_req: Request, res: Response) {
  const { maxAge, ...options } = cookieOptions;
  res.clearCookie(COOKIE_NAME, options);
  res.json({ message: "Signed out" });
}

export async function me(req: Request, res: Response) {
  const user = await service.getCurrentUser(req.user!.id);
  res.json({ user });
}

export function googleConfig(_req: Request, res: Response) {
  res.json({ enabled: service.isGoogleOAuthConfigured() });
}

/** Step 1: send the browser to Google. */
export function googleStart(_req: Request, res: Response) {
  if (!service.isGoogleOAuthConfigured()) {
    return res.redirect(`${env.CLIENT_URL}/sign-in?error=google_unavailable`);
  }

  const state = crypto.randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
  res.redirect(service.googleAuthUrl(state));
}

function googleCallbackErrorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "GOOGLE_TOKEN_EXCHANGE_FAILED") return "google_token";
  if (message === "GOOGLE_ID_TOKEN_INVALID") return "google_identity";
  if (message === "GOOGLE_ACCOUNT_STORE_FAILED") return "google_database";
  if (/already linked to another Google account/i.test(message)) return "google_account_conflict";
  if (/redirect_uri_mismatch|redirect uri/i.test(message)) return "google_redirect";
  if (/invalid_client|unauthorized_client|client authentication/i.test(message)) return "google_client";
  if (/invalid_grant|expired|already been used/i.test(message)) return "google_expired";
  return "google_callback";
}

/** Step 2: Google sends the browser back here with a code. */
export async function googleCallback(req: Request, res: Response) {
  const { code, state } = req.query;
  const savedState = req.cookies?.[STATE_COOKIE];
  res.clearCookie(STATE_COOKIE);

  if (typeof req.query.error === "string") {
    console.warn("Google OAuth callback error from Google:", req.query.error, req.query.error_description);
    return res.redirect(`${env.CLIENT_URL}/sign-in?error=google_provider`);
  }

  if (typeof code !== "string") {
    console.warn("Google OAuth callback missing code. Query params:", req.query);
    return res.redirect(`${env.CLIENT_URL}/sign-in?error=google_code`);
  }

  if (typeof state !== "string" || state !== savedState) {
    console.warn(
      `Google sign-in state mismatch. Received state: "${state}", Saved cookie: "${savedState}". Ensure client and API are accessed on the same hostname (e.g. localhost, not 127.0.0.1).`
    );
    return res.redirect(`${env.CLIENT_URL}/sign-in?error=google_state`);
  }

  try {
    const user = await service.loginWithGoogleCode(code);
    setAuthCookie(res, user);
    res.redirect(`${env.CLIENT_URL}/dashboard`);
  } catch (error) {
    console.error("Google sign-in failed:", error);
    res.redirect(`${env.CLIENT_URL}/sign-in?error=${googleCallbackErrorCode(error)}`);
  }
}