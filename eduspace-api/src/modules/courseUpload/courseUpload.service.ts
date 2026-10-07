import fs from "fs/promises";
import path from "path";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/httpError";
import { AuthUser, assertCourseAccess, assertCourseOwner } from "../../lib/access";
import { UPLOAD_DIR } from "./courseUpload.upload";
import { notifyCourseStudents } from "../notifications/notification.service";

const filePath = (storedName: string) => path.join(UPLOAD_DIR, storedName);
const removeFile = (storedName: string) => fs.unlink(filePath(storedName)).catch(() => {});

export async function createMaterial(
  user: AuthUser,
  courseId: string,
  file: Express.Multer.File,
  title?: string
) {
  const material = await prisma.courseMaterial.create({
    data: {
      title: title || file.originalname,
      originalName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      courseId,
      uploadedById: user.id,
    },
    include: { course: { select: { title: true } } },
  });
  await notifyCourseStudents(courseId, {
    title: `New course material: ${material.title}`,
    message: `${material.course.title} has new learning material available.`,
    href: "/lms",
  });
  return material;
}

export async function listMaterials(user: AuthUser, courseId: string) {
  await assertCourseAccess(user, courseId);

  return prisma.courseMaterial.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      originalName: true,
      mimeType: true,
      size: true,
      createdAt: true,
      uploadedBy: { select: { id: true, name: true } },
    },
  });
}

/** Returns where the file is on disk, after checking the user may see it. */
export async function getMaterialFile(user: AuthUser, id: string) {
  const material = await prisma.courseMaterial.findUnique({ where: { id } });
  if (!material) throw new HttpError(404, "File not found");

  await assertCourseAccess(user, material.courseId);
  return { path: filePath(material.storedName), name: material.originalName };
}

export async function deleteMaterial(user: AuthUser, id: string) {
  const material = await prisma.courseMaterial.findUnique({ where: { id } });
  if (!material) throw new HttpError(404, "File not found");

  await assertCourseOwner(user, material.courseId);
  await prisma.courseMaterial.delete({ where: { id } });
  await removeFile(material.storedName);
}

/** Call before deleting a course so its files don't stay on disk. */
export async function deleteCourseFiles(courseId: string) {
  const materials = await prisma.courseMaterial.findMany({
    where: { courseId },
    select: { storedName: true },
  });
  await Promise.all(materials.map((m) => removeFile(m.storedName)));
}

/** Used when a request fails after the file was already saved. */
export const discardUpload = (file: Express.Multer.File) => removeFile(file.filename);