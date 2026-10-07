import { Request, Response } from "express";
import * as service from "./classes.service";

export async function listForCourse(req: Request, res: Response) {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  res.json({ classes: await service.listForCourse(req.user!, courseId) });
}

export async function listMine(req: Request, res: Response) {
  res.json({ classes: await service.listMine(req.user!) });
}

export async function get(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ class: await service.getClass(req.user!, id) });
}

export async function create(req: Request, res: Response) {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  const created = await service.createClass(req.user!, courseId, req.body);
  res.status(201).json({ class: created });
}

export async function update(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ class: await service.updateClass(req.user!, id, req.body) });
}

export async function remove(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.deleteClass(req.user!, id);
  res.status(204).send();
}