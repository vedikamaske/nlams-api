import { Router } from "express";
import { authController } from "../controllers/authController.js";
import { supabaseAuthMiddleware } from "../../../middlewares/supabaseAuthMiddleware.js";

const router = Router();

/**
 * GET /api/v1/me
 * GET /api/v1/auth/me
 * Protected endpoint returning authorized Sankalp application context.
 */
router.get("/me", supabaseAuthMiddleware, authController.getCurrentUser);

export default router;
