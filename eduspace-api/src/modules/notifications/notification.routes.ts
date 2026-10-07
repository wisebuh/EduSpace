import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import * as c from "./notification.controller";

const router = Router();
router.use(requireAuth);
router.get("/", h(c.list));
router.patch("/read-all", h(c.markAllRead));
router.patch("/:id/read", h(c.markRead));

export default router;
