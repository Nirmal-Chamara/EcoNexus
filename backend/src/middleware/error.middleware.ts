import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res
      .status(err.status)
      .json({ success: false, message: err.message, code: err.code });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error" });
}