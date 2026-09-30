import { Router } from "express";
import { listCategories } from "../controllers/waste.controller";

const router = Router();

router.get("/categories", listCategories);

export default router;