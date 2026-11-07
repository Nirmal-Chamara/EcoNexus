import { body, param } from "express-validator";

export const idRule = [param("id").isUUID()];

const todayLocal = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

export const listingRules = [
  body("categoryId").isInt({ min: 1 }).toInt(),
  body("title").optional({ values: "falsy" }).trim().isLength({ min: 3, max: 100 }),
  body("description").optional({ values: "null" }).trim().isLength({ max: 1000 }),
  body("quantity").isFloat({ gt: 0, max: 10000 }).toFloat(),
  body("unit").optional().isIn(["kg", "items"]),
  body("containerSize").optional({ values: "null" }).isIn(["small", "medium", "bulk"]),
  body("isCleaned").optional().isBoolean().toBoolean(),
  body("isSorted").optional().isBoolean().toBoolean(),
  body("pathway").optional().isIn(["recycle", "sell", "donate", "reuse"]),
  body("status").optional().isIn(["draft", "active"]),
  body("photos").optional().isArray({ max: 4 }),
  body("photos.*.url").isURL(),
  body("photos.*.label").optional({ values: "null" }).trim().isLength({ max: 30 }),
];

export const requestRules = [
  body("listingIds").isArray({ min: 1, max: 20 }),
  body("listingIds.*").isUUID(),
  body("pickupAddress").trim().isLength({ min: 5, max: 300 }),
  body("pickupLat").optional({ values: "null" }).isFloat({ min: -90, max: 90 }).toFloat(),
  body("pickupLng").optional({ values: "null" }).isFloat({ min: -180, max: 180 }).toFloat(),
  body("pickupDate")
    .isISO8601()
    .custom((v) => String(v).slice(0, 10) >= todayLocal())
    .withMessage("must be today or later"),
  body("timeSlot").isIn(["morning", "afternoon", "evening"]),
  body("dispatchMode").optional().isIn(["smart", "specific"]),
  body("preferredCollectorId").optional({ values: "null" }).isUUID(),
  body("dispatchMode")
    .custom((v, { req }) => v !== "specific" || !!req.body.preferredCollectorId)
    .withMessage("choose a collector"),
  body("notes").optional({ values: "null" }).trim().isLength({ max: 500 }),
];