import { Request, Response } from "express";
import * as service from "./announcement.service";

export async function list(req: Request, res: Response) {
  const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
  res.json({ announcements: await service.listAnnouncements(req.user!, courseId) });
}

export async function create(req: Request, res: Response) {
  const announcement = await service.createAnnouncement(req.user!, req.body);
  res.status(201).json({ announcement });
}

export async function remove(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.deleteAnnouncement(req.user!, id);
  res.status(204).send();
}
