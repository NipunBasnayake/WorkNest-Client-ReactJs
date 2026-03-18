import { hasTenantRole } from "@/constants/access";

describe("hasTenantRole", () => {
  it("matches ADMIN and TENANT_ADMIN interchangeably", () => {
    expect(hasTenantRole("ADMIN", ["TENANT_ADMIN"])).toBe(true);
    expect(hasTenantRole("TENANT_ADMIN", ["ADMIN"])).toBe(true);
  });

  it("keeps non-admin role checks strict", () => {
    expect(hasTenantRole("EMPLOYEE", ["MANAGER"])).toBe(false);
    expect(hasTenantRole("MANAGER", ["MANAGER"])).toBe(true);
  });
});
