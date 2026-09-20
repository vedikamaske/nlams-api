import { Request, Response, NextFunction } from "express";
import chalk from "chalk";
import { ZodError } from "zod";
import { AppError } from "../core/errors/appError.js";
import { sendError } from "../core/responses/apiResponse.js";

/**
 * Global Express Error Logger & Handler Middleware.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  const isDev = process.env.NODE_ENV === "development";

  // Chalk-formatted error log output
  console.error(chalk.red.bold("═══════════════════════════════════════"));
  console.error(chalk.red.bold(" ERROR OCCURRED"));
  console.error(chalk.red.bold("═══════════════════════════════════════"));
  console.error(`${chalk.gray("Timestamp:")} ${timestamp}`);
  console.error(`${chalk.gray("Method:   ")} ${req.method}`);
  console.error(`${chalk.gray("URL:      ")} ${req.originalUrl || req.url}`);
  console.error(`${chalk.gray("Error:    ")} ${err.message || String(err)}`);

  if (isDev && err.stack) {
    console.error(`${chalk.gray("Stack:    ")}\n${chalk.dim(err.stack)}`);
  }
  console.error(chalk.red.bold("═══════════════════════════════════════"));

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    sendError(res, "Validation failed", formattedErrors, 400);
    return;
  }

  // Handle Custom Application Errors
  if (err instanceof AppError) {
    sendError(res, err.message, [], err.statusCode);
    return;
  }

  // Handle generic / unexpected 500 errors (never leak stack trace in response)
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  sendError(
    res,
    isDev ? err.message || "Internal server error" : "Internal server error",
    [],
    statusCode
  );
};

/**
 * Handler for 404 Not Found routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Cannot ${req.method} ${req.originalUrl || req.url}`, [], 404);
};
