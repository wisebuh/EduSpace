import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { validate } from "../../middleware/validate";
import * as controller from "./auth.controller";
import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verificationSchema,
} from "./auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), asyncHandler(controller.register));
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/verify-email", validate(verificationSchema), asyncHandler(controller.verifyEmail));
router.post(
  "/resend-verification",
  validate(resendVerificationSchema),
  asyncHandler(controller.resendVerification)
);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, asyncHandler(controller.me));

router.get("/google/config", controller.googleConfig);
router.get("/google", controller.googleStart);
router.get("/google/callback", asyncHandler(controller.googleCallback));

export default router;