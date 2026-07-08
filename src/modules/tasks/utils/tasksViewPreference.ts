export type TasksViewMode = "board" | "list";

const TASKS_VIEW_STORAGE_KEY = "worknest.tasks.view";

export function resolveTasksViewFromQuery(query: string | null | undefined): TasksViewMode {
  return query === "list" ? "list" : "board";
}

export function readTasksViewPreference(): TasksViewMode {
  if (typeof window === "undefined") return "board";
  try {
    const stored = window.localStorage.getItem(TASKS_VIEW_STORAGE_KEY);
    return resolveTasksViewFromQuery(stored);
  } catch {
    return "board";
  }
}

export function persistTasksViewPreference(view: TasksViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TASKS_VIEW_STORAGE_KEY, view);
  } catch {
    // Ignore blocked storage; the current in-memory view remains usable.
  }
}
