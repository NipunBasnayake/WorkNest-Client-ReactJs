import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { notifyNotificationsUpdated } from "@/modules/notifications/services/notificationService";
import { queryKeys } from "@/hooks/queries/queryKeys";

export type WorkflowDomain =
  | "announcements"
  | "attendance"
  | "employees"
  | "leave"
  | "notifications"
  | "projects"
  | "recruitment"
  | "settings"
  | "tasks"
  | "teams";

const DASHBOARD_KEYS: QueryKey[] = [
  queryKeys.tenantDashboard(),
  queryKeys.tenantAnalytics(),
];

const DOMAIN_QUERY_KEYS: Record<WorkflowDomain, QueryKey[]> = {
  announcements: [["announcements"], ...DASHBOARD_KEYS],
  attendance: [["attendance"], ...DASHBOARD_KEYS],
  employees: [queryKeys.employees(), queryKeys.myEmployeeProfile(), ...DASHBOARD_KEYS],
  leave: [["leave"], ...DASHBOARD_KEYS],
  notifications: [["notifications"], ...DASHBOARD_KEYS],
  projects: [
    queryKeys.projects(),
    queryKeys.myProjects(),
    ["project"],
    queryKeys.tasks(),
    ...DASHBOARD_KEYS,
  ],
  recruitment: [["recruitment"], queryKeys.employees(), queryKeys.teams(), ...DASHBOARD_KEYS],
  settings: [["settings"], queryKeys.myEmployeeProfile(), ...DASHBOARD_KEYS],
  tasks: [
    queryKeys.tasks(),
    ["task"],
    ["task-comments"],
    queryKeys.projects(),
    queryKeys.myProjects(),
    ["project"],
    ...DASHBOARD_KEYS,
  ],
  teams: [
    queryKeys.teams(),
    queryKeys.myTeams(),
    ["team"],
    queryKeys.projects(),
    queryKeys.myProjects(),
    ...DASHBOARD_KEYS,
  ],
};

const NOTIFICATION_DOMAINS = new Set<WorkflowDomain>([
  "announcements",
  "leave",
  "notifications",
  "tasks",
]);

export async function invalidateWorkflowQueries(
  queryClient: QueryClient,
  domains: WorkflowDomain[],
) {
  const keys = new Map<string, QueryKey>();

  domains.forEach((domain) => {
    DOMAIN_QUERY_KEYS[domain].forEach((key) => {
      keys.set(JSON.stringify(key), key);
    });
  });

  await Promise.all(
    Array.from(keys.values()).map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );

  if (domains.some((domain) => NOTIFICATION_DOMAINS.has(domain))) {
    notifyNotificationsUpdated();
  }
}