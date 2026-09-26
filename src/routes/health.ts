import { Router, Request, Response } from "express";

const router = Router();

/**
 * GET /health
 * Basic system health status endpoint.
 */
router.get("/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "SANKALP API is running",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /health
 * Echo health endpoint for testing POST request handling.
 */
router.post("/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: "SANKALP API is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
