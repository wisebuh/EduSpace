import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth as auth } from "../../middleware/requireAuth";
import * as c from "./certificate.controller";

const router = Router();

router.get("/courses/:courseId/certificate-eligibility", auth, h(c.checkEligibility));
router.post("/courses/:courseId/issue-certificate", auth, h(c.issueCertificate));
router.get("/certificates/mine", auth, h(c.listMine));
router.get("/certificates/verify/:code", h(c.verifyCertificate));

export default router;
