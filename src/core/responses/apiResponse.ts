import { Response } from "express";

export interface ApiResponsePayload<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  timestamp?: string;
}

/**
 * Standard API Success Response Helper.
 */
export const sendSuccess = <T>(
  res: Response,
  message = "Operation successful",
  data?: T,
  statusCode = 200
): Response => {
  const payload: ApiResponsePayload<T> = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
};

/**
 * Standard API Error Response Helper.
 */
export const sendError = (
  res: Response,
  message = "Something went wrong",
  errors: Array<{ field?: string; message: string }> = [],
  statusCode = 500
): Response => {
  const payload: ApiResponsePayload = {
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(payload);
};
