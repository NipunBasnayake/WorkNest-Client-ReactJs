import { getTenantByKeyApi, getTenantsApi } from "@/services/api/platformApi";
import { asRecord, firstDefined, getId, getString, toIsoDate } from "@/services/http/parsers";
import type { Tenant } from "@/types";

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
    status: status.toLowerCase(),
    createdAt: toIsoDate(firstDefined(value.createdAt, value.createdDate)),
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
