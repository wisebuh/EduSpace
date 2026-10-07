import { Request, Response } from "express";
import * as service from "./courses.service";

export async function list(req: Request, res: Response) {
  const courses = await service.listCourses(req.user!, {
    mine: req.query.mine === "true",
    q: typeof req.query.q === "string" ? req.query.q : undefined,
  });
  res.json({ courses });
}

export async function get(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ course: await service.getCourse(req.user!, id) });
}

export async function create(req: Request, res: Response) {
  res.status(201).json({ course: await service.createCourse(req.user!, req.body) });
}

export async function update(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ course: await service.updateCourse(req.user!, id, req.body) });
}

export async function remove(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.deleteCourse(req.user!, id);
  res.status(204).send();
}

export async function enroll(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.status(201).json({ enrollment: await service.enroll(req.user!, id, req.body.classId) });
}

export async function unenroll(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.unenroll(req.user!, id);
  res.status(204).send();
}

export async function students(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.json({ students: await service.listStudents(req.user!, id) });
}