import { Request, Response } from "express";
import * as service from "./submission.service";

export async function submit(req: Request, res: Response) {
  const assignmentId = Array.isArray(req.params.assignmentId) ? req.params.assignmentId[0] : req.params.assignmentId;
  const submission = await service.submit(req.user!, assignmentId, req.body);
  res.status(201).json({ submission });
}

export async function listForAssignment(req: Request, res: Response) {
  const assignmentId = Array.isArray(req.params.assignmentId) ? req.params.assignmentId[0] : req.params.assignmentId;
  res.json({ submissions: await service.listForAssignment(req.user!, assignmentId) });
}

export async function listMine(req: Request, res: Response) {
  res.json({ submissions: await service.listMine(req.user!) });
}

export async function get(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ submission: await service.getSubmission(req.user!, id) });
}

export async function grade(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ submission: await service.gradeSubmission(req.user!, id, req.body) });
}