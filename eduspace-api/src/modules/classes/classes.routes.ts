import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth as auth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as c from "./classes.controller";
import { classSchema, classUpdateSchema } from "./classes.schema";

// Mounted at /api, so full paths are written here.
const router = Router();
const teacher = requireRole("TEACHER", "ADMIN");

router.get("/courses/:courseId/classes", auth, h(c.listForCourse));
router.post("/courses/:courseId/classes", auth, teacher, validate(classSchema), h(c.create));

router.get("/classes/mine", auth, h(c.listMine)); // keep above "/classes/:id"
router.get("/classes/:id", auth, h(c.get));
router.patch("/classes/:id", auth, teacher, validate(classUpdateSchema), h(c.update));
router.delete("/classes/:id", auth, teacher, h(c.remove));

export default router;