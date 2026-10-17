import multer from "multer";
import { AppError } from "../utils/AppError";

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return cb(new AppError(400, "Only JPEG, PNG or WebP images are allowed", "INVALID_FILE_TYPE"));
    }
    cb(null, true);
  },
}).single("image");