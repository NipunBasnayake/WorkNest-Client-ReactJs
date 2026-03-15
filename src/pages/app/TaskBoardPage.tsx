import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { getTasks } from "@/modules/tasks/services/taskService";
import { KanbanColumn } from "@/modules/tasks/components/KanbanColumn";
import { TASK_STATUS_OPTIONS, type Task } from "@/modules/tasks/types";
import { PageHeader } from "@/components/common/PageHeader";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/common/Button";
import { EmptyState, ErrorBanner } from "@/components/common/AppUI";

const BOARD_LABELS: Record<typeof TASK_STATUS_OPTIONS[number], string> = {
  TODO: "Backlog",
  IN_PROGRESS: "In Progress",
  REVIEW: "In Review",
  COMPLETED: "Done",
  BLOCKED: "Blocked",
};

export function TaskBoardPage() {
  usePageMeta({ title: "Task Board", breadcrumb: ["Workspace", "Tasks", "Board"] });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch {
      setError("Unable to load board tasks.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((task) =>
      [task.title, task.description || "", task.assigneeName || "", task.projectName || ""]
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [search, tasks]);

  const grouped = useMemo(() => {
    return TASK_STATUS_OPTIONS.reduce<Record<typeof TASK_STATUS_OPTIONS[number], Task[]>>((acc, status) => {
      acc[status] = filtered.filter((task) => task.status === status);
      return acc;
    }, {
      TODO: [],
      IN_PROGRESS: [],
      REVIEW: [],
      COMPLETED: [],
      BLOCKED: [],
    });
  }, [filtered]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kanban Board"
        description="Visualize tasks by workflow stage and quickly spot bottlenecks."
        actions={(
          <Button variant="ghost" to="/app/tasks">
            <ArrowLeft size={16} />
            Back to List
          </Button>
        )}
      />

      <SectionCard>
        <div className="relative max-w-lg">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter cards by task, project, or assignee..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary-500/30"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-default)", color: "var(--text-primary)" }}
          />
        </div>
      </SectionCard>

      {error && <ErrorBanner message={error} onRetry={fetchTasks} />}

      {loading && (
        <SectionCard>
          <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "var(--bg-muted)" }} />
        </SectionCard>
      )}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          title={search ? "No matching board cards" : "No tasks available"}
          description={search ? "Adjust your search to see matching tasks." : "Create tasks to start using the Kanban board."}
          action={<Button variant="outline" to="/app/tasks/new">Create Task</Button>}
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            {TASK_STATUS_OPTIONS.map((status) => (
              <KanbanColumn key={status} status={status} title={BOARD_LABELS[status]} tasks={grouped[status]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
