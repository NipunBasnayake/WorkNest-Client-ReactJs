import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Permission } from "@/constants/permissions";
import { canCreateAnnouncements } from "@/modules/announcements/access";
import { usePermission } from "@/hooks/usePermission";
import { useAuthStore } from "@/store/authStore";

function BootstrapLoader() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border-4 border-transparent animate-spin"
          style={{
            borderTopColor: "#9332EA",
            borderLeftColor: "rgba(147,50,234,0.3)",
          }}
        />
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Starting WorkNest...
        </p>
      </div>
    </div>
  );
}

export function AuthGuard() {
  const { isAuthenticated, isBootstrapping, passwordChangeRequired } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (passwordChangeRequired) {
    return <Navigate to="/force-password-change" state={{ from: location }} replace />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function PlatformGuard() {
  const { isAuthenticated, isBootstrapping, sessionType, passwordChangeRequired } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (passwordChangeRequired) {
    return <Navigate to="/force-password-change" state={{ from: location }} replace />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (sessionType !== "platform") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export function TenantGuard() {
  const { isAuthenticated, isBootstrapping, sessionType, passwordChangeRequired } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (passwordChangeRequired) {
    return <Navigate to="/force-password-change" state={{ from: location }} replace />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (sessionType !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

interface PermissionGuardProps {
  permission: Permission;
}

export function PermissionGuard({ permission }: PermissionGuardProps) {
  const { isAuthenticated, isBootstrapping, sessionType, user, passwordChangeRequired } = useAuthStore();
  const { hasPermission } = usePermission();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (passwordChangeRequired) {
    return <Navigate to="/force-password-change" state={{ from: location }} replace />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (sessionType !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }
  if (!user || !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export function AnnouncementManageGuard() {
  const { isAuthenticated, isBootstrapping, sessionType, user, passwordChangeRequired } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (passwordChangeRequired) {
    return <Navigate to="/force-password-change" state={{ from: location }} replace />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (sessionType !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }
  if (!user || !canCreateAnnouncements(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export function GuestGuard() {
  const { isAuthenticated, isBootstrapping, sessionType, passwordChangeRequired } = useAuthStore();

  if (isBootstrapping) return <BootstrapLoader />;

  if (passwordChangeRequired) {
    return <Outlet />;
  }

  if (isAuthenticated) {
    const to = sessionType === "platform" ? "/platform/dashboard" : "/app/dashboard";
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
