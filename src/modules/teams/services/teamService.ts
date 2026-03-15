import { tokenStorage } from "@/services/http/client";
import type { Team, TeamFormValues } from "@/modules/teams/types";

const STORAGE_ROOT = "wn_mock_teams";
const LATENCY_MS = 220;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getScopedStorageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `team_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function seedTeams(): Team[] {
  const now = new Date().toISOString();
  return [
    {
      id: randomId(),
      name: "Product Engineering",
      description: "Owns product architecture and feature delivery.",
      managerName: "Asha Fernando",
      managerEmployeeId: "",
      memberIds: [],
      status: "active",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomId(),
      name: "Operations Excellence",
      description: "Handles process optimization and workspace operations.",
      managerName: "Nimal Silva",
      managerEmployeeId: "",
      memberIds: [],
      status: "planning",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readTeams(): Team[] {
  const key = getScopedStorageKey();
  const raw = localStorage.getItem(key);
  if (!raw) {
    const seeded = seedTeams();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Team[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTeams(data: Team[]) {
  localStorage.setItem(getScopedStorageKey(), JSON.stringify(data));
}

export async function getTeams(): Promise<Team[]> {
  await sleep(LATENCY_MS);
  const teams = readTeams().sort((a, b) => a.name.localeCompare(b.name));
  return teams;
}

export async function getTeamById(id: string): Promise<Team> {
  await sleep(LATENCY_MS);
  const team = readTeams().find((item) => item.id === id);
  if (!team) throw new Error("Team not found");
  return team;
}

export async function createTeam(values: TeamFormValues): Promise<Team> {
  await sleep(LATENCY_MS);
  const now = new Date().toISOString();
  const team: Team = {
    id: randomId(),
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    managerName: values.managerName.trim(),
    managerEmployeeId: values.managerEmployeeId || undefined,
    memberIds: values.memberIds,
    status: values.status,
    createdAt: now,
    updatedAt: now,
  };

  const next = [team, ...readTeams()];
  writeTeams(next);
  return team;
}

export async function updateTeam(id: string, values: TeamFormValues): Promise<Team> {
  await sleep(LATENCY_MS);
  const teams = readTeams();
  const index = teams.findIndex((item) => item.id === id);
  if (index === -1) throw new Error("Team not found");

  const updated: Team = {
    ...teams[index],
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    managerName: values.managerName.trim(),
    managerEmployeeId: values.managerEmployeeId || undefined,
    memberIds: values.memberIds,
    status: values.status,
    updatedAt: new Date().toISOString(),
  };

  teams[index] = updated;
  writeTeams(teams);
  return updated;
}

export async function deleteTeam(id: string): Promise<void> {
  await sleep(LATENCY_MS);
  const teams = readTeams().filter((item) => item.id !== id);
  writeTeams(teams);
}
