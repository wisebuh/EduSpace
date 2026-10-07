import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { HttpError } from "../../lib/httpError";

export const MAX_FILE_SIZE_MB = 25;

// Files are saved on this server's disk. Swap for S3/Cloudinary when you deploy to a host
// that does not keep files between restarts.
export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "materials");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
  "image/png",
  "image/jpeg",
  "video/mp4",
  "application/zip",
]);

export const uploadMaterial = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    // Random name on disk, so two people uploading "notes.pdf" never clash.
    filename: (_req, file, cb) =>
      cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    cb(new HttpError(400, "This file type is not allowed. Use PDF, Office files, images, MP4, CSV, TXT or ZIP"));
  },
}).single("file");