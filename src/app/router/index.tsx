import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { PublicLayout } from "@/app/layouts/PublicLayout";
import { PlatformLayout, TenantLayout } from "@/app/layouts/AppLayout";
import { GuestGuard, PlatformGuard, TenantGuard, TenantRoleGuard } from "@/app/guards/RouteGuards";
import {
  TENANT_COMMUNICATION_ROLES,
  TENANT_MODULE_ACCESS,
  TENANT_PROJECT_MANAGEMENT_ROLES,
  TENANT_PROJECT_VIEW_ROLES,
  TENANT_TASK_MANAGEMENT_ROLES,
  TENANT_TASK_VIEW_ROLES,
  TENANT_TEAM_MANAGEMENT_ROLES,
  TENANT_TEAM_VIEW_ROLES,
} from "@/constants/access";

import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { RegisterCompanyPage } from "@/pages/public/RegisterCompanyPage";
import { ForcePasswordChangePage } from "@/pages/public/ForcePasswordChangePage";
import { NotFoundPage } from "@/pages/public/NotFoundPage";
import { UnauthorizedPage } from "@/pages/public/UnauthorizedPage";
import { SessionExpiredPage } from "@/pages/public/SessionExpiredPage";

import { TenantDashboardPage } from "@/pages/app/TenantDashboardPage";
import { EmployeesPage } from "@/pages/app/EmployeesPage";
import { EmployeeDetailPage } from "@/pages/app/EmployeeDetailPage";
import { EmployeeFormPage } from "@/pages/app/EmployeeFormPage";
import { TeamsPage } from "@/pages/app/TeamsPage";
import { TeamDetailPage } from "@/pages/app/TeamDetailPage";
import { TeamFormPage } from "@/pages/app/TeamFormPage";
import { ProjectsPage } from "@/pages/app/ProjectsPage";
import { ProjectDetailPage } from "@/pages/app/ProjectDetailPage";
import { ProjectFormPage } from "@/pages/app/ProjectFormPage";
import { TasksPage } from "@/pages/app/TasksPage";
import { TaskDetailPage } from "@/pages/app/TaskDetailPage";
import { TaskFormPage } from "@/pages/app/TaskFormPage";
import { TaskBoardPage } from "@/pages/app/TaskBoardPage";
import { AttendancePage } from "@/pages/app/AttendancePage";
import { LeavePage } from "@/pages/app/LeavePage";
import { LeaveDetailPage } from "@/pages/app/LeaveDetailPage";
import { LeaveFormPage } from "@/pages/app/LeaveFormPage";
import { AnnouncementsPage } from "@/pages/app/AnnouncementsPage";
import { AnnouncementDetailPage } from "@/pages/app/AnnouncementDetailPage";
import { AnnouncementFormPage } from "@/pages/app/AnnouncementFormPage";
import { NotificationsPage } from "@/pages/app/NotificationsPage";
import { ChatPage } from "@/pages/app/ChatPage";
import { AnalyticsPage } from "@/pages/app/AnalyticsPage";
import { AppSettingsLayoutPage } from "@/pages/app/settings/AppSettingsLayoutPage";
import { AppSettingsProfilePage } from "@/pages/app/settings/AppSettingsProfilePage";
import { AppSettingsWorkspacePage } from "@/pages/app/settings/AppSettingsWorkspacePage";
import { AppSettingsPreferencesPage } from "@/pages/app/settings/AppSettingsPreferencesPage";
import { ProfilePage } from "@/pages/app/ProfilePage";

import { PlatformDashboardPage } from "@/pages/platform/PlatformDashboardPage";
import { PlatformAnalyticsPage } from "@/pages/platform/PlatformAnalyticsPage";
import { PlatformSettingsPage } from "@/pages/platform/PlatformSettingsPage";
import { PlatformTenantsPage } from "@/pages/platform/PlatformTenantsPage";
import { TenantDetailPage } from "@/pages/platform/TenantDetailPage";

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        element: <GuestGuard />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterCompanyPage /> },
          { path: "register-company", element: <RegisterCompanyPage /> },
          { path: "force-password-change", element: <ForcePasswordChangePage /> },
          { path: "session-expired", element: <SessionExpiredPage /> },
        ],
      },
      { path: "unauthorized", element: <UnauthorizedPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },

  {
    element: <TenantGuard />,
    children: [
      {
        element: <TenantLayout />,
        children: [
          { path: "app", element: <Navigate to="/app/dashboard" replace /> },
          { path: "app/dashboard", element: <TenantDashboardPage /> },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.employees} />,
            children: [
              { path: "app/employees", element: <EmployeesPage /> },
              { path: "app/employees/new", element: <EmployeeFormPage /> },
              { path: "app/employees/:id", element: <EmployeeDetailPage /> },
              { path: "app/employees/:id/edit", element: <EmployeeFormPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_TEAM_VIEW_ROLES} />,
            children: [
              { path: "app/teams", element: <TeamsPage /> },
              { path: "app/teams/:id", element: <TeamDetailPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_TEAM_MANAGEMENT_ROLES} />,
            children: [
              { path: "app/teams/new", element: <TeamFormPage /> },
              { path: "app/teams/:id/edit", element: <TeamFormPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_PROJECT_VIEW_ROLES} />,
            children: [
              { path: "app/projects", element: <ProjectsPage /> },
              { path: "app/projects/:id", element: <ProjectDetailPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_PROJECT_MANAGEMENT_ROLES} />,
            children: [
              { path: "app/projects/new", element: <ProjectFormPage /> },
              { path: "app/projects/:id/edit", element: <ProjectFormPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_TASK_VIEW_ROLES} />,
            children: [
              { path: "app/tasks", element: <TasksPage /> },
              { path: "app/tasks/board", element: <TaskBoardPage /> },
              { path: "app/tasks/:id", element: <TaskDetailPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_TASK_MANAGEMENT_ROLES} />,
            children: [
              { path: "app/tasks/new", element: <TaskFormPage /> },
              { path: "app/tasks/:id/edit", element: <TaskFormPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.attendance} />,
            children: [
              { path: "app/attendance", element: <AttendancePage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.leave} />,
            children: [
              { path: "app/leave", element: <LeavePage /> },
              { path: "app/leave/new", element: <LeaveFormPage /> },
              { path: "app/leave/:id", element: <LeaveDetailPage /> },
              { path: "app/leave/:id/edit", element: <LeaveFormPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.announcements} />,
            children: [
              { path: "app/announcements", element: <AnnouncementsPage /> },
              { path: "app/announcements/:id", element: <AnnouncementDetailPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_COMMUNICATION_ROLES} />,
            children: [
              { path: "app/announcements/new", element: <AnnouncementFormPage /> },
              { path: "app/announcements/:id/edit", element: <AnnouncementFormPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.notifications} />,
            children: [
              { path: "app/notifications", element: <NotificationsPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.chat} />,
            children: [
              { path: "app/chat", element: <ChatPage /> },
            ],
          },

          {
            element: <TenantRoleGuard allowedRoles={TENANT_MODULE_ACCESS.analytics} />,
            children: [
              { path: "app/analytics", element: <AnalyticsPage /> },
            ],
          },

          { path: "app/profile", element: <ProfilePage /> },
          {
            path: "app/settings",
            element: <AppSettingsLayoutPage />,
            children: [
              { index: true, element: <Navigate to="profile" replace /> },
              { path: "profile", element: <AppSettingsProfilePage /> },
              { path: "workspace", element: <AppSettingsWorkspacePage /> },
              { path: "preferences", element: <AppSettingsPreferencesPage /> },
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
          { path: "platform/dashboard", element: <PlatformDashboardPage /> },
          { path: "platform/analytics", element: <PlatformAnalyticsPage /> },
          { path: "platform/tenants", element: <PlatformTenantsPage /> },
          { path: "platform/tenants/:tenantKey", element: <TenantDetailPage /> },
          { path: "platform/profile", element: <ProfilePage /> },
          { path: "platform/settings", element: <PlatformSettingsPage /> },
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
