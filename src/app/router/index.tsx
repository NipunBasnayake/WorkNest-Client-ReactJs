import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

/* ── Layouts ── */
import { PublicLayout }    from "@/app/layouts/PublicLayout";
import { TenantLayout, PlatformLayout } from "@/app/layouts/AppLayout";

/* ── Guards ── */
import { GuestGuard, TenantGuard, PlatformGuard } from "@/app/guards/RouteGuards";

/* ── Public pages ── */
import { LandingPage }           from "@/pages/public/LandingPage";
import { LoginPage }             from "@/pages/public/LoginPage";
import { RegisterCompanyPage }   from "@/pages/public/RegisterCompanyPage";
import { NotFoundPage }          from "@/pages/public/NotFoundPage";
import { UnauthorizedPage }      from "@/pages/public/UnauthorizedPage";
import { SessionExpiredPage }    from "@/pages/public/SessionExpiredPage";

/* ── Tenant (app) pages ── */
import { TenantDashboardPage }   from "@/pages/app/TenantDashboardPage";
import { EmployeesPage }         from "@/pages/app/EmployeesPage";
import { ProfilePage }           from "@/pages/app/ProfilePage";
import { SettingsPage }          from "@/pages/app/SettingsPage";

/* ── Platform pages ── */
import { PlatformDashboardPage } from "@/pages/platform/PlatformDashboardPage";
import { PlatformTenantsPage }   from "@/pages/platform/PlatformTenantsPage";
import { TenantDetailPage }      from "@/pages/platform/TenantDetailPage";

const router = createBrowserRouter([
  /* ── Public layout ── */
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },

      /* Guest guard — redirects already-logged-in users */
      {
        element: <GuestGuard />,
        children: [
          { path: "login",           element: <LoginPage /> },
          { path: "register",        element: <RegisterCompanyPage /> },
          { path: "session-expired", element: <SessionExpiredPage /> },
        ],
      },

      { path: "unauthorized", element: <UnauthorizedPage /> },
      { path: "*",            element: <NotFoundPage /> },
    ],
  },

  /* ── Tenant (workspace) area ── */
  {
    element: <TenantGuard />,
    children: [
      {
        element: <TenantLayout />,
        children: [
          { path: "app",           element: <Navigate to="/app/dashboard" replace /> },
          { path: "app/dashboard", element: <TenantDashboardPage /> },
          { path: "app/employees", element: <EmployeesPage /> },
          { path: "app/profile",   element: <ProfilePage /> },
          { path: "app/settings",  element: <SettingsPage /> },
          /* Placeholder routes for future modules */
          { path: "app/*",         element: <ComingSoonPage /> },
        ],
      },
    ],
  },

  /* ── Platform admin area ── */
  {
    element: <PlatformGuard />,
    children: [
      {
        element: <PlatformLayout />,
        children: [
          { path: "platform",                           element: <Navigate to="/platform/dashboard" replace /> },
          { path: "platform/dashboard",                 element: <PlatformDashboardPage /> },
          { path: "platform/tenants",                   element: <PlatformTenantsPage /> },
          { path: "platform/tenants/:tenantKey",        element: <TenantDetailPage /> },
          { path: "platform/profile",                   element: <ProfilePage /> },
          { path: "platform/*",                         element: <ComingSoonPage /> },
        ],
      },
    ],
  },
]);

function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(147,50,234,0.08)", border: "1px solid rgba(147,50,234,0.15)", color: "var(--color-primary-500)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Coming Soon</h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>This module is being built and will be available in a future phase.</p>
    </div>
  );
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
