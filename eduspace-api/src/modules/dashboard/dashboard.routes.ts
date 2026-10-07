import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import * as c from "./dashboard.controller";

const router = Router();

router.get("/", requireAuth, h(c.get));

export default router;