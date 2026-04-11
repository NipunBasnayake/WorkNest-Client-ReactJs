import { apiClient } from "@/services/http/client";
import { unwrapApiData } from "@/services/http/response";
import { asRecord, extractList, firstDefined, getBoolean, getId, getString, toIsoDateTime } from "@/services/http/parsers";
import type {
  Team,
  TeamFormValues,
  TeamMember,
  TeamMemberFunctionalRole,
  TeamStatus,
} from "@/modules/teams/types";
import type { ApiResponse } from "@/types";

function toUiStatus(status: unknown): TeamStatus {
  const normalized = getString(status)?.toUpperCase();
  if (normalized === "ARCHIVED") return "archived";
  if (normalized === "PLANNING") return "planning";
  return "active";
}

function normalizeFunctionalRole(role: unknown): TeamMemberFunctionalRole | undefined {
  const normalized = getString(role)?.toUpperCase().replace(/[\s-]+/g, "_");
  if (!normalized) return undefined;
  if (normalized === "TEAM_LEAD") return "TEAM_LEAD";
  if (normalized === "PROJECT_MANAGER") return "PROJECT_MANAGER";
  if (normalized === "QA_ENGINEER" || normalized === "QA") return "QA";
  if (normalized === "DEVELOPER" || normalized === "DEV") return "DEV";
  return undefined;
}

function toApiFunctionalRole(role: TeamMemberFunctionalRole | null): string | null {
  if (role === "DEV") return "DEVELOPER";
  if (role === "QA") return "QA_ENGINEER";
  return role;
}

function normalizeTeamMember(input: unknown): TeamMember | null {
  const value = asRecord(input);
  const employee = asRecord(value.employee);

  const employeeId = getId(
    firstDefined(
      value.employeeId,
      value.memberId,
      value.id,
      employee.id
    )
  );

  if (!employeeId) return null;

  return {
    employeeId,
    name: firstDefined(
      getString(value.employeeName),
      getString(value.name),
      getString(employee.fullName),
      getString(employee.name)
    ),
    email: firstDefined(
      getString(value.email),
      getString(employee.email)
    ),
    functionalRole: normalizeFunctionalRole(
      firstDefined(value.functionalRole, value.memberRole, value.teamRole, value.role)
    ),
    isManager: getBoolean(firstDefined(value.isManager, value.manager)),
  };
}

function dedupeMembers(members: TeamMember[]): TeamMember[] {
  const map = new Map<string, TeamMember>();

  for (const member of members) {
    if (!member.employeeId) continue;
    const existing = map.get(member.employeeId);
    if (!existing) {
      map.set(member.employeeId, member);
      continue;
    }

    map.set(member.employeeId, {
      employeeId: member.employeeId,
      name: existing.name ?? member.name,
      email: existing.email ?? member.email,
      functionalRole: existing.functionalRole ?? member.functionalRole,
      isManager: existing.isManager || member.isManager,
    });
  }

  return Array.from(map.values());
}

function normalizeTeam(input: unknown, members: TeamMember[] = []): Team {
  const value = asRecord(input);
  const managerEmployeeId = firstDefined(
    getString(value.managerEmployeeId),
    getString(value.managerId),
    getString(asRecord(value.manager).id)
  );
  const managerName = firstDefined(
    getString(value.managerName),
    getString(asRecord(value.manager).fullName),
    getString(asRecord(value.manager).name)
  ) ?? "Unassigned";

  let normalizedMembers = dedupeMembers(members).map((member) => {
    if (managerEmployeeId && member.employeeId === managerEmployeeId) {
      return {
        ...member,
        name: member.name ?? managerName,
        isManager: true,
      };
    }
    return member;
  });

  if (normalizedMembers.length === 0) {
    const nestedMemberIds = extractList(firstDefined(value.memberIds, value.members, value.memberList, value.teamMembers))
      .map((item) => {
        if (typeof item === "string") return item;
        const memberValue = asRecord(item);
        return getId(firstDefined(memberValue.employeeId, memberValue.memberId, memberValue.id, asRecord(memberValue.employee).id));
      })
      .filter(Boolean);

    normalizedMembers = nestedMemberIds.map((memberId) => ({
      employeeId: memberId,
      isManager: Boolean(managerEmployeeId && managerEmployeeId === memberId),
    }));
  }

  return {
    id: getId(firstDefined(value.id, value.teamId)),
    name: firstDefined(getString(value.name), getString(value.teamName)) ?? "Team",
    description: firstDefined(getString(value.description), getString(value.summary)),
    managerName,
    managerEmployeeId,
    members: normalizedMembers,
    memberIds: normalizedMembers.map((member) => member.employeeId),
    status: toUiStatus(firstDefined(value.status, value.teamStatus)),
    createdAt: toIsoDateTime(firstDefined(value.createdAt, value.createdDate)),
    updatedAt: toIsoDateTime(firstDefined(value.updatedAt, value.updatedDate, value.modifiedAt)),
  };
}

function normalizeTeamMembersPayload(payload: unknown): TeamMember[] {
  return dedupeMembers(
    extractList(payload)
      .map((item) => normalizeTeamMember(item))
      .filter((member): member is TeamMember => Boolean(member))
  );
}

async function listTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(
    `/api/tenant/teams/${teamId}/members`
  );
  return normalizeTeamMembersPayload(unwrapApiData<unknown>(data));
}

function hydrateTeams(list: unknown[]): Team[] {
  // Avoid per-team fallback calls (`/teams/:id/members`) to prevent N+1 list hydration.
  // Detailed team fetch still hydrates members if list payload is sparse.
  const normalized = list.map((item) => {
    const teamValue = asRecord(item);
    const nestedMembers = normalizeTeamMembersPayload(
      firstDefined(teamValue.members, teamValue.memberList, teamValue.teamMembers)
    );
    return normalizeTeam(item, nestedMembers);
  });

  return normalized.sort((a, b) => a.name.localeCompare(b.name));
}

function withManagerMembership(values: TeamFormValues): string[] {
  const members = new Set(values.memberIds.filter(Boolean));
  if (values.managerEmployeeId.trim()) {
    members.add(values.managerEmployeeId.trim());
  }
  return Array.from(members);
}

async function syncTeamMembers(teamId: string, expectedMembers: string[]) {
  const existing = await listTeamMembers(teamId);
  const expectedSet = new Set(expectedMembers.filter(Boolean));
  const existingSet = new Set(existing.map((member) => member.employeeId).filter(Boolean));

  const toAdd = [...expectedSet].filter((memberId) => !existingSet.has(memberId));
  const toRemove = [...existingSet].filter((memberId) => !expectedSet.has(memberId));

  await Promise.all([
    ...toAdd.map((memberId) => addTeamMember(teamId, memberId)),
    ...toRemove.map((memberId) => removeTeamMember(teamId, memberId)),
  ]);
}

function toPayload(values: TeamFormValues): Record<string, unknown> {
  const managerId = Number(values.managerEmployeeId);
  return {
    name: values.name.trim(),
    managerId: values.managerEmployeeId
      ? (Number.isNaN(managerId) ? values.managerEmployeeId : managerId)
      : undefined,
  };
}

function extractErrorMessage(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const error = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return error.response?.data?.message ?? error.message ?? null;
  }
  return null;
}

export async function addTeamMember(
  teamId: string,
  employeeId: string,
  functionalRole: TeamMemberFunctionalRole = "DEV"
): Promise<void> {
  const normalizedEmployeeId = Number(employeeId);
  await apiClient.post(`/api/tenant/teams/${teamId}/members`, {
    employeeId: Number.isNaN(normalizedEmployeeId) ? employeeId : normalizedEmployeeId,
    functionalRole: toApiFunctionalRole(functionalRole),
  });
}

export async function removeTeamMember(teamId: string, employeeId: string): Promise<void> {
  await apiClient.delete(`/api/tenant/teams/${teamId}/members/${employeeId}`);
}

export async function updateTeamMemberFunctionalRole(
  teamId: string,
  employeeId: string,
  functionalRole: TeamMemberFunctionalRole | null
): Promise<void> {
  const payload = { functionalRole: toApiFunctionalRole(functionalRole) };
  const normalizedEmployeeId = Number(employeeId);
  const employeePathId = Number.isNaN(normalizedEmployeeId) ? employeeId : String(normalizedEmployeeId);

  try {
    await apiClient.patch(`/api/tenant/teams/${teamId}/members/${employeePathId}/functional-role`, payload);
    return;
  } catch (err: unknown) {
    const message = extractErrorMessage(err) ?? "";
    const fallbackEligible = /404|405|not\s*found|method\s*not\s*allowed/i.test(message);

    if (!fallbackEligible) {
      throw new Error(
        message || "Functional role update is not supported by the current backend API."
      );
    }
  }

  try {
    await apiClient.patch(`/api/tenant/teams/${teamId}/members/${employeePathId}`, payload);
    return;
  } catch {
    // Try PUT fallback as a final compatibility path for legacy APIs.
  }

  try {
    await apiClient.put(`/api/tenant/teams/${teamId}/members/${employeePathId}`, payload);
  } catch (err: unknown) {
    throw new Error(
      extractErrorMessage(err) ??
        "Functional role update is not supported by the current backend API."
    );
  }
}

export async function getTeams(): Promise<Team[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/teams");
  const list = extractList(unwrapApiData<unknown>(data));
  return hydrateTeams(list);
}

export async function getMyTeams(): Promise<Team[]> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>("/api/tenant/teams/my");
  const list = extractList(unwrapApiData<unknown>(data));
  return hydrateTeams(list);
}

export async function getTeamById(id: string): Promise<Team> {
  const { data } = await apiClient.get<ApiResponse<unknown> | unknown>(`/api/tenant/teams/${id}`);
  const payload = asRecord(unwrapApiData<unknown>(data));
  const nestedTeam = asRecord(firstDefined(payload.team, payload));
  const nestedMembers = normalizeTeamMembersPayload(
    firstDefined(payload.members, payload.memberList, payload.teamMembers)
  );

  const members = nestedMembers.length > 0 ? nestedMembers : await listTeamMembers(id);
  return normalizeTeam(nestedTeam, members);
}

export async function createTeam(values: TeamFormValues): Promise<Team> {
  const { data } = await apiClient.post<ApiResponse<unknown> | unknown>(
    "/api/tenant/teams",
    toPayload(values)
  );

  const created = unwrapApiData<unknown>(data);
  const teamId = getId(firstDefined(asRecord(created).id, asRecord(created).teamId));
  if (!teamId) throw new Error("Team creation succeeded but did not return an id.");

  await syncTeamMembers(teamId, withManagerMembership(values));
  return getTeamById(teamId);
}

export async function updateTeam(id: string, values: TeamFormValues): Promise<Team> {
  await apiClient.put(`/api/tenant/teams/${id}`, toPayload(values));

  await syncTeamMembers(id, withManagerMembership(values));
  return getTeamById(id);
}

export async function deleteTeam(id: string): Promise<void> {
  await apiClient.delete(`/api/tenant/teams/${id}`);
}
