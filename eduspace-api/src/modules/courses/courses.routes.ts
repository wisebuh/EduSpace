import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as c from "./courses.controller";
import { courseSchema, courseUpdateSchema, enrollmentSchema } from "./courses.schema";

const router = Router();

router.use(requireAuth);

router.get("/", h(c.list));
router.post("/", requireRole("TEACHER", "ADMIN"), validate(courseSchema), h(c.create));

router.get("/:id", h(c.get));
router.patch("/:id", requireRole("TEACHER", "ADMIN"), validate(courseUpdateSchema), h(c.update));
router.delete("/:id", requireRole("TEACHER", "ADMIN"), h(c.remove));

router.post("/:id/enroll", requireRole("STUDENT"), validate(enrollmentSchema), h(c.enroll));
router.delete("/:id/enroll", requireRole("STUDENT"), h(c.unenroll));
router.get("/:id/students", requireRole("TEACHER", "ADMIN"), h(c.students));

export default router;