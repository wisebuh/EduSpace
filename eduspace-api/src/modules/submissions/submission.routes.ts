import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth as auth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import { uploadMaterial } from "../courseUpload/courseUpload.upload";
import * as c from "./submission.controller";
import { gradeSchema, submitSchema } from "./submission.schema";

// Mounted at /api, so full paths are written here.
const router = Router();
const teacher = requireRole("TEACHER", "ADMIN");

router.post(
  "/assignments/:assignmentId/submissions",
  auth,
  requireRole("STUDENT"),
  validate(submitSchema),
  h(c.submit)
);
router.post(
  "/assignments/:assignmentId/submissions/file",
  auth,
  requireRole("STUDENT"),
  uploadMaterial,
  h(c.submitFile)
);
router.get("/assignments/:assignmentId/submissions", auth, teacher, h(c.listForAssignment));

router.get("/submissions/mine", auth, requireRole("STUDENT"), h(c.listMine)); // keep above "/:id"
router.get("/submissions/:id/file", auth, h(c.downloadFile));
router.get("/submissions/:id", auth, h(c.get));
router.patch("/submissions/:id/grade", auth, teacher, validate(gradeSchema), h(c.grade));

export default router;