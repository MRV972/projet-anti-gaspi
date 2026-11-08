import { Router } from "express";
import {
  createEntity, createInvitation, createPasswordResetKey, deleteAccount,
  listAccounts, listEntities,
} from "../controllers/adminController.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);
router.get("/entities", listEntities);
router.post("/entities", createEntity);
router.get("/accounts", listAccounts);
router.delete("/accounts/:accountId", deleteAccount);
router.post("/accounts/:accountId/reset-key", createPasswordResetKey);
router.post("/invitations", createInvitation);
export default router;
