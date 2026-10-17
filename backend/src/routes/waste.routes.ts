import { Router } from "express";
import * as c from "../controllers/waste.controller";
import { authenticateToken, authorize, requireActive } from "../middleware/auth.middleware";
import { idRule, listingRules } from "../validators/waste.validator";
import { uploadImage } from "../middleware/upload.middleware";

const router = Router();
const userOnly = [authenticateToken, requireActive, authorize("USER")];

router.get("/categories", c.listCategories);

router.post("/listings", userOnly, listingRules, c.createListing);
router.get("/listings/mine", userOnly, c.myListings); // keep above /listings/:id
router.get("/listings/:id", userOnly, idRule, c.getListing);
router.put("/listings/:id", userOnly, idRule, listingRules, c.updateListing);
router.delete("/listings/:id", userOnly, idRule, c.removeListing);
router.post("/uploads", userOnly, uploadImage, c.uploadWasteImage);

export default router;