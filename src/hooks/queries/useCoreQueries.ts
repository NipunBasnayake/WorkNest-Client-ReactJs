import { useQuery } from "@tanstack/react-query";
import { getEmployees, getMyEmployeeProfile } from "@/modules/employees/services/employeeService";
import { getMyProjects, getProjects } from "@/modules/projects/services/projectService";
import { getTasks } from "@/modules/tasks/services/taskService";
import { getMyTeams, getTeams } from "@/modules/teams/services/teamService";
import { queryKeys } from "@/hooks/queries/queryKeys";

export function useEmployeesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees(),
    queryFn: getEmployees,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useProjectsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.projects(),
    queryFn: getProjects,
    enabled,
    staleTime: 2 * 60_000,
  });
}

export function useMyProjectsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myProjects(),
    queryFn: getMyProjects,
    enabled,
    staleTime: 2 * 60_000,
  });
}

export function useTeamsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.teams(),
    queryFn: getTeams,
    enabled,
    staleTime: 2 * 60_000,
  });
}

export function useMyTeamsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myTeams(),
    queryFn: getMyTeams,
    enabled,
    staleTime: 2 * 60_000,
  });
}

export function useTasksQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tasks(),
    queryFn: getTasks,
    enabled,
    staleTime: 45_000,
  });
}

export function useMyEmployeeProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.myEmployeeProfile(),
    queryFn: getMyEmployeeProfile,
    enabled,
    staleTime: 5 * 60_000,
  });
}
