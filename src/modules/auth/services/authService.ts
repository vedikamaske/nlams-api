import { prisma } from "../../../config/database.js";
import {
  NotFoundError,
  AuthorizationError,
} from "../../../core/errors/appError.js";

export interface UserContextData {
  user: {
    id: string;
    authUserId: string;
    employeeCode: string | null;
    firstName: string;
    middleName: string | null;
    lastName: string;
    displayName: string | null;
    phone: string | null;
    email: string;
    avatarUrl: string | null;
    designation: string | null;
    status: string;
    organizationId: string | null;
    departmentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  organization: {
    id: string;
    name: string;
    code: string;
    organizationType: string;
    description: string | null;
    status: string;
  } | null;
  department: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  } | null;
  roles: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    organizationId?: string | null;
    jurisdictionId?: string | null;
  }>;
  permissions: Array<{
    id: string;
    code: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
  }>;
  jurisdictions: Array<{
    id: string;
    type: string;
    name: string;
    code: string;
    stateCode: string | null;
    districtCode: string | null;
    scopeType?: string;
  }>;
  profiles: Array<{
    profileType: string;
    data: Record<string, unknown>;
  }>;
  dashboards: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    roleId: string | null;
    layoutConfig: unknown;
    widgets: Array<{
      id: string;
      code: string;
      title: string;
      widgetType: string;
      dataSource: string;
      displayOrder: number;
      isVisible: boolean;
      configuration: unknown;
      requiredPermission: string | null;
    }>;
  }>;
}

export class AuthService {
  /**
   * Resolves full application user authorization context from database using auth_user_id.
   * Supabase Auth is responsible for identity. SANKALP backend resolves RBAC, ABAC, and profiles.
   */
  public async resolveApplicationUserContext(
    authUserId: string
  ): Promise<UserContextData> {
    const user = await prisma.user.findUnique({
      where: { authUserId },
      include: {
        organization: true,
        department: true,
        userRoles: {
          where: { status: "ACTIVE" },
          include: {
            role: true,
            jurisdiction: true,
          },
        },
        userScopes: {
          include: {
            jurisdiction: true,
            organization: true,
          },
        },
        piaProfile: true,
        lrbProfile: true,
        laoProfile: true,
        calaProfile: true,
        fieldOfficerProfile: true,
        rrAuthorityProfile: true,
        policyMakerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError(
        "Your account is authenticated, but Sankalp access has not been provisioned."
      );
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new AuthorizationError(
        `Account access is restricted (Status: ${user.status}). Please contact system administrator.`
      );
    }

    // Filter active roles
    const activeUserRoles = user.userRoles.filter(
      (ur) => ur.role && ur.role.status === "ACTIVE"
    );

    if (activeUserRoles.length === 0) {
      throw new AuthorizationError(
        "No active Sankalp role assigned to your profile."
      );
    }

    const roleIds = Array.from(
      new Set(activeUserRoles.map((ur) => ur.roleId))
    );
    const roleCodes = Array.from(
      new Set(activeUserRoles.map((ur) => ur.role.code))
    );

    // Fetch permissions associated with assigned roles
    const rolePermissions = await prisma.rolePermission.findMany({
      where: {
        roleId: { in: roleIds },
        permission: { status: "ACTIVE" },
      },
      include: {
        permission: true,
      },
    });

    const permissionsMap = new Map<string, typeof rolePermissions[0]["permission"]>();
    for (const rp of rolePermissions) {
      if (rp.permission) {
        permissionsMap.set(rp.permission.id, rp.permission);
      }
    }

    // Fetch dashboards for assigned roles
    const dashboardConfigs = await prisma.dashboardConfig.findMany({
      where: {
        role: {
          code: { in: roleCodes },
        },
        status: "ACTIVE",
      },
      include: {
        widgets: {
          where: { isVisible: true },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    // Format roles
    const formattedRoles = activeUserRoles.map((ur) => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
      description: ur.role.description,
      organizationId: ur.organizationId,
      jurisdictionId: ur.jurisdictionId,
    }));

    // Format permissions
    const formattedPermissions = Array.from(permissionsMap.values()).map(
      (p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.description,
      })
    );

    // Format jurisdictions & scopes
    const jurisdictionMap = new Map<string, Record<string, unknown>>();

    for (const ur of activeUserRoles) {
      if (ur.jurisdiction) {
        jurisdictionMap.set(ur.jurisdiction.id, {
          id: ur.jurisdiction.id,
          type: ur.jurisdiction.type,
          name: ur.jurisdiction.name,
          code: ur.jurisdiction.code,
          stateCode: ur.jurisdiction.stateCode,
          districtCode: ur.jurisdiction.districtCode,
          scopeType: "ROLE_JURISDICTION",
        });
      }
    }

    for (const us of user.userScopes) {
      if (us.jurisdiction) {
        jurisdictionMap.set(us.jurisdiction.id, {
          id: us.jurisdiction.id,
          type: us.jurisdiction.type,
          name: us.jurisdiction.name,
          code: us.jurisdiction.code,
          stateCode: us.jurisdiction.stateCode,
          districtCode: us.jurisdiction.districtCode,
          scopeType: us.scopeType,
        });
      }
    }

    const formattedJurisdictions = Array.from(jurisdictionMap.values()) as UserContextData["jurisdictions"];

    // Format profiles
    const profiles: UserContextData["profiles"] = [];
    if (user.piaProfile) {
      profiles.push({ profileType: "PIA", data: user.piaProfile as unknown as Record<string, unknown> });
    }
    if (user.lrbProfile) {
      profiles.push({ profileType: "LRB", data: user.lrbProfile as unknown as Record<string, unknown> });
    }
    if (user.laoProfile) {
      profiles.push({ profileType: "LAO", data: user.laoProfile as unknown as Record<string, unknown> });
    }
    if (user.calaProfile) {
      profiles.push({ profileType: "CALA", data: user.calaProfile as unknown as Record<string, unknown> });
    }
    if (user.fieldOfficerProfile) {
      profiles.push({ profileType: "FIELD_OFFICER", data: user.fieldOfficerProfile as unknown as Record<string, unknown> });
    }
    if (user.rrAuthorityProfile) {
      profiles.push({ profileType: "RR_AUTHORITY", data: user.rrAuthorityProfile as unknown as Record<string, unknown> });
    }
    if (user.policyMakerProfile) {
      profiles.push({ profileType: "POLICY_MAKER", data: user.policyMakerProfile as unknown as Record<string, unknown> });
    }

    // Format dashboards
    const formattedDashboards = dashboardConfigs.map((dc) => ({
      id: dc.id,
      code: dc.code,
      name: dc.name,
      description: dc.description,
      roleId: dc.roleId,
      layoutConfig: dc.layoutConfig,
      widgets: dc.widgets.map((w) => ({
        id: w.id,
        code: w.code,
        title: w.title,
        widgetType: w.widgetType,
        dataSource: w.dataSource,
        displayOrder: w.displayOrder,
        isVisible: w.isVisible,
        configuration: w.configuration,
        requiredPermission: w.requiredPermission,
      })),
    }));

    return {
      user: {
        id: user.id,
        authUserId: user.authUserId,
        employeeCode: user.employeeCode,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        displayName: user.displayName,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
        designation: user.designation,
        status: user.status,
        organizationId: user.organizationId,
        departmentId: user.departmentId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organization: user.organization
        ? {
          id: user.organization.id,
          name: user.organization.name,
          code: user.organization.code,
          organizationType: user.organization.organizationType,
          description: user.organization.description,
          status: user.organization.status,
        }
        : null,
      department: user.department
        ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code,
          description: user.department.description,
        }
        : null,
      roles: formattedRoles,
      permissions: formattedPermissions,
      jurisdictions: formattedJurisdictions,
      profiles,
      dashboards: formattedDashboards,
    };
  }
}

export const authService = new AuthService();
