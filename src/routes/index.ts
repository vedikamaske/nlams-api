import { Router } from "express";
import healthRouter from "./health.js";
import authRoutes from "../modules/auth/routes/authRoutes.js";
import adminRoutes from "../modules/admin/routes/adminRoutes.js";

const router = Router();

// Foundation Health Endpoint
router.use("/", healthRouter);

// Auth & Me Routes
router.use("/auth", authRoutes);
router.use("/", authRoutes); // Exposes GET /api/v1/me directly

// Admin Routes (/api/v1/admin/...)
router.use("/admin", adminRoutes);

export default router;
