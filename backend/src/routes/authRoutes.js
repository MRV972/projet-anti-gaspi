import { Router } from "express";
import { login, logout, me, register, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();
router.post("/register", register);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
export default router;