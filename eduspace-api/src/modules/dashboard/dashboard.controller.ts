import { Request, Response } from "express";
import * as service from "./dashboard.service";

export async function get(req: Request, res: Response) {
  res.json(await service.getDashboard(req.user!));
}