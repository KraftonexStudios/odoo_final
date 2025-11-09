"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  onFetchProjects,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
} from "@/actions/project.action";
import type { ProjectStatus, ProjectType } from "@prisma/client/index-browser";

// Type for serialized project data (with Decimal fields converted to numbers)
type SerializedProject = {
  id: number;
  name: string;
  description: string | null;
  code: string | null;
  type: ProjectType;
  status: ProjectStatus;
  priority: number;
  startDate: Date | null;
  endDate: Date | null;
  actualEndDate: Date | null;
  budgetAmount: number | null;
  budgetHours: number | null;
  estimatedCost: number | null;
  estimatedRevenue: number | null;
  progressPercentage: number;
  coverImage: string | null;
  taskCount?: number;
  completedTaskCount?: number;
  projectManager?: {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  projectManagerId: number;
};

export const PROJECTS_KEY = ["projects"] as const;

export function useProjects() {
  return useQuery<{ status: number; data?: SerializedProject[] }>({
    queryKey: PROJECTS_KEY,
    queryFn: () => onFetchProjects(),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onCreateProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: onUpdateProject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });
}

export function useUpdateProjectStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      newStatus,
      project,
    }: {
      projectId: number;
      newStatus: ProjectStatus;
      project: SerializedProject;
    }) => {
      return onUpdateProject({
        id: projectId,
        name: project.name,
        description: project.description,
        code: project.code,
        type: project.type,
        status: newStatus,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        budgetAmount: project.budgetAmount,
        budgetHours: project.budgetHours,
        estimatedCost: project.estimatedCost,
        estimatedRevenue: project.estimatedRevenue,
      });
    },
    // Optimistic update
    onMutate: async ({ projectId, newStatus }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: PROJECTS_KEY });

      // Snapshot the previous value
      const previousData = qc.getQueryData<{
        status: number;
        data?: SerializedProject[];
      }>(PROJECTS_KEY);

      // Optimistically update to the new value
      if (previousData?.data) {
        qc.setQueryData<{ status: number; data?: SerializedProject[] }>(PROJECTS_KEY, {
          ...previousData,
          data: previousData.data.map((p) =>
            p.id === projectId ? { ...p, status: newStatus } : p
          ),
        });
      }

      // Return context with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, variables, context) => {
      if (context?.previousData) {
        qc.setQueryData(PROJECTS_KEY, context.previousData);
      }
    },
    // Always refetch after error or success to ensure we have the latest data
    onSettled: () => {
      qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROJECTS_KEY });
      qc.invalidateQueries({ queryKey: ["admin-projects"] });
    },
  });
}

export { useGetProject } from "./useGetProject";
