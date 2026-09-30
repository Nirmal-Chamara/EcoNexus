import { Router } from "express";
import wasteRoutes from "./waste.routes";

const router = Router();

router.use("/waste", wasteRoutes);

export default router;