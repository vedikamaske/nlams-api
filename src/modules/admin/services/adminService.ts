import { PrismaClient } from "@prisma/client";
import { supabaseAdmin } from "../../../config/supabase.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../core/errors/appError.js";

const prisma = new PrismaClient();

export interface CreateUserPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  password: string;
  roleCode: string;
  organizationId?: string;
}

export interface UpdateAccessRequestPayload {
  status: "APPROVED" | "REJECTED";
  reviewComment?: string;
  reviewerUserId: string;
}

export class AdminService {
  /**
   * List all application users with their roles and organization info.
   */
  public async listUsers(page = 1, limit = 10, search?: string, roleCode?: string) {
    const skip = (page - 1) * limit;
    const whereConditions: any[] = [];
    if (search) {
      whereConditions.push({
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { designation: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (roleCode) {
      whereConditions.push({
        userRoles: {
          some: {
            role: { code: roleCode as any },
            status: "ACTIVE",
          },
        },
      });
    }
    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          organization: { select: { id: true, name: true, code: true } },
          userRoles: {
            where: { status: "ACTIVE" },
            include: { role: { select: { id: true, code: true, name: true } } },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        authUserId: u.authUserId,
        firstName: u.firstName,
        middleName: u.middleName,
        lastName: u.lastName,
        displayName: u.displayName,
        email: u.email,
        phone: u.phone,
        designation: u.designation,
        status: u.status,
        organizationId: u.organizationId,
        organization: u.organization,
        roles: u.userRoles.map((ur) => ur.role).filter(Boolean),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get all available roles.
   */
  public async listRoles() {
    return prisma.role.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true, description: true },
    });
  }

  /**
   * Get all organizations for dropdown.
   */
  public async listOrganizations() {
    return prisma.organization.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true, organizationType: true },
    });
  }

  /**
   * Create a new Supabase Auth user + application user profile with role.
   */
  public async createUser(payload: CreateUserPayload) {
    const { firstName, middleName, lastName, email, phone, designation, password, roleCode, organizationId } = payload;

    // 1. Check no existing app user with that email
    const existing = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new ConflictError(`A user with email '${email}' already exists in the application.`);
    }

    // 2. Find the role
    const role = await prisma.role.findFirst({ where: { code: roleCode as any, status: "ACTIVE" } });
    if (!role) {
      throw new NotFoundError(`Role '${roleCode}' not found or is inactive.`);
    }

    // 3. Find organization if provided
    let organization = null;
    if (organizationId) {
      organization = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!organization) throw new NotFoundError(`Organization not found.`);
    }

    // 4. Create user in Supabase Auth using admin client (bypasses email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        firstName,
        middleName: middleName || null,
        lastName,
        designation: designation || null,
        role: roleCode,
      },
    });

    if (authError || !authData.user) {
      throw new ValidationError(
        authError?.message || "Failed to create user in authentication system.",
        [{ field: "email", message: authError?.message || "Auth creation failed" }]
      );
    }

    const authUserId = authData.user.id;

    try {
      // 5. Create application user profile
      const displayName = middleName
        ? `${firstName} ${middleName} ${lastName}`
        : `${firstName} ${lastName}`;

      const newUser = await prisma.user.create({
        data: {
          authUserId,
          firstName,
          middleName: middleName || null,
          lastName,
          displayName,
          email: email.toLowerCase(),
          phone: phone || null,
          designation: designation || null,
          status: "ACTIVE",
          organizationId: organizationId || null,
          userRoles: {
            create: {
              roleId: role.id,
              organizationId: organizationId || null,
              status: "ACTIVE",
            },
          },
        },
        include: {
          organization: true,
          userRoles: { include: { role: true } },
        },
      });

      return {
        id: newUser.id,
        authUserId: newUser.authUserId,
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        displayName: newUser.displayName,
        email: newUser.email,
        phone: newUser.phone,
        designation: newUser.designation,
        status: newUser.status,
        organization: newUser.organization,
        roles: newUser.userRoles.map((ur) => ur.role),
      };
    } catch (dbError) {
      // Rollback: delete Supabase auth user if DB creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      throw dbError;
    }
  }

  /**
   * Update user status (ACTIVE / SUSPENDED / INACTIVE).
   */
  public async updateUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED" | "INACTIVE") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found.");

    return prisma.user.update({
      where: { id: userId },
      data: { status: status as any },
      select: { id: true, firstName: true, lastName: true, email: true, status: true },
    });
  }

  /**
   * Assign an additional role to an existing user.
   */
  public async assignRole(userId: string, roleCode: string, organizationId?: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found.");

    const role = await prisma.role.findFirst({ where: { code: roleCode as any, status: "ACTIVE" } });
    if (!role) throw new NotFoundError(`Role '${roleCode}' not found.`);

    // Check if already assigned
    const existing = await prisma.userRole.findFirst({
      where: { userId, roleId: role.id, status: "ACTIVE" },
    });
    if (existing) throw new ConflictError("Role already assigned to this user.");

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        roleId: role.id,
        organizationId: organizationId || null,
        status: "ACTIVE",
      },
      include: { role: true },
    });

    return { roleId: userRole.roleId, roleCode: userRole.role.code, roleName: userRole.role.name };
  }

  /**
   * List all access requests from /apply-access page.
   */
  public async listAccessRequests(status?: string) {
    const where = status ? { status: status as any } : {};
    return prisma.accessRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        requestedRole: { select: { id: true, code: true, name: true } },
        requestedOrganization: { select: { id: true, name: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Submit a new access request (from /apply-access frontend page).
   */
  public async submitAccessRequest(data: {
    email: string;
    fullName: string;
    phone?: string;
    organizationName?: string;
    reason?: string;
  }) {
    const existing = await prisma.accessRequest.findFirst({
      where: { email: data.email.toLowerCase(), status: "PENDING" },
    });
    if (existing) {
      throw new ConflictError("An access request from this email address is already pending review.");
    }

    return prisma.accessRequest.create({
      data: {
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        phone: data.phone || null,
        organizationName: data.organizationName || null,
        reason: data.reason || null,
        status: "PENDING",
      },
    });
  }

  /**
   * Approve or reject an access request.
   */
  public async reviewAccessRequest(requestId: string, payload: UpdateAccessRequestPayload) {
    const req = await prisma.accessRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new NotFoundError("Access request not found.");
    if (req.status !== "PENDING") throw new ConflictError("This access request has already been reviewed.");

    return prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status: payload.status,
        reviewedBy: payload.reviewerUserId,
        reviewedAt: new Date(),
        reviewComment: payload.reviewComment || null,
      },
      include: {
        requestedRole: true,
        reviewer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }
}

export const adminService = new AdminService();
