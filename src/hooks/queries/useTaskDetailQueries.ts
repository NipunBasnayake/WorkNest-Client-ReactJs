import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addTaskComment,
  getTaskById,
  getTaskComments,
  updateTask,
  updateTaskAssignee,
  updateTaskDueDate,
  updateTaskPriority,
  updateTaskStatus,
  type TaskViewerIdentity,
  resolveTaskViewerIdentity,
} from "@/modules/tasks/services/taskService";
import type { TaskPayload, TaskPriority, TaskStatus } from "@/modules/tasks/types";
import { queryKeys } from "@/hooks/queries/queryKeys";

export function useTaskDetailQuery(taskId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskDetail(taskId),
    queryFn: () => {
      if (!taskId) {
        throw new Error("Task id is required.");
      }
      return getTaskById(taskId);
    },
    enabled: enabled && Boolean(taskId),
    staleTime: 30_000,
  });
}

export function useTaskCommentsQuery(taskId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.taskComments(taskId),
    queryFn: () => {
      if (!taskId) {
        throw new Error("Task id is required.");
      }
      return getTaskComments(taskId);
    },
    enabled: enabled && Boolean(taskId),
    staleTime: 15_000,
  });
}

export function useTaskViewerIdentityQuery(enabled: boolean) {
  return useQuery<TaskViewerIdentity>({
    queryKey: queryKeys.taskViewerIdentity(),
    queryFn: resolveTaskViewerIdentity,
    enabled,
    staleTime: 5 * 60_000,
  });
}

interface UseTaskMutationsOptions {
  taskId: string | undefined;
}

function invalidateTaskQueries(queryClient: ReturnType<typeof useQueryClient>, taskId: string | undefined) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
  if (taskId) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.taskDetail(taskId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.taskComments(taskId) });
  }
}

export function useTaskMutations({ taskId }: UseTaskMutationsOptions) {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (status: TaskStatus) => {
      if (!taskId) throw new Error("Task id is required.");
      return updateTaskStatus(taskId, status);
    },
    onSuccess: (task) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.taskDetail(taskId), task);
      invalidateTaskQueries(queryClient, taskId);
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (priority: TaskPriority) => {
      if (!taskId) throw new Error("Task id is required.");
      return updateTaskPriority(taskId, priority);
    },
    onSuccess: (task) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.taskDetail(taskId), task);
      invalidateTaskQueries(queryClient, taskId);
    },
  });

  const updateDueDateMutation = useMutation({
    mutationFn: (dueDate: string) => {
      if (!taskId) throw new Error("Task id is required.");
      return updateTaskDueDate(taskId, dueDate);
    },
    onSuccess: (task) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.taskDetail(taskId), task);
      invalidateTaskQueries(queryClient, taskId);
    },
  });

  const updateAssigneeMutation = useMutation({
    mutationFn: (assigneeId: string) => {
      if (!taskId) throw new Error("Task id is required.");
      return updateTaskAssignee(taskId, assigneeId);
    },
    onSuccess: (task) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.taskDetail(taskId), task);
      invalidateTaskQueries(queryClient, taskId);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: (payload: TaskPayload) => {
      if (!taskId) throw new Error("Task id is required.");
      return updateTask(taskId, payload);
    },
    onSuccess: (task) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.taskDetail(taskId), task);
      invalidateTaskQueries(queryClient, taskId);
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => {
      if (!taskId) throw new Error("Task id is required.");
      return addTaskComment(taskId, comment);
    },
    onSuccess: (comment) => {
      if (!taskId) return;
      queryClient.setQueryData(queryKeys.taskComments(taskId), (previous: unknown) => {
        if (!Array.isArray(previous)) return [comment];
        return [...previous, comment];
      });
      invalidateTaskQueries(queryClient, taskId);
    },
  });

  return {
    updateStatusMutation,
    updatePriorityMutation,
    updateDueDateMutation,
    updateAssigneeMutation,
    updateTaskMutation,
    addCommentMutation,
  };
}
