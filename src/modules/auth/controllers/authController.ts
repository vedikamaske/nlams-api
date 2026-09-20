import { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService.js";
import { AuthenticationError } from "../../../core/errors/appError.js";

export class AuthController {
  /**
   * GET /api/v1/me
   * Resolves authenticated user's application profile, roles, permissions, scopes, and dashboards.
   */
  public getCurrentUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.supabaseUser || !req.supabaseUser.id) {
        throw new AuthenticationError("User is not authenticated");
      }

      const context = await authService.resolveApplicationUserContext(
        req.supabaseUser.id
      );

      res.status(200).json({
        success: true,
        message: "Authenticated application context resolved successfully",
        data: context,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
