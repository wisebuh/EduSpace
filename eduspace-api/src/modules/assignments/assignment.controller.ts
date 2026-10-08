import { Request, Response } from "express";
import { HttpError } from "../../lib/httpError";
import { uploadBodySchema } from "../courseUpload/courseUpload.schema";
import * as uploadService from "../courseUpload/courseUpload.service";
import * as service from "./assignment.service";
import { assignmentSchema } from "./assignment.schema";

export async function listMine(req: Request, res: Response) {
  res.json({ assignments: await service.listMine(req.user!) });
}

export async function get(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ assignment: await service.getAssignment(req.user!, id) });
}

export async function create(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const body = assignmentSchema.safeParse(req.body);
  if (!body.success) {
    if (req.file) await uploadService.discardUpload(req.file);
    throw body.error;
  }

  try {
    const assignment = await service.createAssignment(req.user!, classId, body.data, req.file);
    res.status(201).json({ assignment });
  } catch (error) {
    if (req.file) await uploadService.discardUpload(req.file);
    throw error;
  }
}

export async function uploadAttachment(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, 'Choose a file to upload (form field name: "file")');
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const body = uploadBodySchema.safeParse(req.body);
  if (!body.success) {
    await uploadService.discardUpload(req.file);
    throw body.error;
  }

  try {
    const assignment = await service.attachFile(req.user!, id, req.file, body.data.title);
    res.json({ assignment });
  } catch (error) {
    await uploadService.discardUpload(req.file);
    throw error;
  }
}

export async function downloadAttachment(req: Request, res: Response, next: (error?: unknown) => void) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const file = await service.getAssignmentFile(req.user!, id);
  res.download(file.path, file.name, (error) => {
    if (error && !res.headersSent) next(new HttpError(404, "Assignment file not found on the server"));
  });
}

export async function update(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ assignment: await service.updateAssignment(req.user!, id, req.body) });
}

export async function remove(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.deleteAssignment(req.user!, id);
  res.status(204).send();
}