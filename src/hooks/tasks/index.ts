"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  onGetTasksByProject,
  onCreateTask,
  onUpdateTask,
  onUpdateTaskStatus,
  onDeleteTask,
} from "@/actions/task.action";
import type { Task, TaskStatus } from "@prisma/client/index-browser";

export function useTasks(projectId?: number) {
  return useQuery<{ status: number; data?: Task[] }>({
    queryKey: ["tasks", projectId],
    queryFn: () => (projectId ? onGetTasksByProject(projectId) : Promise.resolve({ status: 200, data: [] })),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onCreateTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

export function useUpdateTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onUpdateTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { id: number; status: TaskStatus }) => onUpdateTaskStatus(payload),
    onSuccess: (_res, variables) => {
      // Refetch tasks for the project
      const queries = qc.getQueryCache().findAll({ queryKey: ["tasks"] });
      queries.forEach((q) => qc.invalidateQueries({ queryKey: q.queryKey }));
    },
  });
}

export function useDeleteTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });
}