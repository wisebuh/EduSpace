import { CookieOptions } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

export const COOKIE_NAME = "token";

export type TokenPayload = { sub: string; role: Role };

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });

export const verifyToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as TokenPayload;

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};