import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import type { ApiResponse } from "@/types";
import type {
  FeatureMatrix,
  CurrentSubscriptionAccess,
  SubscriptionOverview,
  SubscriptionPlan,
  SubscriptionPlanInput,
  TenantPlanAssignmentInput,
  TenantSubscription,
} from "@/modules/subscriptions/types";

const BASE_PATH = "/api/platform/subscriptions";

export async function getSubscriptionOverviewApi(): Promise<SubscriptionOverview> {
  const { data } = await apiClient.get<ApiResponse<SubscriptionOverview> | SubscriptionOverview>(
    `${BASE_PATH}/overview`,
  );
  return unwrapApiData<SubscriptionOverview>(data);
}

export async function createSubscriptionPlanApi(
  payload: SubscriptionPlanInput,
): Promise<SubscriptionPlan> {
  const { data } = await apiClient.post<ApiResponse<SubscriptionPlan> | SubscriptionPlan>(
    `${BASE_PATH}/plans`,
    payload,
  );
  return unwrapApiData<SubscriptionPlan>(data);
}

export async function updateSubscriptionPlanApi(
  planId: number,
  payload: SubscriptionPlanInput,
): Promise<SubscriptionPlan> {
  const { data } = await apiClient.put<ApiResponse<SubscriptionPlan> | SubscriptionPlan>(
    `${BASE_PATH}/plans/${planId}`,
    payload,
  );
  return unwrapApiData<SubscriptionPlan>(data);
}

export async function setSubscriptionPlanActiveApi(
  planId: number,
  active: boolean,
): Promise<SubscriptionPlan> {
  const { data } = await apiClient.patch<ApiResponse<SubscriptionPlan> | SubscriptionPlan>(
    `${BASE_PATH}/plans/${planId}/active`,
    { active },
  );
  return unwrapApiData<SubscriptionPlan>(data);
}

export async function setPlanFeatureApi(
  planId: number,
  featureKey: string,
  enabled: boolean,
): Promise<FeatureMatrix> {
  const { data } = await apiClient.patch<ApiResponse<FeatureMatrix> | FeatureMatrix>(
    `${BASE_PATH}/plans/${planId}/features/${encodeURIComponent(featureKey)}`,
    { enabled },
  );
  return unwrapApiData<FeatureMatrix>(data);
}

export async function assignTenantPlanApi(
  tenantKey: string,
  payload: TenantPlanAssignmentInput,
): Promise<TenantSubscription> {
  const { data } = await apiClient.put<ApiResponse<TenantSubscription> | TenantSubscription>(
    `${BASE_PATH}/tenants/${encodeURIComponent(tenantKey)}`,
    payload,
  );
  return unwrapApiData<TenantSubscription>(data);
}

export async function deactivateTenantSubscriptionApi(
  tenantKey: string,
): Promise<TenantSubscription> {
  const { data } = await apiClient.patch<ApiResponse<TenantSubscription> | TenantSubscription>(
    `${BASE_PATH}/tenants/${encodeURIComponent(tenantKey)}/deactivate`,
  );
  return unwrapApiData<TenantSubscription>(data);
}

export async function getCurrentSubscriptionAccessApi(
  tenantSlug: string,
): Promise<CurrentSubscriptionAccess> {
  const { data } = await apiClient.get<
    ApiResponse<CurrentSubscriptionAccess> | CurrentSubscriptionAccess
  >(`/api/${encodeURIComponent(tenantSlug)}/subscription`);
  return unwrapApiData<CurrentSubscriptionAccess>(data);
}
