import { Router } from "express";
import {
  createDistributionRequest,
  completeDistributionRequest,
  listAssociationStock,
  listPendingDistributionRequests,
  listDistributableOfferings,
} from "../controllers/distributionController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/offerings", requireAuth, requireRole("individual"), listDistributableOfferings);
router.get("/stock", requireAuth, requireRole("association"), listAssociationStock);
router.get("/requests", requireAuth, requireRole("association"), listPendingDistributionRequests);
router.post("/requests", requireAuth, requireRole("individual"), createDistributionRequest);
router.patch("/requests/:requestId/complete", requireAuth, requireRole("association"), completeDistributionRequest);

export default router;
