import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as c from "./announcement.controller";
import { announcementSchema } from "./announcement.schema";

const router = Router();
router.use(requireAuth);
router.get("/", h(c.list));
router.post("/", requireRole("TEACHER", "ADMIN"), validate(announcementSchema), h(c.create));
router.delete("/:id", requireRole("TEACHER", "ADMIN"), h(c.remove));

export default router;
