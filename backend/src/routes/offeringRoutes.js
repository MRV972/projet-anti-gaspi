import { Router } from "express";
import { createOffering, listAvailableOfferings } from "../controllers/offeringController.js";

const router = Router();

router.get("/", listAvailableOfferings);
router.post("/", createOffering);

export default router;
