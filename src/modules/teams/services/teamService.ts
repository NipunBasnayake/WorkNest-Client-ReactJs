import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getId, getString, toIsoDateTime } from "@/services/http/parsers";
import type { Team, TeamFormValues } from "@/modules/teams/types";
import type { ApiResponse } from "@/types";

function normalizeTeam(input: unknown, memberIds: string[] = []): Team {
  const value = asRecord(input);
  const statusRaw = getString(value.status)?.toLowerCase();

  return {
    id: getId(firstDefined(value.id, value.teamId)),
    name: firstDefined(getString(value.name), getString(value.teamName)) ?? "Team",
    description: firstDefined(getString(value.description), getString(value.summary)),
    managerName: firstDefined(
      getString(value.managerName),
      getString(asRecord(value.manager).fullName),
      getString(asRecord(value.manager).name)
    ) ?? "Unassigned",
    managerEmployeeId: firstDefined(
      getString(value.managerEmployeeId),
      getString(value.managerId),
      getString(asRecord(value.manager).id)
    ),
    memberIds,
    status:
      statusRaw === "archived" ? "archived" :
      statusRaw === "planning" ? "planning" :
      "active",
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
}

async function listTeamMembers(teamId: string): Promise<string[]> {
  try {
    const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
      `/api/tenant/teams/${teamId}/members`
    );
    const members = extractList(unwrapApiData<unknown>(data));
    return members
      .map((item) => {
        const value = asRecord(item);
        return getId(
          firstDefined(
            value.id,
            value.employeeId,
            asRecord(value.employee).id
          )
        );
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function addMember(teamId: string, employeeId: string): Promise<void> {
  await apiClient.post(`/api/tenant/teams/${teamId}/members`, { employeeId });
}

async function removeMember(teamId: string, employeeId: string): Promise<void> {
  await apiClient.delete(`/api/tenant/teams/${teamId}/members/${employeeId}`);
}

async function syncTeamMembers(teamId: string, expectedMembers: string[]) {
  const existing = await listTeamMembers(teamId);
  const expectedSet = new Set(expectedMembers.filter(Boolean));
  const existingSet = new Set(existing.filter(Boolean));

  const toAdd = [...expectedSet].filter((memberId) => !existingSet.has(memberId));
  const toRemove = [...existingSet].filter((memberId) => !expectedSet.has(memberId));

  await Promise.all([
    ...toAdd.map((memberId) => addMember(teamId, memberId)),
    ...toRemove.map((memberId) => removeMember(teamId, memberId)),
  ]);
}

export async function getTeams(): Promise<Team[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/teams");
  const list = extractList(unwrapApiData<unknown>(data));

  const withMembers = await Promise.all(
    list.map(async (item) => {
      const teamId = getId(firstDefined(asRecord(item).id, asRecord(item).teamId));
      const memberIds = teamId ? await listTeamMembers(teamId) : [];
      return normalizeTeam(item, memberIds);
    })
  );

  return withMembers.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTeamById(id: string): Promise<Team> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/teams/${id}`);
  const payload = asRecord(unwrapApiData<unknown>(data));
  const nestedTeam = asRecord(firstDefined(payload.team, payload));

  const nestedMemberIds = extractList(firstDefined(payload.members, payload.memberList))
    .map((item) => {
      const value = asRecord(item);
      return getId(firstDefined(value.employeeId, asRecord(value.employee).id, value.id));
    })
    .filter(Boolean);

  const memberIds = nestedMemberIds.length > 0 ? nestedMemberIds : await listTeamMembers(id);
  return normalizeTeam(nestedTeam, memberIds);
}

export async function createTeam(values: TeamFormValues): Promise<Team> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>("/api/tenant/teams", {
    name: values.name.trim(),
    managerId: values.managerEmployeeId || undefined,
  });

  const created = unwrapApiData<unknown>(data);
  const teamId = getId(firstDefined(asRecord(created).id, asRecord(created).teamId));
  if (!teamId) throw new Error("Team creation succeeded but did not return an id.");

  await syncTeamMembers(teamId, values.memberIds);
  return getTeamById(teamId);
}

export async function updateTeam(id: string, values: TeamFormValues): Promise<Team> {
  await apiClient.put(`/api/tenant/teams/${id}`, {
    name: values.name.trim(),
    managerId: values.managerEmployeeId || undefined,
  });

  await syncTeamMembers(id, values.memberIds);
  return getTeamById(id);
}

export async function deleteTeam(id: string): Promise<void> {
  void id;
  throw new Error("Team deletion is not supported by the current backend API.");
}
