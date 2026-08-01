import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { queryKeys } from "@/hooks/queries/queryKeys";
import {
  assignTenantPlanApi,
  createSubscriptionPlanApi,
  deleteSubscriptionPlanApi,
  deactivateTenantSubscriptionApi,
  getSubscriptionOverviewApi,
  getCurrentSubscriptionAccessApi,
  getTenantPackageCatalogApi,
  selectTenantPackageApi,
  setPlanFeatureApi,
  setSubscriptionPlanActiveApi,
  updateSubscriptionPlanApi,
} from "@/services/api/subscriptionApi";
import type {
  SubscriptionPlanInput,
  TenantPlanAssignmentInput,
} from "@/modules/subscriptions/types";

export function useCurrentSubscriptionQuery(tenantKey: string | undefined, enabled = true) {
  const authReady = useAuthStore((state) => state.authReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionType = useAuthStore((state) => state.sessionType);

  return useQuery({
    queryKey: queryKeys.currentSubscription(tenantKey),
    queryFn: () => {
      if (!tenantKey) throw new Error("Tenant key is required.");
      return getCurrentSubscriptionAccessApi(tenantKey);
    },
    enabled: enabled && Boolean(tenantKey) && authReady && isAuthenticated && sessionType === "tenant",
    staleTime: 30_000,
  });
}

export function useSubscriptionOverviewQuery(enabled = true) {
  const authReady = useAuthStore((state) => state.authReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionType = useAuthStore((state) => state.sessionType);

  return useQuery({
    queryKey: queryKeys.subscriptionOverview(),
    queryFn: getSubscriptionOverviewApi,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 30_000,
  });
}

export function useTenantPackageCatalogQuery(tenantKey: string | undefined, enabled = true) {
  const authReady = useAuthStore((state) => state.authReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionType = useAuthStore((state) => state.sessionType);

  return useQuery({
    queryKey: queryKeys.tenantPackageCatalog(tenantKey),
    queryFn: () => {
      if (!tenantKey) throw new Error("Tenant key is required.");
      return getTenantPackageCatalogApi(tenantKey);
    },
    enabled: enabled && Boolean(tenantKey) && authReady && isAuthenticated && sessionType === "tenant",
    staleTime: 30_000,
  });
}

function useSubscriptionInvalidation() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.subscriptionOverview() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.platformDashboard() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.platformAuditEvents() }),
    ]);
  };
}

export function useCreateSubscriptionPlanMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: createSubscriptionPlanApi,
    onSuccess: invalidate,
  });
}

export function useUpdateSubscriptionPlanMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: ({ planId, payload }: { planId: number; payload: SubscriptionPlanInput }) =>
      updateSubscriptionPlanApi(planId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSubscriptionPlanMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: deleteSubscriptionPlanApi,
    onSuccess: invalidate,
  });
}

export function useSetSubscriptionPlanActiveMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: ({ planId, active }: { planId: number; active: boolean }) =>
      setSubscriptionPlanActiveApi(planId, active),
    onSuccess: invalidate,
  });
}

export function useSetPlanFeatureMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: ({
      planId,
      featureKey,
      enabled,
    }: {
      planId: number;
      featureKey: string;
      enabled: boolean;
    }) => setPlanFeatureApi(planId, featureKey, enabled),
    onSuccess: invalidate,
  });
}

export function useAssignTenantPlanMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: ({
      tenantKey,
      payload,
    }: {
      tenantKey: string;
      payload: TenantPlanAssignmentInput;
    }) => assignTenantPlanApi(tenantKey, payload),
    onSuccess: invalidate,
  });
}

export function useDeactivateTenantSubscriptionMutation() {
  const invalidate = useSubscriptionInvalidation();
  return useMutation({
    mutationFn: deactivateTenantSubscriptionApi,
    onSuccess: invalidate,
  });
}

export function useSelectTenantPackageMutation(tenantKey: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planCode: string) => {
      if (!tenantKey) throw new Error("Tenant key is required.");
      return selectTenantPackageApi(tenantKey, planCode);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.currentSubscription(tenantKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.tenantPackageCatalog(tenantKey) }),
      ]);
    },
  });
}
