import { RequestHandler, Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { assertCourseOwner } from "../../lib/access";
import { requireAuth as auth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import * as c from "./courseUpload.controller";
import { uploadMaterial } from "./courseUpload.upload";

// Mounted at /api, so full paths are written here.
const router = Router();
const teacher = requireRole("TEACHER", "ADMIN");

// Check the course belongs to this teacher BEFORE the file is saved to disk.
const ownsCourse: RequestHandler = (req, _res, next) => {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  assertCourseOwner(req.user!, courseId)
    .then(() => next())
    .catch(next);
};

router.post("/courses/:courseId/materials", auth, teacher, ownsCourse, uploadMaterial, h(c.upload));
router.get("/courses/:courseId/materials", auth, h(c.list));

router.get("/materials/:id/download", auth, h(c.download));
router.delete("/materials/:id", auth, teacher, h(c.remove));

export default router;