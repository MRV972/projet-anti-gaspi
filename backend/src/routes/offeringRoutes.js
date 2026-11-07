import { Router } from "express";
import { createOffering, listAvailableOfferings } from "../controllers/offeringController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("association"), listAvailableOfferings);
router.post("/", requireAuth, requireRole("hotel"), createOffering);

export default router;
