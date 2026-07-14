import type { PlatformTenantStatus, Tenant } from "@/types";

export interface PlatformMetricPoint {
  label: string;
  value: number;
}

export interface PlatformTrendPoint extends PlatformMetricPoint {
  cumulativeValue: number;
}

export interface PlatformOperationsSnapshot {
  generatedAt: string;
  tenants: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
    pending: number;
    archived: number;
    rejected: number;
    newThisMonth: number;
    growthPercent: number | null;
  };
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisMonth: number;
    activeSessions: number;
    loggedInLastSevenDays: number;
    tenantAdminsInactiveThirtyDays: number;
  };
  usage: {
    averageEmployeesPerTenant: number;
    averageProjectsPerTenant: number;
    averageTeamsPerTenant: number;
    averageTasksPerTenant: number;
    platformAuditEvents: number;
    tenantsWithUsageAvailable: number;
  };
  tenantStatusDistribution: PlatformMetricPoint[];
  tenantGrowthTrend: PlatformTrendPoint[];
  userGrowthTrend: PlatformTrendPoint[];
  loginActivityTrend: PlatformTrendPoint[];
  userRoleDistribution: PlatformMetricPoint[];
  tenantHealth: Tenant[];
  recentAuditEvents: PlatformAuditEvent[];
}

export interface PlatformUserRecord {
  id: number;
  fullName: string;
  email: string;
  role: string;
  status: string;
  tenantKey?: string | null;
  companyName?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  activeSessions: number;
}

export interface PlatformAuditEvent {
  id: number;
  tenantKey: string;
  companyName?: string | null;
  actorEmail: string;
  action: string;
  previousStatus: PlatformTenantStatus;
  newStatus: PlatformTenantStatus;
  occurredAt: string;
}

export interface PlatformTenantAdminActionResult {
  tenantKey: string;
  adminEmail: string;
  action: string;
  passwordChangeRequired: boolean;
}
