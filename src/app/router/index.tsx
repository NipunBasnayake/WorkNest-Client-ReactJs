import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthLayout } from "@/app/layouts/AuthLayout";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { PlatformLayout, TenantLayout } from "@/app/layouts/AppLayout";
import { AnnouncementManageGuard, GuestGuard, PermissionGuard, PlatformGuard, TenantGuard } from "@/app/guards/RouteGuards";
import { PERMISSIONS } from "@/constants/permissions";

function RouteLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div
        className="h-9 w-9 animate-spin rounded-full border-4 border-transparent"
        style={{ borderTopColor: "#9332EA", borderLeftColor: "rgba(147,50,234,0.3)" }}
      />
    </div>
  );
}

function lazyElement<TModule extends Record<string, unknown>>(
  importer: () => Promise<TModule>,
  exportName: keyof TModule
) {
  const LazyComponent = lazy(async () => {
    const module = await importer();
    const component = module[exportName] as ComponentType<unknown> | undefined;

    if (!component) {
      throw new Error(`Route export "${String(exportName)}" was not found.`);
    }

    return { default: component };
  });

  return (
    <Suspense fallback={<RouteLoader />}>
      <LazyComponent />
    </Suspense>
  );
}

const landingPage = lazyElement(() => import("@/pages/public/LandingPage"), "LandingPage");
const loginPage = lazyElement(() => import("@/pages/public/LoginPage"), "LoginPage");
const registerPage = lazyElement(() => import("@/pages/public/RegisterPage"), "RegisterPage");
const forgotPasswordPage = lazyElement(() => import("@/pages/public/ForgotPasswordPage"), "ForgotPasswordPage");
const resetPasswordPage = lazyElement(() => import("@/pages/public/ResetPasswordPage"), "ResetPasswordPage");
const forcePasswordChangePage = lazyElement(() => import("@/pages/public/ForcePasswordChangePage"), "ForcePasswordChangePage");
const sessionExpiredPage = lazyElement(() => import("@/pages/public/SessionExpiredPage"), "SessionExpiredPage");
const unauthorizedPage = lazyElement(() => import("@/pages/public/UnauthorizedPage"), "UnauthorizedPage");
const notFoundPage = lazyElement(() => import("@/pages/public/NotFoundPage"), "NotFoundPage");

const tenantDashboardPage = lazyElement(() => import("@/pages/app/TenantDashboardPage"), "TenantDashboardPage");
const employeesPage = lazyElement(() => import("@/pages/app/EmployeesPage"), "EmployeesPage");
const employeeDetailPage = lazyElement(() => import("@/pages/app/EmployeeDetailPage"), "EmployeeDetailPage");
const employeeFormPage = lazyElement(() => import("@/pages/app/EmployeeFormPage"), "EmployeeFormPage");
const teamsPage = lazyElement(() => import("@/pages/app/TeamsPage"), "TeamsPage");
const teamDetailPage = lazyElement(() => import("@/pages/app/TeamDetailPage"), "TeamDetailPage");
const teamFormPage = lazyElement(() => import("@/pages/app/TeamFormPage"), "TeamFormPage");
const projectsPage = lazyElement(() => import("@/pages/app/ProjectsPage"), "ProjectsPage");
const projectDetailPage = lazyElement(() => import("@/pages/app/ProjectDetailPage"), "ProjectDetailPage");
const projectFormPage = lazyElement(() => import("@/pages/app/ProjectFormPage"), "ProjectFormPage");
const tasksPage = lazyElement(() => import("@/pages/app/TasksPage"), "TasksPage");
const taskDetailPage = lazyElement(() => import("@/pages/app/TaskDetailPage"), "TaskDetailPage");
const taskFormPage = lazyElement(() => import("@/pages/app/TaskFormPage"), "TaskFormPage");
const taskBoardPage = lazyElement(() => import("@/pages/app/TaskBoardPage"), "TaskBoardPage");
const attendancePage = lazyElement(() => import("@/pages/app/AttendancePage"), "AttendancePage");
const leavePage = lazyElement(() => import("@/pages/app/LeavePage"), "LeavePage");
const leaveDetailPage = lazyElement(() => import("@/pages/app/LeaveDetailPage"), "LeaveDetailPage");
const leaveFormPage = lazyElement(() => import("@/pages/app/LeaveFormPage"), "LeaveFormPage");
const announcementsPage = lazyElement(() => import("@/pages/app/AnnouncementsPage"), "AnnouncementsPage");
const announcementDetailPage = lazyElement(() => import("@/pages/app/AnnouncementDetailPage"), "AnnouncementDetailPage");
const announcementFormPage = lazyElement(() => import("@/pages/app/AnnouncementFormPage"), "AnnouncementFormPage");
const notificationsPage = lazyElement(() => import("@/pages/app/NotificationsPage"), "NotificationsPage");
const chatPage = lazyElement(() => import("@/pages/app/ChatPage"), "ChatPage");
const analyticsPage = lazyElement(() => import("@/pages/app/AnalyticsPage"), "AnalyticsPage");
const profilePage = lazyElement(() => import("@/pages/app/ProfilePage"), "ProfilePage");

const appSettingsLayoutPage = lazyElement(() => import("@/pages/app/settings/AppSettingsLayoutPage"), "AppSettingsLayoutPage");
const appSettingsProfilePage = lazyElement(() => import("@/pages/app/settings/AppSettingsProfilePage"), "AppSettingsProfilePage");
const appSettingsWorkspacePage = lazyElement(() => import("@/pages/app/settings/AppSettingsWorkspacePage"), "AppSettingsWorkspacePage");
const appSettingsPreferencesPage = lazyElement(() => import("@/pages/app/settings/AppSettingsPreferencesPage"), "AppSettingsPreferencesPage");

const platformDashboardPage = lazyElement(() => import("@/pages/platform/PlatformDashboardPage"), "PlatformDashboardPage");
const platformAnalyticsPage = lazyElement(() => import("@/pages/platform/PlatformAnalyticsPage"), "PlatformAnalyticsPage");
const platformSettingsPage = lazyElement(() => import("@/pages/platform/PlatformSettingsPage"), "PlatformSettingsPage");
const platformTenantsPage = lazyElement(() => import("@/pages/platform/PlatformTenantsPage"), "PlatformTenantsPage");
const tenantDetailPlatformPage = lazyElement(() => import("@/pages/platform/TenantDetailPage"), "TenantDetailPage");

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: landingPage },
      { path: "unauthorized", element: unauthorizedPage },
      { path: "*", element: notFoundPage },
    ],
  },

  {
    element: <AuthLayout />,
    children: [
      {
        element: <GuestGuard />,
        children: [
          { path: "login", element: loginPage },
          { path: "register", element: registerPage },
          { path: "register-company", element: registerPage },
          { path: "forgot-password", element: forgotPasswordPage },
          { path: "reset-password", element: resetPasswordPage },
          { path: "reset-password/:token", element: resetPasswordPage },
          { path: "force-password-change", element: forcePasswordChangePage },
          { path: "session-expired", element: sessionExpiredPage },
        ],
      },
    ],
  },

  {
    element: <TenantGuard />,
    children: [
      {
        element: <TenantLayout />,
        children: [
          { path: "app", element: <Navigate to="/app/dashboard" replace /> },
          { path: "app/dashboard", element: tenantDashboardPage },

          {
            element: <PermissionGuard permission={PERMISSIONS.EMPLOYEES_VIEW} />,
            children: [
              { path: "app/employees", element: employeesPage },
              { path: "app/employees/:id", element: employeeDetailPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.EMPLOYEES_MANAGE} />,
            children: [
              { path: "app/employees/new", element: employeeFormPage },
              { path: "app/employees/:id/edit", element: employeeFormPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.TEAMS_VIEW} />,
            children: [
              { path: "app/teams", element: teamsPage },
              { path: "app/teams/:id", element: teamDetailPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.TEAMS_MANAGE} />,
            children: [
              { path: "app/teams/new", element: teamFormPage },
              { path: "app/teams/:id/edit", element: teamFormPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.PROJECTS_VIEW} />,
            children: [
              { path: "app/projects", element: projectsPage },
              { path: "app/projects/:id", element: projectDetailPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.PROJECTS_MANAGE} />,
            children: [
              { path: "app/projects/new", element: projectFormPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.PROJECTS_VIEW} />,
            children: [{ path: "app/projects/:id/edit", element: projectFormPage }],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.TASKS_VIEW} />,
            children: [
              { path: "app/tasks", element: tasksPage },
              { path: "app/tasks/board", element: taskBoardPage },
              { path: "app/tasks/new", element: taskFormPage },
              { path: "app/tasks/:id", element: taskDetailPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.TASKS_MANAGE} />,
            children: [
              { path: "app/tasks/:id/edit", element: taskFormPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.ATTENDANCE_VIEW} />,
            children: [{ path: "app/attendance", element: attendancePage }],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.LEAVE_VIEW} />,
            children: [
              { path: "app/leave", element: leavePage },
              { path: "app/leave/:id", element: leaveDetailPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.LEAVE_REQUEST} />,
            children: [
              { path: "app/leave/new", element: leaveFormPage },
              { path: "app/leave/:id/edit", element: leaveFormPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.ANNOUNCEMENTS_VIEW} />,
            children: [
              { path: "app/announcements", element: announcementsPage },
              { path: "app/announcements/:id", element: announcementDetailPage },
            ],
          },

          {
            element: <AnnouncementManageGuard />,
            children: [
              { path: "app/announcements/new", element: announcementFormPage },
              { path: "app/announcements/:id/edit", element: announcementFormPage },
            ],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.NOTIFICATIONS_VIEW} />,
            children: [{ path: "app/notifications", element: notificationsPage }],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.CHAT_VIEW} />,
            children: [{ path: "app/chat", element: chatPage }],
          },

          {
            element: <PermissionGuard permission={PERMISSIONS.ANALYTICS_VIEW} />,
            children: [{ path: "app/analytics", element: analyticsPage }],
          },

          { path: "app/profile", element: profilePage },
          {
            path: "app/settings",
            element: appSettingsLayoutPage,
            children: [
              { index: true, element: <Navigate to="profile" replace /> },
              { path: "profile", element: appSettingsProfilePage },
              { path: "workspace", element: appSettingsWorkspacePage },
              { path: "preferences", element: appSettingsPreferencesPage },
            ],
          },
          { path: "app/*", element: <ComingSoonPage /> },
        ],
      },
    ],
  },

  {
    element: <PlatformGuard />,
    children: [
      {
        element: <PlatformLayout />,
        children: [
          { path: "platform", element: <Navigate to="/platform/dashboard" replace /> },
          { path: "platform/dashboard", element: platformDashboardPage },
          { path: "platform/analytics", element: platformAnalyticsPage },
          { path: "platform/tenants", element: platformTenantsPage },
          { path: "platform/tenants/:tenantKey", element: tenantDetailPlatformPage },
          { path: "platform/profile", element: profilePage },
          { path: "platform/settings", element: platformSettingsPage },
          { path: "platform/*", element: <ComingSoonPage /> },
        ],
      },
    ],
  },
]);

function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="mb-4 h-16 w-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(147,50,234,0.08)", border: "1px solid rgba(147,50,234,0.15)", color: "var(--color-primary-500)" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Coming Soon
      </h2>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        This module is being built and will be available in a future phase.
      </p>
    </div>
  );
}

export function AppRouter() {
  return <RouterProvider router={router} />;
}
