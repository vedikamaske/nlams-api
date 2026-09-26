import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { adminService } from "../services/adminService.js";
import { ValidationError } from "../../../core/errors/appError.js";

const prisma = new PrismaClient();

export class AdminController {

  /** GET /api/v1/admin/users */
  public listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string | undefined;
      const role = req.query.role as string | undefined;
      const result = await adminService.listUsers(page, limit, search, role);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  /** GET /api/v1/admin/roles */
  public listRoles = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roles = await adminService.listRoles();
      res.status(200).json({ success: true, data: roles });
    } catch (err) { next(err); }
  };

  /** GET /api/v1/admin/organizations */
  public listOrganizations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgs = await adminService.listOrganizations();
      res.status(200).json({ success: true, data: orgs });
    } catch (err) { next(err); }
  };

  /** POST /api/v1/admin/users */
  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { firstName, middleName, lastName, email, phone, designation, password, roleCode, organizationId } = req.body as Record<string, string>;
      if (!firstName || !lastName || !email || !password || !roleCode) {
        const errors: Array<{ field: string; message: string }> = [];
        if (!firstName) errors.push({ field: "firstName", message: "First name is required" });
        if (!lastName) errors.push({ field: "lastName", message: "Last name is required" });
        if (!email) errors.push({ field: "email", message: "Email is required" });
        if (!password) errors.push({ field: "password", message: "Password is required" });
        if (!roleCode) errors.push({ field: "roleCode", message: "Role is required" });
        throw new ValidationError("Missing required fields", errors);
      }
      const user = await adminService.createUser({ firstName, middleName, lastName, email, phone, designation, password, roleCode, organizationId });
      res.status(201).json({ success: true, message: "User account created successfully.", data: user });
    } catch (err) { next(err); }
  };

  /** PATCH /api/v1/admin/users/:userId/status */
  public updateUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { status } = req.body as { status: string };
      if (!["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
        throw new ValidationError("Invalid status value.");
      }
      const updated = await adminService.updateUserStatus(userId, status as "ACTIVE" | "SUSPENDED" | "INACTIVE");
      res.status(200).json({ success: true, message: "User status updated.", data: updated });
    } catch (err) { next(err); }
  };

  /** POST /api/v1/admin/users/:userId/roles */
  public assignRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const { roleCode, organizationId } = req.body as { roleCode: string; organizationId?: string };
      if (!roleCode) throw new ValidationError("roleCode is required.");
      const result = await adminService.assignRole(userId, roleCode, organizationId);
      res.status(200).json({ success: true, message: "Role assigned successfully.", data: result });
    } catch (err) { next(err); }
  };

  /** GET /api/v1/admin/access-requests */
  public listAccessRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const requests = await adminService.listAccessRequests(status);
      res.status(200).json({ success: true, data: requests });
    } catch (err) { next(err); }
  };

  /** POST /api/v1/admin/access-requests */
  public submitAccessRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, fullName, phone, organizationName, reason } = req.body as Record<string, string>;
      if (!email || !fullName) {
        throw new ValidationError("Email and full name are required.");
      }
      const request = await adminService.submitAccessRequest({ email, fullName, phone, organizationName, reason });
      res.status(201).json({ success: true, message: "Access request submitted successfully.", data: request });
    } catch (err) { next(err); }
  };

  /** PATCH /api/v1/admin/access-requests/:requestId/review */
  public reviewAccessRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { status, reviewComment } = req.body as { status: string; reviewComment?: string };
      if (!["APPROVED", "REJECTED"].includes(status)) {
        throw new ValidationError("Status must be APPROVED or REJECTED.");
      }
      const reviewerAuthId = req.supabaseUser?.id;
      let reviewerUserId = "system";
      if (reviewerAuthId) {
        const reviewer = await prisma.user.findFirst({ where: { authUserId: reviewerAuthId } });
        if (reviewer) reviewerUserId = reviewer.id;
      }
      const updated = await adminService.reviewAccessRequest(requestId, {
        status: status as "APPROVED" | "REJECTED",
        reviewComment,
        reviewerUserId,
      });
      res.status(200).json({ success: true, message: `Access request ${status.toLowerCase()}.`, data: updated });
    } catch (err) { next(err); }
  };
}

export const adminController = new AdminController();
