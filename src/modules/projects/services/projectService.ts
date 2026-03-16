import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getNumber, getString, toIsoDate, toIsoDateTime } from "@/services/http/parsers";
import { useAuthStore } from "@/store/authStore";
import type { Project, ProjectFormValues, ProjectStatus } from "@/modules/projects/types";
import type { ApiResponse } from "@/types";

function toApiStatus(status: ProjectStatus): string {
  if (status === "active") return "IN_PROGRESS";
  if (status === "on_hold") return "ON_HOLD";
  if (status === "completed") return "COMPLETED";
  if (status === "cancelled") return "CANCELLED";
  return "PLANNED";
}

function toUiStatus(status: unknown): ProjectStatus {
  const normalized = getString(status)?.toUpperCase();
  if (normalized === "IN_PROGRESS" || normalized === "ACTIVE") return "active";
  if (normalized === "ON_HOLD") return "on_hold";
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "CANCELLED") return "cancelled";
  return "planned";
}

function normalizeProject(input: unknown, teamIds: string[] = []): Project {
  const value = asRecord(input);
  const progress = firstDefined(
    getNumber(value.progress),
    getNumber(value.progressPercentage),
    getNumber(value.completionPercentage)
  );

  return {
    id: getId(firstDefined(value.id, value.projectId)),
    name: firstDefined(getString(value.name), getString(value.projectName)) ?? "Project",
    description: firstDefined(getString(value.description), getString(value.summary)),
    status: toUiStatus(firstDefined(value.status, value.projectStatus)),
    startDate: toIsoDate(firstDefined(value.startDate, value.startAt, value.startedOn)),
    endDate: toIsoDate(firstDefined(value.endDate, value.dueDate, value.completedOn)),
    progress:
      progress !== undefined
        ? Math.max(0, Math.min(100, progress))
        : (toUiStatus(firstDefined(value.status, value.projectStatus)) === "completed" ? 100 : 0),
    teamIds,
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
}

async function getProjectTeams(projectId: string): Promise<string[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/projects/${projectId}/teams`);
    const teams = extractList(unwrapApiData<unknown>(data));
    return teams
      .map((team) => getId(firstDefined(asRecord(team).id, asRecord(team).teamId)))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function syncProjectTeams(projectId: string, expectedTeamIds: string[]) {
  const existing = await getProjectTeams(projectId);
  const existingSet = new Set(existing);
  const expectedSet = new Set(expectedTeamIds.filter(Boolean));

  const toAdd = [...expectedSet].filter((teamId) => !existingSet.has(teamId));
  const toRemove = [...existingSet].filter((teamId) => !expectedSet.has(teamId));

  await Promise.all([
    ...toAdd.map((teamId) => apiClient.post(`/api/tenant/projects/${projectId}/teams`, { teamId })),
    ...toRemove.map((teamId) => apiClient.delete(`/api/tenant/projects/${projectId}/teams/${teamId}`)),
  ]);
}

function toProjectPayload(values: ProjectFormValues, includeCreator: boolean) {
  const currentUserId = useAuthStore.getState().user?.id;
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
    status: toApiStatus(values.status),
  };

  if (includeCreator && currentUserId) {
    payload.createdByEmployeeId = currentUserId;
  }

  return payload;
}

export async function getProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/projects");
  const list = extractList(unwrapApiData<unknown>(data));

  const items = await Promise.all(
    list.map(async (item) => {
      const projectId = getId(firstDefined(asRecord(item).id, asRecord(item).projectId));
      const teamIds = projectId ? await getProjectTeams(projectId) : [];
      return normalizeProject(item, teamIds);
    })
  );

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjectById(id: string): Promise<Project> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/projects/${id}`);
  const payload = asRecord(unwrapApiData<unknown>(data));
  const nestedProject = asRecord(firstDefined(payload.project, payload));

  const nestedTeamIds = extractList(firstDefined(payload.teams, payload.projectTeams))
    .map((team) => getId(firstDefined(asRecord(team).teamId, asRecord(team).id)))
    .filter(Boolean);

  const teamIds = nestedTeamIds.length > 0 ? nestedTeamIds : await getProjectTeams(id);
  return normalizeProject(nestedProject, teamIds);
}

export async function createProject(values: ProjectFormValues): Promise<Project> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    "/api/tenant/projects",
    toProjectPayload(values, true)
  );
  const created = unwrapApiData<unknown>(data);
  const projectId = getId(firstDefined(asRecord(created).id, asRecord(created).projectId));
  if (!projectId) throw new Error("Project creation succeeded but did not return an id.");

  await syncProjectTeams(projectId, values.teamIds);
  return getProjectById(projectId);
}

export async function updateProject(id: string, values: ProjectFormValues): Promise<Project> {
  await apiClient.put(`/api/tenant/projects/${id}`, toProjectPayload(values, false));
  await syncProjectTeams(id, values.teamIds);
  return getProjectById(id);
}

export async function deleteProject(id: string): Promise<void> {
  void id;
  throw new Error("Project deletion is not supported by the current backend API.");
}
