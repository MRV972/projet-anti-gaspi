import { Router } from "express";
import {
  completePickupRequest,
  createPickupRequest,
  listPendingPickupRequests,
} from "../controllers/pickupRequestController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, requireRole("hotel"), listPendingPickupRequests);
router.post("/", requireAuth, requireRole("association"), createPickupRequest);
router.patch("/:requestId/complete", requireAuth, requireRole("hotel"), completePickupRequest);

export default router;
