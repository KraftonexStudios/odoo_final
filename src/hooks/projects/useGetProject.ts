"use client";
import { useQuery } from "@tanstack/react-query";
import { onGetProject } from "@/actions/project.action";
import type { Project } from "@prisma/client/index-browser";

export function useGetProject(projectId: number) {
  return useQuery<{ status: number; data?: Project }>({
    queryKey: ["project", projectId],
    queryFn: () => onGetProject(projectId),
    enabled: !!projectId,
  });
}

