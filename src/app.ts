import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { requestLogger } from "./middlewares/logger.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import healthRouter from "./routes/health.js";
import apiRouter from "./routes/index.js";

const app: Express = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Compatible with Next.js frontend during dev
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration supporting single or comma-separated origins
const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS policy restriction for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom Chalk HTTP Request/Response Logger
app.use(requestLogger);

// Health Endpoint
app.use("/", healthRouter);
app.use("/api", healthRouter);

// API v1 Routes (Exposes /api/v1/me, /api/v1/auth/me, /api/v1/health)
app.use("/api/v1", apiRouter);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
