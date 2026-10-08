import { Request, Response } from "express";
import * as service from "./grades.service";

export async function getGradebook(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const gradebook = await service.getGradebook(req.user!, classId);
  res.json(gradebook);
}

export async function updateGrade(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const { studentId, assignmentId, grade, feedback } = req.body;
  const submission = await service.updateStudentGrade(req.user!, classId, {
    studentId,
    assignmentId,
    grade: Number(grade),
    feedback,
  });
  res.json({ submission });
}

export async function updateExamGrade(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const score = Number(req.body.score);
  const enrollment = await service.updateExamGrade(req.user!, classId, {
    studentId: req.body.studentId,
    score,
  });
  res.json({ enrollment });
}

export async function recordAttendance(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const { records } = req.body;
  const result = await service.recordAttendance(req.user!, classId, { records });
  res.json({ records: result });
}

export async function getMyTodayAttendance(req: Request, res: Response) {
  res.json({ records: await service.getMyTodayAttendance(req.user!) });
}

export async function markMyAttendance(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  res.status(201).json({ record: await service.markMyAttendance(req.user!, classId) });
}

export async function getMyGrades(req: Request, res: Response) {
  const grades = await service.getStudentGrades(req.user!);
  res.json({ grades });
}
