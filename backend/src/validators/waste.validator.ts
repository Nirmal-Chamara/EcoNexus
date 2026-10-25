import { body, param } from "express-validator";

export const idRule = [param("id").isUUID()];

export const listingRules = [
  body("categoryId").isInt({ min: 1 }),
  body("title").trim().isLength({ min: 3, max: 100 }),
  body("description").optional().trim().isLength({ max: 1000 }),
  body("quantity").isFloat({ gt: 0 }),
  body("unit").isIn(["kg", "items"]),
  body("condition").isIn(["clean", "dirty", "damaged", "reusable"]),
  body("imageUrls").optional().isArray({ max: 5 }),
  body("imageUrls.*").isURL(),
];