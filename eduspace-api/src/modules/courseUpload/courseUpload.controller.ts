import { NextFunction, Request, Response } from "express";
import { HttpError } from "../../lib/httpError";
import { uploadBodySchema } from "./courseUpload.schema";
import * as service from "./courseUpload.service";

export async function upload(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, 'Choose a file to upload (form field name: "file")');

  const body = uploadBodySchema.safeParse(req.body);
  if (!body.success) {
    await service.discardUpload(req.file); // don't leave the file behind
    throw body.error;
  }

  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  const material = await service.createMaterial(
    req.user!,
    courseId,
    req.file,
    body.data.title
  );
  res.status(201).json({ material });
}

export async function list(req: Request, res: Response) {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  res.json({ materials: await service.listMaterials(req.user!, courseId) });
}

export async function listMine(req: Request, res: Response) {
  res.json({ materials: await service.listMyMaterials(req.user!) });
}

export async function download(req: Request, res: Response, next: NextFunction) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const file = await service.getMaterialFile(req.user!, id);

  // Sends the file as a download with its original name.
  res.download(file.path, file.name, (err) => {
    if (err && !res.headersSent) next(new HttpError(404, "File not found on the server"));
  });
}

export async function view(req: Request, res: Response, next: NextFunction) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const file = await service.getMaterialFile(req.user!, id);

  res.type(file.mimeType);
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`);
  res.sendFile(file.path, (err) => {
    if (err && !res.headersSent) next(new HttpError(404, "File not found on the server"));
  });
}

export async function remove(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.deleteMaterial(req.user!, id);
  res.status(204).send();
}