import { Request, Response } from "express";
import * as service from "./certificate.service";

export async function checkEligibility(req: Request, res: Response) {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  const eligibility = await service.checkEligibility(req.user!, courseId);
  res.json(eligibility);
}

export async function issueCertificate(req: Request, res: Response) {
  const courseId = Array.isArray(req.params.courseId) ? req.params.courseId[0] : req.params.courseId;
  const certificate = await service.issueCertificate(req.user!, courseId);
  res.status(201).json({ certificate });
}

export async function listMine(req: Request, res: Response) {
  const certificates = await service.listMine(req.user!);
  res.json({ certificates });
}

export async function verifyCertificate(req: Request, res: Response) {
  const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;
  const certificate = await service.getByCode(code);
  res.json({ certificate });
}
