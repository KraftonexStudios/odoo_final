import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetAttachmentsByTask,
  onCreateAttachment,
  onDeleteAttachment,
} from "@/actions/attachment.action";
import { toast } from "sonner";

export const useAttachments = (taskId: number) => {
  return useQuery({
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const result = await onGetAttachmentsByTask(taskId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data || [];
    },
    enabled: !!taskId,
  });
};

export const useCreateAttachment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof onCreateAttachment>[0]) => onCreateAttachment(input),
    onSuccess: (data) => {
      if (data.status === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to upload attachment");
    },
  });
};

export const useDeleteAttachment = (taskId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => onDeleteAttachment(id),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      } else {
        toast.error(data.message);
      }
    },
    onError: () => {
      toast.error("Failed to delete attachment");
    },
  });
};

