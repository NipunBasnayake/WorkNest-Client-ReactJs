import { tokenStorage } from "@/services/http/client";
import { createNotification } from "@/modules/notifications/services/notificationService";
import type { Task, TaskPayload, TaskStatus } from "@/modules/tasks/types";

const STORAGE_ROOT = "wn_mock_tasks";
const LATENCY_MS = 220;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `task_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey() {
  const tenantKey = tokenStorage.getTenantKey() ?? "default";
  return `${STORAGE_ROOT}_${tenantKey}`;
}

function seedTasks(): Task[] {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const now = new Date().toISOString();

  return [
    {
      id: randomId(),
      title: "Finalize onboarding checklist",
      description: "Review policy docs and publish final checklist for new employees.",
      status: "TODO",
      priority: "HIGH",
      dueDate: tomorrow.toISOString().slice(0, 10),
      assigneeId: "",
      assigneeName: "",
      projectId: "",
      projectName: "Workspace Onboarding Revamp",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomId(),
      title: "Implement tenant analytics widget",
      description: "Build summary metrics card in the tenant dashboard.",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      dueDate: nextWeek.toISOString().slice(0, 10),
      assigneeId: "",
      assigneeName: "",
      projectId: "",
      projectName: "Performance Monitoring Toolkit",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomId(),
      title: "QA verify employee edit flow",
      description: "Validate salary, department, and status update behavior.",
      status: "REVIEW",
      priority: "LOW",
      dueDate: nextWeek.toISOString().slice(0, 10),
      assigneeId: "",
      assigneeName: "",
      projectId: "",
      projectName: "",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readTasks(): Task[] {
  const key = storageKey();
  const raw = localStorage.getItem(key);

  if (!raw) {
    const seeded = seedTasks();
    localStorage.setItem(key, JSON.stringify(seeded));
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTasks(tasks: Task[]) {
  localStorage.setItem(storageKey(), JSON.stringify(tasks));
}

async function notifyTaskEvent(title: string, message: string, link?: string) {
  try {
    await createNotification({
      type: "TASK_STATUS",
      title,
      message,
      link,
    });
  } catch {
    // Notification updates should not block task mutations.
  }
}

function sortTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const byDueDate = a.dueDate.localeCompare(b.dueDate);
    if (byDueDate !== 0) return byDueDate;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export async function getTasks(): Promise<Task[]> {
  await sleep(LATENCY_MS);
  return sortTasks(readTasks());
}

export async function getTaskById(id: string): Promise<Task> {
  await sleep(LATENCY_MS);
  const task = readTasks().find((item) => item.id === id);
  if (!task) throw new Error("Task not found");
  return task;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  await sleep(LATENCY_MS);
  const now = new Date().toISOString();

  const task: Task = {
    id: randomId(),
    title: payload.title.trim(),
    description: payload.description.trim() || undefined,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate,
    assigneeId: payload.assigneeId || undefined,
    assigneeName: payload.assigneeName || undefined,
    projectId: payload.projectId || undefined,
    projectName: payload.projectName || undefined,
    createdAt: now,
    updatedAt: now,
  };

  const next = [task, ...readTasks()];
  writeTasks(next);

  await notifyTaskEvent("New task created", task.title, `/app/tasks/${task.id}`);
  return task;
}

export async function updateTask(id: string, payload: TaskPayload): Promise<Task> {
  await sleep(LATENCY_MS);

  const tasks = readTasks();
  const index = tasks.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Task not found");

  const next: Task = {
    ...tasks[index],
    title: payload.title.trim(),
    description: payload.description.trim() || undefined,
    status: payload.status,
    priority: payload.priority,
    dueDate: payload.dueDate,
    assigneeId: payload.assigneeId || undefined,
    assigneeName: payload.assigneeName || undefined,
    projectId: payload.projectId || undefined,
    projectName: payload.projectName || undefined,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = next;
  writeTasks(tasks);

  await notifyTaskEvent("Task updated", next.title, `/app/tasks/${next.id}`);
  return next;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  await sleep(LATENCY_MS);

  const tasks = readTasks();
  const index = tasks.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("Task not found");

  const next: Task = {
    ...tasks[index],
    status,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = next;
  writeTasks(tasks);

  await notifyTaskEvent("Task status changed", `${next.title} is now ${status.replace("_", " ").toLowerCase()}.`, `/app/tasks/${next.id}`);
  return next;
}

export async function deleteTask(id: string): Promise<void> {
  await sleep(LATENCY_MS);

  const tasks = readTasks();
  const target = tasks.find((item) => item.id === id);
  writeTasks(tasks.filter((item) => item.id !== id));

  if (target) {
    await notifyTaskEvent("Task removed", `${target.title} was deleted.`, "/app/tasks");
  }
}
