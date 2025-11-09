import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetMilestonesByProject,
  onCreateMilestone,
  onUpdateMilestone,
  onDeleteMilestone,
} from "@/actions/milestone.action";
import { toast } from "sonner";

export const useMilestones = (projectId: number) => {
  return useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const result = await onGetMilestonesByProject(projectId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateMilestone = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof onCreateMilestone>[0]) => onCreateMilestone(input),
    onSuccess: (data) => {
      if (data.status === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to create milestone");
    },
  });
};

export const useUpdateMilestone = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number } & Parameters<typeof onUpdateMilestone>[1]) =>
      onUpdateMilestone(id, input),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to update milestone");
    },
  });
};

export const useDeleteMilestone = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeleteMilestone(id),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to delete milestone");
    },
  });
};

export const useCompleteMilestone = (projectId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { onCompleteMilestone } = await import("@/actions/milestone.action");
      return onCompleteMilestone(id);
    },
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to complete milestone");
    },
  });
};

