import { Router } from "express";
import { asyncHandler as h } from "../../lib/asyncHandler";
import { requireAuth as auth } from "../../middleware/requireAuth";
import { requireRole } from "../../middleware/requireRole";
import { validate } from "../../middleware/validate";
import * as c from "./grades.controller";
import { examGradeSchema } from "./grades.schema";

const router = Router();
const teacher = requireRole("TEACHER", "ADMIN");

router.get("/classes/:classId/gradebook", auth, teacher, h(c.getGradebook));
router.post("/classes/:classId/grade", auth, teacher, h(c.updateGrade));
router.post("/classes/:classId/exam-grade", auth, teacher, validate(examGradeSchema), h(c.updateExamGrade));
router.post("/classes/:classId/attendance", auth, teacher, h(c.recordAttendance));
router.get("/attendance/mine/today", auth, requireRole("STUDENT"), h(c.getMyTodayAttendance));
router.post("/classes/:classId/attendance/check-in", auth, requireRole("STUDENT"), h(c.markMyAttendance));
router.get("/grades/mine", auth, h(c.getMyGrades));

export default router;
