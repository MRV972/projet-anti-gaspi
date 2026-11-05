import { Router } from "express";
import {
  completePickupRequest,
  createPickupRequest,
  listPendingPickupRequests,
} from "../controllers/pickupRequestController.js";

const router = Router();

router.get("/", listPendingPickupRequests);
router.post("/", createPickupRequest);
router.patch("/:requestId/complete", completePickupRequest);

export default router;
