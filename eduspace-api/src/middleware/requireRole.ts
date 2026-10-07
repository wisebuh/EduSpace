import { RequestHandler } from "express";
import { Role } from "@prisma/client";
import { HttpError } from "../lib/httpError";

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to do this"));
    }
    next();
  };