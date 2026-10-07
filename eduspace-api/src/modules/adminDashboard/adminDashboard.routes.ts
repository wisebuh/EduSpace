import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as c from "./adminDashboard.controller";
import { listCoursesQuery, listUsersQuery, publishSchema } from "./adminDashboard.schema";

// Mounted at /api/admin. Everything here is admin only.
const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/dashboard", h(c.overview));

router.get("/users", validate(listUsersQuery, "query"), h(c.listUsers));
router.delete("/users/:id", h(c.deleteUser));

router.get("/courses", validate(listCoursesQuery, "query"), h(c.listCourses));
router.patch("/courses/:id/publish", validate(publishSchema), h(c.setPublished));

export default router;