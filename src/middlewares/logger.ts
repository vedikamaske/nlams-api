import { Request, Response, NextFunction } from "express";
import chalk from "chalk";
import { sanitizeBody } from "../utils/sanitize.js";

/**
 * Custom Chalk HTTP Request & Response Logger Middleware.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  const originalEnd = res.end;

  // Override res.end safely to log upon response completion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = function (chunk?: any, encoding?: any, cb?: () => void): Response {
    // Restore and call original res.end first
    res.end = originalEnd;
    const result = originalEnd.call(this, chunk, encoding, cb);

    const responseTime = Date.now() - startTime;
    const status = res.statusCode;

    // Colorize status code based on HTTP status range
    let statusColor: (text: string | number) => string;
    if (status >= 500) {
      statusColor = chalk.red.bold;
    } else if (status >= 400) {
      statusColor = chalk.yellow.bold;
    } else if (status >= 300) {
      statusColor = chalk.cyan.bold;
    } else if (status >= 200) {
      statusColor = chalk.green.bold;
    } else {
      statusColor = chalk.white;
    }

    // Colorize HTTP method
    let methodColor: (text: string) => string;
    switch (req.method) {
      case "GET":
        methodColor = chalk.blue;
        break;
      case "POST":
        methodColor = chalk.green;
        break;
      case "PUT":
      case "PATCH":
        methodColor = chalk.yellow;
        break;
      case "DELETE":
        methodColor = chalk.red;
        break;
      default:
        methodColor = chalk.white;
    }

    // Colorize response duration based on performance thresholds
    let timeColor: (text: string) => string;
    if (responseTime < 100) {
      timeColor = chalk.green;
    } else if (responseTime < 500) {
      timeColor = chalk.yellow;
    } else {
      timeColor = chalk.red;
    }

    const logMessage = [
      chalk.gray(timestamp),
      chalk.bold(methodColor(req.method.padEnd(7))),
      chalk.white(req.originalUrl || req.url),
      chalk.gray("→"),
      statusColor(status),
      timeColor(`(${responseTime}ms)`),
    ].join(" ");

    console.log(logMessage);

    // Development request body logging (with sensitive fields redacted)
    if (
      process.env.NODE_ENV === "development" &&
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      req.body
    ) {
      const sanitizedBody = sanitizeBody(req.body);
      if (Object.keys(sanitizedBody).length > 0) {
        console.log(chalk.gray("  Body:"), JSON.stringify(sanitizedBody));
      }
    }

    return result;
  };

  next();
};
