import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPlatformAuditEventsApi,
  getPlatformOperationsSnapshotApi,
  getPlatformUsersApi,
  resendTenantWelcomeApi,
  resetTenantAdminPasswordApi,
  unlockTenantAdminApi,
} from "@/services/api/platformApi";
import { getPlatformTenantByKey, getPlatformTenants, updatePlatformTenantCompany, updatePlatformTenantStatus } from "@/modules/platform/services/platformTenantService";
import type { PlatformTenantStatus, Tenant } from '@/types';
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

export function usePlatformAnalyticsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformAnalytics(),
    queryFn: getPlatformOperationsSnapshotApi,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 60_000,
  });
}

export function usePlatformDashboardQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformDashboard(),
    queryFn: getPlatformOperationsSnapshotApi,
    enabled: enabled && authReady && isAuthenticated && sessionType === 'platform',
    staleTime: 60_000,
  });
}

export function usePlatformUsersQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformUsers(),
    queryFn: getPlatformUsersApi,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 60_000,
  });
}

export function usePlatformAuditEventsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformAuditEvents(),
    queryFn: getPlatformAuditEventsApi,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 60_000,
  });
}

export function usePlatformTenantsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformTenants(),
    queryFn: getPlatformTenants,
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform",
    staleTime: 60_000,
  });
}

export function usePlatformTenantCompanyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantKey, companyName }: { tenantKey: string; companyName: string }) =>
      updatePlatformTenantCompany(tenantKey, companyName),
    onSuccess: async (updatedTenant) => {
      queryClient.setQueryData<Tenant[]>(queryKeys.platformTenants(), (current = []) =>
        current.map((tenant) => tenant.tenantKey.toLowerCase() === updatedTenant.tenantKey.toLowerCase() ? updatedTenant : tenant));
      queryClient.setQueryData(queryKeys.platformTenantDetail(updatedTenant.tenantKey), updatedTenant);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenants() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenantDetail(updatedTenant.tenantKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformDashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformAuditEvents() }),
      ]);
    },
  });
}

export type PlatformTenantAdminAction = "reset-password" | "unlock" | "resend-welcome";

export function usePlatformTenantAdminActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantKey, action }: { tenantKey: string; action: PlatformTenantAdminAction }) => {
      if (action === "unlock") return unlockTenantAdminApi(tenantKey);
      if (action === "resend-welcome") return resendTenantWelcomeApi(tenantKey);
      return resetTenantAdminPasswordApi(tenantKey);
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenantDetail(variables.tenantKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenants() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformUsers() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformDashboard() }),
      ]);
    },
  });
}

export function usePlatformTenantDetailQuery(tenantKey: string | undefined, enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const sessionType = useAuthStore((s) => s.sessionType);
  return useQuery({
    queryKey: queryKeys.platformTenantDetail(tenantKey),
    queryFn: () => {
      if (!tenantKey) {
        throw new Error("Tenant key is required.");
      }
      return getPlatformTenantByKey(tenantKey);
    },
    enabled: enabled && authReady && isAuthenticated && sessionType === "platform" && Boolean(tenantKey),
    staleTime: 60_000,
  });
}

export function usePlatformTenantStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantKey, status }: { tenantKey: string; status: PlatformTenantStatus }) =>
      updatePlatformTenantStatus(tenantKey, status),
    onSuccess: async (updatedTenant, variables) => {
      queryClient.setQueryData<Tenant[]>(queryKeys.platformTenants(), (current = []) =>
        current.map((tenant) => tenant.tenantKey.toLowerCase() === updatedTenant.tenantKey.toLowerCase() ? updatedTenant : tenant));
      queryClient.setQueryData(queryKeys.platformTenantDetail(updatedTenant.tenantKey), updatedTenant);
      queryClient.setQueryData(queryKeys.platformTenantDetail(variables.tenantKey), updatedTenant);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenants() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenantDetail(updatedTenant.tenantKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformTenantDetail(variables.tenantKey) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformDashboard() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformAnalytics() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.platformAuditEvents() }),
      ]);
    },
  });
}
