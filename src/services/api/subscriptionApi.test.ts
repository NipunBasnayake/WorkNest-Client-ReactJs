import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, patch, put } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
}));

vi.mock("@/services/http/client", () => ({
  apiClient: { get, post, patch, put },
}));

import {
  assignTenantPlanApi,
  getSubscriptionOverviewApi,
  setPlanFeatureApi,
} from "@/services/api/subscriptionApi";

describe("subscriptionApi", () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    patch.mockReset();
    put.mockReset();
  });

  it("loads the consolidated platform subscription overview", async () => {
    get.mockResolvedValue({
      data: {
        success: true,
        data: {
          statistics: { totalTenants: 8, planDistribution: { FREE: 8 } },
          plans: [],
          tenantSubscriptions: [],
          featureMatrix: { plans: [], features: [] },
        },
      },
    });

    const result = await getSubscriptionOverviewApi();

    expect(get).toHaveBeenCalledWith("/api/platform/subscriptions/overview");
    expect(result.statistics.totalTenants).toBe(8);
  });

  it("uses a stable feature key when changing a plan capability", async () => {
    patch.mockResolvedValue({
      data: { success: true, data: { plans: [], features: [] } },
    });

    await setPlanFeatureApi(3, "RECRUITMENT", false);

    expect(patch).toHaveBeenCalledWith(
      "/api/platform/subscriptions/plans/3/features/RECRUITMENT",
      { enabled: false },
    );
  });

  it("assigns plans without any payment payload", async () => {
    put.mockResolvedValue({
      data: {
        success: true,
        data: { tenantKey: "acme/org", planCode: "PROFESSIONAL", status: "ACTIVE" },
      },
    });

    const result = await assignTenantPlanApi("acme/org", {
      planCode: "PROFESSIONAL",
      expiresAt: null,
    });

    expect(put).toHaveBeenCalledWith(
      "/api/platform/subscriptions/tenants/acme%2Forg",
      { planCode: "PROFESSIONAL", expiresAt: null },
    );
    expect(result.planCode).toBe("PROFESSIONAL");
  });
});
