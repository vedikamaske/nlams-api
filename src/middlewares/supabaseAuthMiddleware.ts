import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase.js";
import { AuthenticationError } from "../core/errors/appError.js";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  aud?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      supabaseUser?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware to verify Supabase Auth Access Tokens (Bearer Token).
 * Responsible ONLY for identity verification, NOT application authorization.
 */
export const supabaseAuthMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new AuthenticationError("Bearer token is empty");
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthenticationError("Invalid or expired Supabase authentication token");
    }

    req.supabaseUser = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};
