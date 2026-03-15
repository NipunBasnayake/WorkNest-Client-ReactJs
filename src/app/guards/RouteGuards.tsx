import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

/* ─── Spinner shown while bootstrapping ─── */
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
            borderTopColor:  "#9332EA",
            borderLeftColor: "rgba(147,50,234,0.3)",
          }}
        />
        <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
          Starting WorkNest…
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   AuthGuard — protects routes that require any authenticated user
   Redirects to /login if not authenticated.
   ───────────────────────────────────────────────────────────── */
export function AuthGuard() {
  const { isAuthenticated, isBootstrapping } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/* ─────────────────────────────────────────────────────────────
   PlatformGuard — protects /platform/* routes
   Only Platform sessions may access.
   ───────────────────────────────────────────────────────────── */
export function PlatformGuard() {
  const { isAuthenticated, isBootstrapping, sessionType } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (sessionType !== "platform") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

/* ─────────────────────────────────────────────────────────────
   TenantGuard — protects /app/* routes
   Only Tenant sessions may access.
   ───────────────────────────────────────────────────────────── */
export function TenantGuard() {
  const { isAuthenticated, isBootstrapping, sessionType } = useAuthStore();
  const location = useLocation();

  if (isBootstrapping) return <BootstrapLoader />;
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (sessionType !== "tenant") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

/* ─────────────────────────────────────────────────────────────
   GuestGuard — redirects already-logged-in users away from /login
   ───────────────────────────────────────────────────────────── */
export function GuestGuard() {
  const { isAuthenticated, isBootstrapping, sessionType } = useAuthStore();

  if (isBootstrapping) return <BootstrapLoader />;

  if (isAuthenticated) {
    const to = sessionType === "platform" ? "/platform/dashboard" : "/app/dashboard";
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
