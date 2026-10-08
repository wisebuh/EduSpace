import { Router } from "express";
import { RequestHandler } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { assertCourseOwner } from "../../lib/access";
import { HttpError } from "../../lib/httpError";
import { prisma } from "../../lib/prisma";
import { requireAuth as auth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { uploadMaterial } from "../courseUpload/courseUpload.upload";
import * as c from "./assignment.controller";
import { assignmentSchema, assignmentUpdateSchema } from "./assignment.schema";

// Mounted at /api, so full paths are written here.
const router = Router();
const teacher = requireRole("TEACHER", "ADMIN");

const ownsClass: RequestHandler = (req, _res, next) => {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  prisma.class.findUnique({ where: { id: classId }, select: { courseId: true } })
    .then((cls) => {
      if (!cls) throw new HttpError(404, "Class not found");
      return assertCourseOwner(req.user!, cls.courseId);
    })
    .then(() => next())
    .catch(next);
};

const ownsAssignment: RequestHandler = (req, _res, next) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  prisma.assignment.findUnique({
    where: { id },
    select: { class: { select: { courseId: true } } },
  })
    .then((assignment) => {
      if (!assignment) throw new HttpError(404, "Assignment not found");
      return assertCourseOwner(req.user!, assignment.class.courseId);
    })
    .then(() => next())
    .catch(next);
};

router.post("/classes/:classId/assignments", auth, teacher, ownsClass, uploadMaterial, h(c.create));

router.get("/assignments", auth, h(c.listMine));
router.get("/assignments/:id", auth, h(c.get));
router.post("/assignments/:id/attachment", auth, teacher, ownsAssignment, uploadMaterial, h(c.uploadAttachment));
router.get("/assignments/:id/attachment/download", auth, h(c.downloadAttachment));
router.patch("/assignments/:id", auth, teacher, validate(assignmentUpdateSchema), h(c.update));
router.delete("/assignments/:id", auth, teacher, h(c.remove));

export default router;