import { useQuery } from "@tanstack/react-query";
import { getEmployees, getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { getMyProjects, getProjects } from "@/modules/projects/services/projectService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { getMyTeams, getTeams } from "@/modules/teams/services/teamService";
import { queryKeys } from "@/hooks/queries/queryKeys";
import { useAuthStore } from "@/store/authStore";

export function useEmployeesQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.employees(),
    queryFn: getEmployees,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 5 * 60_000,
  });
}

export function useProjectsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: getProjects,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 2 * 60_000,
  });
}

export function useMyProjectsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.myProjects(),
    queryFn: getMyProjects,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 2 * 60_000,
  });
}

export function useTeamsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 2 * 60_000,
  });
}

export function useMyTeamsQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.myTeams(),
    queryFn: getMyTeams,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 2 * 60_000,
  });
}

export function useTasksQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.tasks(),
    queryFn: getTasks,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 45_000,
  });
}

export function useMyEmployeeProfileQuery(enabled = true) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.myEmployeeProfile(),
    queryFn: getMyEmployeeProfile,
    enabled: enabled && authReady && isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
