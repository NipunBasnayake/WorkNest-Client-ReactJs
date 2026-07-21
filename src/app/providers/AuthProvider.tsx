import { useEffect, useRef, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { clearProtectedImageCache } from "@/services/uploads/protectedImageCache";
import { registerAuthRuntimeAdapter } from "@/services/auth/authRuntimeBridge";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider bootstraps the session on app mount.
 * It sits inside ThemeProvider but wraps the router.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const sessionIdentity = useAuthStore((state) => state.isAuthenticated
    ? `${state.sessionType ?? "unknown"}:${state.tenantKey ?? state.user?.id ?? "unknown"}`
    : null);
  const queryClient = useQueryClient();
  const previousIdentity = useRef<string | null | undefined>(undefined);

  useEffect(() => registerAuthRuntimeAdapter({
    getTenantKey: () => useAuthStore.getState().tenantKey,
    applyTokenRefresh: (accessToken, tenantKey) => useAuthStore.getState().applyTokenRefresh(accessToken, tenantKey),
    hardLogout: (redirectTo) => useAuthStore.getState().hardLogout(redirectTo),
  }), []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (previousIdentity.current !== undefined && previousIdentity.current !== sessionIdentity) {
      queryClient.clear();
      clearProtectedImageCache();
    }
    previousIdentity.current = sessionIdentity;
  }, [queryClient, sessionIdentity]);

  return <>{children}</>;
}
