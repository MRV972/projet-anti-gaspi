import { Router } from "express";
import {
  createDistributionRequest,
  completeDistributionRequest,
  listPendingDistributionRequests,
  listDistributableOfferings,
} from "../controllers/distributionController.js";

const router = Router();

router.get("/offerings", listDistributableOfferings);
router.get("/requests", listPendingDistributionRequests);
router.post("/requests", createDistributionRequest);
router.patch("/requests/:requestId/complete", completeDistributionRequest);

export default router;
