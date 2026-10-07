import { Request, Response } from "express";
import * as service from "./notification.service";

export async function list(req: Request, res: Response) {
  res.json(await service.listNotifications(req.user!));
}

export async function markRead(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await service.markNotificationRead(req.user!, id);
  res.status(204).send();
}

export async function markAllRead(req: Request, res: Response) {
  await service.markAllNotificationsRead(req.user!);
  res.status(204).send();
}
