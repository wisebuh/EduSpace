import { Request, Response } from "express";
import { COOKIE_NAME, cookieOptions } from "../../lib/jwt";
import * as service from "./users.service";

export async function updateMe(req: Request, res: Response) {
  const user = await service.updateProfile(req.user!.id, req.body);
  res.json({ user });
}

export async function changeMyPassword(req: Request, res: Response) {
  await service.changePassword(req.user!.id, req.body);
  res.json({ message: "Password updated" });
}

export async function deleteMe(req: Request, res: Response) {
  await service.deleteAccount(req.user!.id);
  const { maxAge, ...options } = cookieOptions;
  res.clearCookie(COOKIE_NAME, options);
  res.status(204).send();
}

export async function list(req: Request, res: Response) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
  res.json(await service.listUsers(page, pageSize));
}

export async function setRole(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const user = await service.updateRole(id, req.body.role, req.user!.id);
  res.json({ user });
}