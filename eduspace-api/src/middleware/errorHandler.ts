import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { HttpError } from "../lib/httpError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Please check the highlighted fields",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      message: "The database is unavailable. Start PostgreSQL and check DATABASE_URL.",
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021" || err.code === "P2022") {
      return res.status(503).json({
        message: "The database schema is out of date. Run npx prisma db push and restart the API.",
      });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ message: "This record already exists" });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Record not found" });
    }
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong. Please try again" });
};