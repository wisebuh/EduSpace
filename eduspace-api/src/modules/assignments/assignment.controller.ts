import { Request, Response } from "express";
import * as service from "./assignment.service";

export async function listMine(req: Request, res: Response) {
  res.json({ assignments: await service.listMine(req.user!) });
}

export async function get(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ assignment: await service.getAssignment(req.user!, id) });
}

export async function create(req: Request, res: Response) {
  const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
  const assignment = await service.createAssignment(req.user!, classId, req.body);
  res.status(201).json({ assignment });
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