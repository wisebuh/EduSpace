import { RequestHandler } from "express";
import { COOKIE_NAME, verifyToken } from "../lib/jwt";
import { HttpError } from "../lib/httpError";
import { prisma } from "../lib/prisma";

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  const token =
    req.cookies?.[COOKIE_NAME] ?? (header?.startsWith("Bearer ") ? header.slice(7) : undefined);

  if (!token) return next(new HttpError(401, "Please sign in"));

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return next(new HttpError(401, "Your session has expired. Please sign in again"));
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { role: true, emailVerifiedAt: true },
  });
  if (!user) return next(new HttpError(401, "Please sign in"));
  if (!user.emailVerifiedAt) {
    return next(new HttpError(403, "Verify your email before continuing."));
  }

  req.user = { id: payload.sub, role: user.role };
  next();
};