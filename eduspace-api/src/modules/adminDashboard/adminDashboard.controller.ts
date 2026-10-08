import { Request, Response } from "express";
import * as service from "./adminDashboard.service";
import { ListCoursesQuery, ListUsersQuery } from "./adminDashboard.schema";

export async function overview(_req: Request, res: Response) {
  res.json(await service.getOverview());
}

export async function listUsers(req: Request, res: Response) {
  // The query was already checked and converted by validate().
  res.json(await service.listUsers(req.query as unknown as ListUsersQuery));
}

export async function deleteUser(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.deleteUser(req.user!.id, id);
  res.status(204).send();
}

export async function listCourses(req: Request, res: Response) {
  res.json(await service.listCourses(req.query as unknown as ListCoursesQuery));
}

export async function setPublished(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const course = await service.setCoursePublished(id, req.body.published);
  res.json({ course });
}

export async function updateRole(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await service.updateUserRole(req.user!.id, id, req.body.role);
  res.json({ user });
}