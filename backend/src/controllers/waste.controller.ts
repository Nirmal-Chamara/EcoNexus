import { Request, Response } from "express";
import * as wasteService from "../services/waste.service";

export async function listCategories(req: Request, res: Response) {
  try {
    const categories = await wasteService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("listCategories failed:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}