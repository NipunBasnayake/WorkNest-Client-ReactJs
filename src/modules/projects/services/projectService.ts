import { tokenStorage } from "@/services/http/client";
import type { Project, ProjectFormValues } from "@/modules/projects/types";

const STORAGE_ROOT = "wn_mock_projects";
const LATENCY_MS = 240;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `project_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function seedProjects(): Project[] {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(today.getMonth() + 1);
  const nowIso = new Date().toISOString();

  return [
    {
      id: randomId(),
      name: "Workspace Onboarding Revamp",
      description: "Improve the onboarding journey for newly registered workspace admins.",
      status: "active",
      startDate: today.toISOString().slice(0, 10),
      endDate: nextMonth.toISOString().slice(0, 10),
      progress: 42,
      teamIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: randomId(),
      name: "Performance Monitoring Toolkit",
      description: "Define baseline metrics and reporting for tenant workforce analytics.",
      status: "planned",
      startDate: today.toISOString().slice(0, 10),
      endDate: "",
      progress: 0,
      teamIds: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
}

function readProjects(): Project[] {
  const key = storageKey();
  const raw = localStorage.getItem(key);
  if (!raw) {
    const seeded = seedProjects();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjects(data: Project[]) {
  localStorage.setItem(storageKey(), JSON.stringify(data));
}

export async function getProjects(): Promise<Project[]> {
  await sleep(LATENCY_MS);
  return readProjects().sort((a, b) => a.name.localeCompare(b.name));
}

export async function getProjectById(id: string): Promise<Project> {
  await sleep(LATENCY_MS);
  const project = readProjects().find((item) => item.id === id);
  if (!project) throw new Error("Project not found");
  return project;
}

export async function createProject(values: ProjectFormValues): Promise<Project> {
  await sleep(LATENCY_MS);
  const now = new Date().toISOString();
  const project: Project = {
    id: randomId(),
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    status: values.status,
    startDate: values.startDate,
    endDate: values.endDate || undefined,
    progress: Number(values.progress) || 0,
    teamIds: values.teamIds,
    createdAt: now,
    updatedAt: now,
  };

  const next = [project, ...readProjects()];
  writeProjects(next);
  return project;
}

export async function updateProject(id: string, values: ProjectFormValues): Promise<Project> {
  await sleep(LATENCY_MS);
  const projects = readProjects();
  const idx = projects.findIndex((item) => item.id === id);
  if (idx === -1) throw new Error("Project not found");

  const updated: Project = {
    ...projects[idx],
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    status: values.status,
    startDate: values.startDate,
    endDate: values.endDate || undefined,
    progress: Number(values.progress) || 0,
    teamIds: values.teamIds,
    updatedAt: new Date().toISOString(),
  };

  projects[idx] = updated;
  writeProjects(projects);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  await sleep(LATENCY_MS);
  writeProjects(readProjects().filter((item) => item.id !== id));
}
