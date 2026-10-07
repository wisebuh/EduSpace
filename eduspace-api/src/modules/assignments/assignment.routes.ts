import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth as auth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as c from "./assignment.controller";
import { assignmentSchema, assignmentUpdateSchema } from "./assignment.schema";

// Mounted at /api, so full paths are written here.
const router = Router();
const teacher = requireRole("TEACHER", "ADMIN");

router.post("/classes/:classId/assignments", auth, teacher, validate(assignmentSchema), h(c.create));

router.get("/assignments", auth, h(c.listMine));
router.get("/assignments/:id", auth, h(c.get));
router.patch("/assignments/:id", auth, teacher, validate(assignmentUpdateSchema), h(c.update));
router.delete("/assignments/:id", auth, teacher, h(c.remove));

export default router;