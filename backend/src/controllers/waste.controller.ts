import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { AppError } from "../utils/AppError";
import * as wasteService from "../services/waste.service";
import { uploadImageBuffer } from "../services/storage.service";

function assertValid(req: Request) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const e = errors.array()[0] as any;
    throw new AppError(400, `${e.path}: ${e.msg}`, "VALIDATION_ERROR");
  }
}

function mapDbError(err: any): never {
  if (err?.code === "23503") throw new AppError(400, "Invalid category", "INVALID_CATEGORY");
  throw err;
}

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ success: true, data: await wasteService.getCategories() });
  } catch (err) {
    next(err);
  }
}

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    assertValid(req);
    const listing = await wasteService.createListing(req.user!.id, req.body).catch(mapDbError);
    res.status(201).json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

export async function myListings(req: Request, res: Response, next: NextFunction) {
  try {
    const scope = req.query.scope === "history" ? "history" : "active";
    res.json({ success: true, data: await wasteService.getMyListings(req.user!.id, scope) });
  } catch (err) {
    next(err);
  }
}

export async function getListing(req: Request, res: Response, next: NextFunction) {
  try {
    assertValid(req);
    const listing = await wasteService.getListingById(req.params.id, req.user!.id);
    if (!listing) throw new AppError(404, "Listing not found", "NOT_FOUND");
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

export async function updateListing(req: Request, res: Response, next: NextFunction) {
  try {
    assertValid(req);
    const listing = await wasteService.updateListing(req.params.id, req.user!.id, req.body).catch(mapDbError);
    if (!listing) throw new AppError(404, "Listing not found or can no longer be edited", "NOT_FOUND");
    res.json({ success: true, data: listing });
  } catch (err) {
    next(err);
  }
}

export async function removeListing(req: Request, res: Response, next: NextFunction) {
  try {
    assertValid(req);
    const ok = await wasteService.deleteListing(req.params.id, req.user!.id);
    if (!ok) throw new AppError(404, "Listing not found or can no longer be deleted", "NOT_FOUND");
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function uploadWasteImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError(400, "image file is required", "NO_FILE");
    const url = await uploadImageBuffer(req.file.buffer);
    res.status(201).json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
}