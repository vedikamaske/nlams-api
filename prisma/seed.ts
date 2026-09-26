import { PrismaClient, RoleCode, DashboardCode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting SANKALP First-Phase Database Seeding (Fast Batch)...");

  // 1. STAKEHOLDER ROLES
  const roleDefinitions: Array<{
    code: RoleCode;
    name: string;
    description: string;
  }> = [
      { code: RoleCode.SYSTEM_ADMIN, name: "System Administrator", description: "Full platform administration, access request review, and security governance." },
      { code: RoleCode.CENTRAL_MINISTRY, name: "Central Ministry", description: "National level oversight, inter-state project monitoring, and policy compliance." },
      { code: RoleCode.STATE_GOVERNMENT, name: "State Government", description: "State level acquisition monitoring, department coordination, and budget oversight." },
      { code: RoleCode.DISTRICT_COLLECTOR, name: "District Collector", description: "District level land administration, statutory notifications, and statutory approvals." },
      { code: RoleCode.LAO, name: "Land Acquisition Officer", description: "Statutory land acquisition proceedings, inquiry, hearing, and award determination." },
      { code: RoleCode.CALA, name: "Competent Authority for Land Acquisition", description: "Sector-specific statutory acquisition authority under specialized Acts (e.g. NH Act, Railways Act)." },
      { code: RoleCode.PIA, name: "Project Implementing Agency", description: "Infrastructure agency submitting acquisition proposals, alignment plans, and funding details." },
      { code: RoleCode.LRB, name: "Land Requisitioning Body", description: "Requisitioning department or public sector enterprise requesting land acquisition." },
      { code: RoleCode.FIELD_OFFICER, name: "Field Officer", description: "On-ground survey, physical verification, boundary measurement, and evidence capture." },
      { code: RoleCode.RR_AUTHORITY, name: "Rehabilitation & Resettlement Authority", description: "R&R scheme formulation, family identification, entitlement verification, and grievance redressal." },
      { code: RoleCode.POLICY_MAKER, name: "Policy Maker", description: "Policy registry management, statutory rule formulation, SLA versioning, and impact analysis." },
    ];

  console.log("📌 Upserting Roles...");
  const rolePromises = roleDefinitions.map((roleDef) =>
    prisma.role.upsert({
      where: { code: roleDef.code },
      update: { name: roleDef.name, description: roleDef.description },
      create: roleDef,
    })
  );
  const roles = await Promise.all(rolePromises);
  const seededRoles: Record<string, string> = {};
  roles.forEach((r) => {
    seededRoles[r.code] = r.id;
  });
  console.log(`✅ ${roles.length} Roles ready.`);

  // 2. PERMISSIONS
  const permissionDefinitions = [
    { code: "system.manage", name: "Manage System Settings", resource: "system", action: "manage", description: "Full system administration" },
    { code: "user.read", name: "Read Users", resource: "user", action: "read", description: "View user directory and profiles" },
    { code: "user.manage", name: "Manage Users", resource: "user", action: "manage", description: "Create, update, and manage user status" },
    { code: "access_request.review", name: "Review Access Requests", resource: "access_request", action: "review", description: "Review and approve/reject portal access requests" },
    { code: "organization.read", name: "Read Organizations", resource: "organization", action: "read", description: "View organizational hierarchy" },
    { code: "organization.manage", name: "Manage Organizations", resource: "organization", action: "manage", description: "Create and update organizations" },
    { code: "policy.read", name: "Read Policy Registry", resource: "policy", action: "read", description: "View active and historical policy rules" },
    { code: "policy.manage", name: "Manage Policy Registry", resource: "policy", action: "manage", description: "Draft, version, approve, and publish policy rules" },
    { code: "routing.manage", name: "Manage Routing Engine", resource: "routing", action: "manage", description: "Configure routing rules and statutory authority mappings" },
    { code: "project.read", name: "Read Projects", resource: "project", action: "read", description: "View acquisition projects" },
    { code: "project.create", name: "Propose Project", resource: "project", action: "create", description: "Submit new land acquisition proposals" },
    { code: "project.approve", name: "Approve Project", resource: "project", action: "approve", description: "Approve acquisition proposals and notifications" },
    { code: "parcel.read", name: "Read Land Parcels", resource: "parcel", action: "read", description: "View parcel records, land records, and GIS mapping" },
    { code: "parcel.verify", name: "Verify Parcels", resource: "parcel", action: "verify", description: "Perform on-ground survey and field verification" },
    { code: "workflow.read", name: "Read Workflows", resource: "workflow", action: "read", description: "View acquisition workflow status" },
    { code: "task.read", name: "Read Tasks", resource: "task", action: "read", description: "View assigned workflow tasks" },
    { code: "task.execute", name: "Execute Task", resource: "task", action: "execute", description: "Complete, approve, or reject assigned tasks" },
    { code: "compensation.read", name: "Read Compensation Awards", resource: "compensation", action: "read", description: "View compensation estimates and awards" },
    { code: "compensation.approve", name: "Approve Compensation", resource: "compensation", action: "approve", description: "Approve statutory compensation awards and disbursements" },
    { code: "rr.read", name: "Read R&R Schemes", resource: "rr", action: "read", description: "View Rehabilitation & Resettlement schemes" },
    { code: "rr.approve", name: "Approve R&R Schemes", resource: "rr", action: "approve", description: "Approve R&R entitlements and rehabilitation awards" },
    { code: "possession.read", name: "Read Possession Records", resource: "possession", action: "read", description: "View possession status and transfer evidence" },
    { code: "audit.read", name: "Read Audit Logs", resource: "audit", action: "read", description: "View system audit trails and decision provenance" },
    { code: "dashboard.read", name: "Access Dashboards", resource: "dashboard", action: "read", description: "Access role-specific monitoring dashboards" },
  ];

  console.log("📌 Upserting Permissions...");
  const permPromises = permissionDefinitions.map((permDef) =>
    prisma.permission.upsert({
      where: { code: permDef.code },
      update: { name: permDef.name, resource: permDef.resource, action: permDef.action, description: permDef.description },
      create: permDef,
    })
  );
  const permissions = await Promise.all(permPromises);
  const seededPermissions: Record<string, string> = {};
  permissions.forEach((p) => {
    seededPermissions[p.code] = p.id;
  });
  console.log(`✅ ${permissions.length} Permissions ready.`);

  // 3. ROLE-PERMISSION MAPPINGS
  console.log("📌 Mapping Permissions to Roles...");
  const rolePermissionAssignments: Record<RoleCode, string[]> = {
    [RoleCode.SYSTEM_ADMIN]: Object.keys(seededPermissions),
    [RoleCode.CENTRAL_MINISTRY]: ["project.read", "parcel.read", "workflow.read", "compensation.read", "rr.read", "possession.read", "audit.read", "dashboard.read"],
    [RoleCode.STATE_GOVERNMENT]: ["project.read", "parcel.read", "workflow.read", "compensation.read", "rr.read", "possession.read", "audit.read", "dashboard.read"],
    [RoleCode.DISTRICT_COLLECTOR]: ["project.read", "project.approve", "parcel.read", "workflow.read", "task.read", "task.execute", "compensation.read", "compensation.approve", "rr.read", "rr.approve", "possession.read", "audit.read", "dashboard.read"],
    [RoleCode.LAO]: ["project.read", "parcel.read", "parcel.verify", "workflow.read", "task.read", "task.execute", "compensation.read", "compensation.approve", "rr.read", "possession.read", "audit.read", "dashboard.read"],
    [RoleCode.CALA]: ["project.read", "parcel.read", "parcel.verify", "workflow.read", "task.read", "task.execute", "compensation.read", "compensation.approve", "possession.read", "audit.read", "dashboard.read"],
    [RoleCode.PIA]: ["project.read", "project.create", "parcel.read", "workflow.read", "task.read", "compensation.read", "possession.read", "dashboard.read"],
    [RoleCode.LRB]: ["project.read", "project.create", "parcel.read", "workflow.read", "task.read", "possession.read", "dashboard.read"],
    [RoleCode.FIELD_OFFICER]: ["project.read", "parcel.read", "parcel.verify", "task.read", "task.execute", "dashboard.read"],
    [RoleCode.RR_AUTHORITY]: ["project.read", "parcel.read", "rr.read", "rr.approve", "task.read", "task.execute", "dashboard.read"],
    [RoleCode.POLICY_MAKER]: ["policy.read", "policy.manage", "routing.manage", "project.read", "audit.read", "dashboard.read"],
  };

  const rpUpserts: Array<Promise<unknown>> = [];
  for (const [roleCode, permCodes] of Object.entries(rolePermissionAssignments)) {
    const roleId = seededRoles[roleCode];
    if (!roleId) continue;
    for (const permCode of permCodes) {
      const permId = seededPermissions[permCode];
      if (!permId) continue;
      rpUpserts.push(
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId, permissionId: permId } },
          update: {},
          create: { roleId, permissionId: permId },
        })
      );
    }
  }
  await Promise.all(rpUpserts);
  console.log(`✅ ${rpUpserts.length} Role-Permission assignments ready.`);

  // 4. DASHBOARD CONFIGURATIONS & WIDGETS
  console.log("📌 Upserting Dashboards & Widgets...");
  const dashboardDefinitions: Array<{
    code: DashboardCode;
    roleCode: RoleCode;
    name: string;
    description: string;
    widgets: Array<{ code: string; title: string; widgetType: string; dataSource: string; requiredPermission: string }>;
  }> = [
      {
        code: DashboardCode.SYSTEM_ADMIN_DASHBOARD,
        roleCode: RoleCode.SYSTEM_ADMIN,
        name: "System Administrator Dashboard",
        description: "System health, user access requests, security audit trails, and platform telemetry.",
        widgets: [
          { code: "WIDGET_SYS_HEALTH", title: "System Health & Uptime", widgetType: "METRIC_CARD", dataSource: "system.health", requiredPermission: "system.manage" },
          { code: "WIDGET_PENDING_ACCESS", title: "Pending Access Requests", widgetType: "TABLE_SUMMARY", dataSource: "access_requests.pending", requiredPermission: "access_request.review" },
          { code: "WIDGET_AUDIT_STREAM", title: "Recent Audit Events", widgetType: "STATUS_FEED", dataSource: "audit_logs.recent", requiredPermission: "audit.read" },
        ],
      },
      {
        code: DashboardCode.CENTRAL_MINISTRY_DASHBOARD,
        roleCode: RoleCode.CENTRAL_MINISTRY,
        name: "Central Ministry Executive Dashboard",
        description: "Pan-India land acquisition progress, inter-state infrastructure corridors, and budget utilization.",
        widgets: [
          { code: "WIDGET_NATIONAL_PROGRESS", title: "National Acquisition Overview", widgetType: "METRIC_CARD", dataSource: "analytics.national_progress", requiredPermission: "project.read" },
          { code: "WIDGET_STATE_HEATMAP", title: "State-wise Project Heatmap", widgetType: "MAP_PREVIEW", dataSource: "gis.state_heatmap", requiredPermission: "project.read" },
          { code: "WIDGET_COMPENSATION_TOTAL", title: "National Compensation Disbursement", widgetType: "CHART_BAR", dataSource: "compensation.national_sum", requiredPermission: "compensation.read" },
        ],
      },
      {
        code: DashboardCode.STATE_GOVERNMENT_DASHBOARD,
        roleCode: RoleCode.STATE_GOVERNMENT,
        name: "State Government Oversight Dashboard",
        description: "State project monitoring, district SLA compliance, and land availability tracker.",
        widgets: [
          { code: "WIDGET_STATE_PROJECTS", title: "Active State Projects", widgetType: "METRIC_CARD", dataSource: "projects.state_active", requiredPermission: "project.read" },
          { code: "WIDGET_DISTRICT_PERF", title: "District Acquisition Timelines", widgetType: "CHART_BAR", dataSource: "monitoring.district_performance", requiredPermission: "project.read" },
          { code: "WIDGET_RR_SUMMARY", title: "State R&R Progress", widgetType: "CHART_LINE", dataSource: "rr.state_summary", requiredPermission: "rr.read" },
        ],
      },
      {
        code: DashboardCode.DISTRICT_COLLECTOR_DASHBOARD,
        roleCode: RoleCode.DISTRICT_COLLECTOR,
        name: "District Collector Executive Dashboard",
        description: "District acquisition proposals, statutory notification approvals, award sanctions, and court stay monitoring.",
        widgets: [
          { code: "WIDGET_PENDING_APPROVALS", title: "Pending Collector Approvals", widgetType: "METRIC_CARD", dataSource: "tasks.collector_approvals", requiredPermission: "project.approve" },
          { code: "WIDGET_DISTRICT_MAP", title: "District Acquisition Boundaries", widgetType: "MAP_PREVIEW", dataSource: "gis.district_parcels", requiredPermission: "parcel.read" },
          { code: "WIDGET_AWARD_SANCTIONS", title: "Pending Compensation Awards", widgetType: "TABLE_SUMMARY", dataSource: "compensation.pending_awards", requiredPermission: "compensation.approve" },
        ],
      },
      {
        code: DashboardCode.LAO_DASHBOARD,
        roleCode: RoleCode.LAO,
        name: "Land Acquisition Officer (LAO) Dashboard",
        description: "Inquiry hearings, land record verification, 11(1) & 19(1) notifications, and award preparation.",
        widgets: [
          { code: "WIDGET_LAO_TASKS", title: "Active Proceedings & Hearings", widgetType: "TABLE_SUMMARY", dataSource: "tasks.lao_proceedings", requiredPermission: "task.execute" },
          { code: "WIDGET_PARCEL_COUNT", title: "Parcels Under Inquiry", widgetType: "METRIC_CARD", dataSource: "parcels.lao_inquiry", requiredPermission: "parcel.read" },
          { code: "WIDGET_AWARD_DRAFTS", title: "Draft Section 23 Awards", widgetType: "TABLE_SUMMARY", dataSource: "compensation.draft_awards", requiredPermission: "compensation.approve" },
        ],
      },
      {
        code: DashboardCode.CALA_DASHBOARD,
        roleCode: RoleCode.CALA,
        name: "Competent Authority (CALA) Dashboard",
        description: "Sector-specific statutory acquisition (NH Act / Railways Act), 3A/3D/3G notifications, and award determinations.",
        widgets: [
          { code: "WIDGET_CALA_NOTIFICATIONS", title: "Statutory 3A/3D/3G Gazettes", widgetType: "TABLE_SUMMARY", dataSource: "notifications.cala_gazette", requiredPermission: "task.execute" },
          { code: "WIDGET_CALA_PARCELS", title: "Right-of-Way Parcel Progress", widgetType: "METRIC_CARD", dataSource: "parcels.cala_row", requiredPermission: "parcel.read" },
          { code: "WIDGET_3G_AWARDS", title: "Section 3G Awards Determined", widgetType: "CHART_BAR", dataSource: "compensation.section_3g", requiredPermission: "compensation.approve" },
        ],
      },
      {
        code: DashboardCode.PIA_DASHBOARD,
        roleCode: RoleCode.PIA,
        name: "Project Implementing Agency (PIA) Dashboard",
        description: "Project proposal tracking, alignment submission, fund deposit monitoring, and land possession handovers.",
        widgets: [
          { code: "WIDGET_PIA_PROPOSALS", title: "Submitted Proposals Status", widgetType: "METRIC_CARD", dataSource: "projects.pia_submitted", requiredPermission: "project.create" },
          { code: "WIDGET_FUND_DEPOSITS", title: "Escrow & Award Fund Deposits", widgetType: "TABLE_SUMMARY", dataSource: "compensation.escrow_deposits", requiredPermission: "compensation.read" },
          { code: "WIDGET_POSSESSION_HANDOVER", title: "Land Possession Certificates", widgetType: "TABLE_SUMMARY", dataSource: "possession.handovers", requiredPermission: "possession.read" },
        ],
      },
      {
        code: DashboardCode.LRB_DASHBOARD,
        roleCode: RoleCode.LRB,
        name: "Land Requisitioning Body (LRB) Dashboard",
        description: "Requisition tracker, project justification, site suitability reports, and department clearances.",
        widgets: [
          { code: "WIDGET_REQUISITION_STATUS", title: "Requisitions in Pipeline", widgetType: "METRIC_CARD", dataSource: "projects.lrb_pipeline", requiredPermission: "project.create" },
          { code: "WIDGET_CLEARANCE_CHECKLIST", title: "Departmental Clearances", widgetType: "TABLE_SUMMARY", dataSource: "tasks.lrb_clearances", requiredPermission: "task.read" },
        ],
      },
      {
        code: DashboardCode.FIELD_OFFICER_DASHBOARD,
        roleCode: RoleCode.FIELD_OFFICER,
        name: "Field Officer Task & Survey Dashboard",
        description: "On-ground survey assignments, geo-tagged photo evidence, Khasra measurement, and tree/crop valuation.",
        widgets: [
          { code: "WIDGET_ASSIGNED_SURVEYS", title: "Pending Field Surveys", widgetType: "TABLE_SUMMARY", dataSource: "tasks.field_surveys", requiredPermission: "task.execute" },
          { code: "WIDGET_VERIFIED_PARCELS", title: "Parcels Verified Today", widgetType: "METRIC_CARD", dataSource: "parcels.field_verified", requiredPermission: "parcel.verify" },
        ],
      },
      {
        code: DashboardCode.RR_AUTHORITY_DASHBOARD,
        roleCode: RoleCode.RR_AUTHORITY,
        name: "Rehabilitation & Resettlement (R&R) Dashboard",
        description: "Affected family census, R&R scheme formulation, infrastructure site allotments, and grievance redressal.",
        widgets: [
          { code: "WIDGET_AFFECTED_FAMILIES", title: "Affected Families Identified", widgetType: "METRIC_CARD", dataSource: "rr.affected_families", requiredPermission: "rr.read" },
          { code: "WIDGET_RR_ENTITLEMENTS", title: "Entitlement Grants Disbursed", widgetType: "CHART_BAR", dataSource: "rr.disbursements", requiredPermission: "rr.approve" },
          { code: "WIDGET_GRIEVANCE_LIST", title: "Open R&R Grievances", widgetType: "TABLE_SUMMARY", dataSource: "rr.grievances", requiredPermission: "rr.read" },
        ],
      },
      {
        code: DashboardCode.POLICY_MAKER_DASHBOARD,
        roleCode: RoleCode.POLICY_MAKER,
        name: "Policy Maker Intelligence & Analytics Dashboard",
        description: "Policy rule engine impact analysis, SLA bottleneck detection, statutory legal amendment testing, and AI recommendations.",
        widgets: [
          { code: "WIDGET_POLICY_VERSIONS", title: "Active Policy Rule Versions", widgetType: "METRIC_CARD", dataSource: "policy.active_versions", requiredPermission: "policy.read" },
          { code: "WIDGET_SLA_BOTTLENECKS", title: "Stage-wise SLA Delays", widgetType: "CHART_BAR", dataSource: "monitoring.sla_bottlenecks", requiredPermission: "policy.manage" },
          { code: "WIDGET_AI_RISK_FACTORS", title: "AI Acquisition Delay Predictions", widgetType: "TABLE_SUMMARY", dataSource: "ai.delay_predictions", requiredPermission: "policy.manage" },
        ],
      },
    ];

  for (const dashDef of dashboardDefinitions) {
    const roleId = seededRoles[dashDef.roleCode];
    const dashboard = await prisma.dashboardConfig.upsert({
      where: { code: dashDef.code },
      update: { name: dashDef.name, description: dashDef.description, roleId },
      create: { code: dashDef.code, name: dashDef.name, description: dashDef.description, roleId },
    });

    const widgetPromises = dashDef.widgets.map((widgetDef, index) =>
      prisma.dashboardWidget.upsert({
        where: { dashboardId_code: { dashboardId: dashboard.id, code: widgetDef.code } },
        update: { title: widgetDef.title, widgetType: widgetDef.widgetType, dataSource: widgetDef.dataSource, requiredPermission: widgetDef.requiredPermission, displayOrder: index + 1 },
        create: { dashboardId: dashboard.id, code: widgetDef.code, title: widgetDef.title, widgetType: widgetDef.widgetType, dataSource: widgetDef.dataSource, requiredPermission: widgetDef.requiredPermission, displayOrder: index + 1 },
      })
    );
    await Promise.all(widgetPromises);
  }

  console.log("✅ 11 Dashboards & Widgets seeded successfully.");
  console.log("🎉 SANKALP First-Phase Database Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
