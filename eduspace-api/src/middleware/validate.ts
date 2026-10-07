import { RequestHandler } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny, source: "body" | "query" = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) return next(result.error);
    (req as any)[source] = result.data;
    next();
  };