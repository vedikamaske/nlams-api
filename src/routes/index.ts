import { Router } from "express";
import healthRouter from "./health.js";
import authRoutes from "../modules/auth/routes/authRoutes.js";

const router = Router();

// Foundation Health Endpoint
router.use("/", healthRouter);

// Auth & Me Routes
router.use("/auth", authRoutes);
router.use("/", authRoutes); // Exposes GET /api/v1/me directly

export default router;
