import { getTenantByKeyApi, getTenantsApi, updateTenantCompanyApi, updateTenantStatusApi } from "@/services/api/platformApi";
import { asRecord, firstDefined, getId, getString, toIsoDate } from "@/services/http/parsers";
import type { PlatformTenantStatus, Tenant } from "@/types";

function normalizeTenant(input: unknown): Tenant {
  const value = asRecord(input);
  const tenantKey = firstDefined(
    getString(value.tenantKey),
    getString(value.key),
    getString(value.tenant_id)
  ) ?? "";

  const companyName = firstDefined(
    getString(value.companyName),
    getString(value.name),
    tenantKey || undefined
  ) ?? "Unnamed Tenant";

  const status = firstDefined(
    getString(value.status),
    getString(value.state)
  ) ?? "active";

  return {
    ...value,
    id: getId(firstDefined(value.id, value.tenantId, tenantKey)),
    tenantKey,
    companyName,
    adminEmail: firstDefined(
      getString(value.adminEmail),
      getString(value.tenantAdminEmail),
      getString(value.ownerEmail)
    ),
    adminName: getString(value.adminName),
    databaseName: getString(value.databaseName),
    status: status.toLowerCase(),
    createdAt: toIsoDate(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: getString(firstDefined(value.updatedAt, value.updatedDate)),
    active: value.active === true,
    employeeCount: Number(value.employeeCount ?? 0),
    projectCount: Number(value.projectCount ?? 0),
    teamCount: Number(value.teamCount ?? 0),
    taskCount: Number(value.taskCount ?? 0),
    lastLoginAt: toIsoDate(value.lastLoginAt),
    lastActivityAt: toIsoDate(value.lastActivityAt),
    usageAvailable: value.usageAvailable === true,
  };
}

export async function getPlatformTenants(): Promise<Tenant[]> {
  const tenants = await getTenantsApi();
  return tenants.map((tenant) => normalizeTenant(tenant));
}

export async function getPlatformTenantByKey(tenantKey: string): Promise<Tenant> {
  const tenant = await getTenantByKeyApi(tenantKey);
  return normalizeTenant(tenant);
}

export async function updatePlatformTenantStatus(tenantKey: string, status: PlatformTenantStatus): Promise<Tenant> {
  return normalizeTenant(await updateTenantStatusApi(tenantKey, status));
}

export async function updatePlatformTenantCompany(tenantKey: string, companyName: string): Promise<Tenant> {
  return normalizeTenant(await updateTenantCompanyApi(tenantKey, companyName));
}
