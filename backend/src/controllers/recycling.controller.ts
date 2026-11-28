import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import * as recyclingService from '../services/recycling.service';

// ── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await recyclingService.getProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function upsertProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await recyclingService.upsertProfile(req.user!.id, req.body);
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function getPublicCenters(_req: Request, res: Response, next: NextFunction) {
  try {
    const centers = await recyclingService.listPublicCenters();
    res.json({ success: true, count: centers.length, data: centers });
  } catch (err) { next(err); }
}

// ── Verification Status ───────────────────────────────────────────────────────

export async function getVerificationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await recyclingService.getVerificationStatus(req.user!.id);
    res.json({ success: true, data: status });
  } catch (err) { next(err); }
}

// ── Accepted Categories ───────────────────────────────────────────────────────

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await recyclingService.getAcceptedCategories(req.user!.id);
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
}

export async function addCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await recyclingService.addAcceptedCategory(
      req.user!.id,
      Number(req.body.category_id)
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
}

export async function removeCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    const removed = await recyclingService.removeAcceptedCategory(req.user!.id, categoryId);
    if (!removed) throw new AppError(404, 'Category not found in your accepted list', 'NOT_FOUND');
    res.json({ success: true, message: 'Category removed' });
  } catch (err) { next(err); }
}

// ── Intake Records ────────────────────────────────────────────────────────────

export async function getIntakeRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const statusFilter = req.query.status as string | undefined;
    const records = await recyclingService.getIntakeRecords(req.user!.id, statusFilter);
    res.json({ success: true, count: records.length, data: records });
  } catch (err) { next(err); }
}

export async function getIntakeById(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recyclingService.getIntakeById(req.user!.id, req.params.id);
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
}

export async function createIntake(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recyclingService.createIntake(req.user!.id, req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) { next(err); }
}

export async function updateIntakeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await recyclingService.updateIntakeStatus(
      req.user!.id,
      req.params.id,
      req.body.status
    );
    res.json({ success: true, data: record });
  } catch (err) { next(err); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await recyclingService.getDashboardSummary(req.user!.id);
    res.json({ success: true, data: summary });
  } catch (err) { next(err); }
}
