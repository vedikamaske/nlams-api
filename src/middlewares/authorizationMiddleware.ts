import { Request, Response, NextFunction } from "express";
import { AuthorizationError } from "../core/errors/appError.js";

export interface NlamsUserContext {
  id: string;
  authUserId: string;
  role: string;
  organizationId?: string;
  state?: string;
  district?: string;
}

declare global {
  namespace Express {
    interface Request {
      nlamsUser?: NlamsUserContext;
    }
  }
}

/**
 * Middleware placeholder for NLAMS Application Authorization (RBAC / ABAC).
 * Evaluates role, organization, and jurisdiction against mandatory permissions.
 */
export const requirePermissions = (requiredPermissions: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.supabaseUser) {
        throw new AuthorizationError("Authentication required before authorization check");
      }

      // Placeholder: Resolve actual NLAMS profile & roles from database based on req.supabaseUser.id
      // (The role passed in frontend login forms is NEVER trusted as authorization truth)

      if (requiredPermissions.length === 0) {
        return next();
      }

      // Authorization evaluation stub
      next();
    } catch (error) {
      next(error);
    }
  };
};
