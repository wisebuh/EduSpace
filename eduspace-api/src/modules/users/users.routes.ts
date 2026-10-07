import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as controller from "./users.controller";
import { changePasswordSchema, updateProfileSchema, updateRoleSchema } from "./users.schema";

const router = Router();

router.use(requireAuth);

// Settings page
router.patch("/me", validate(updateProfileSchema), asyncHandler(controller.updateMe));
router.patch("/me/password", validate(changePasswordSchema), asyncHandler(controller.changeMyPassword));
router.delete("/me", asyncHandler(controller.deleteMe));

// Admin only
router.get("/", requireRole("ADMIN"), asyncHandler(controller.list));
router.patch("/:id/role", requireRole("ADMIN"), validate(updateRoleSchema), asyncHandler(controller.setRole));

export default router;