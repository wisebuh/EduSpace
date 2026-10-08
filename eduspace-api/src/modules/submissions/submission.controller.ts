import { NextFunction, Request, Response } from "express";
import { HttpError } from "../../lib/httpError";
import { discardUpload } from "../courseUpload/courseUpload.service";
import * as service from "./submission.service";

export async function submit(req: Request, res: Response) {
  const assignmentId = Array.isArray(req.params.assignmentId) ? req.params.assignmentId[0] : req.params.assignmentId;
  const submission = await service.submit(req.user!, assignmentId, req.body);
  res.status(201).json({ submission });
}

export async function submitFile(req: Request, res: Response) {
  const assignmentId = Array.isArray(req.params.assignmentId) ? req.params.assignmentId[0] : req.params.assignmentId;
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
  const fileUrl = typeof req.body.fileUrl === "string" && req.body.fileUrl ? req.body.fileUrl : null;
  if (!req.file && !content && !fileUrl) {
    throw new HttpError(400, "Write an answer, attach a file, or provide a file link");
  }

  try {
    const submission = await service.submit(
      req.user!,
      assignmentId,
      { content: content || null, fileUrl },
      req.file
    );
    res.status(201).json({ submission });
  } catch (error) {
    if (req.file) await discardUpload(req.file);
    throw error;
  }
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

export async function downloadFile(req: Request, res: Response, next: NextFunction) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const file = await service.getSubmissionFile(req.user!, id);
  res.download(file.path, file.name, (error) => {
    if (error && !res.headersSent) next(new HttpError(404, "Submission file not found on the server"));
  });
}