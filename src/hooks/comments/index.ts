import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetCommentsByTask,
  onCreateComment,
  onUpdateComment,
  onDeleteComment,
} from "@/actions/comment.action";
import { toast } from "sonner";

export const useCommentsByTask = (taskId: number) => {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const result = await onGetCommentsByTask(taskId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data;
    },
  });
};

export const useCreateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: number; content: string }) =>
      onCreateComment(taskId, content),
    onSuccess: (data) => {
      if (data.status === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useUpdateComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) =>
      onUpdateComment(id, content),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onDeleteComment,
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["comments"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

