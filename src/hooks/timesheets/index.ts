import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onGetTimesheetsByProject,
  onGetTimesheetsByTask,
  onGetMyTimesheets,
  onCreateTimesheet,
  onUpdateTimesheet,
  onDeleteTimesheet,
  onApproveTimesheet,
  onRejectTimesheet,
  onGetPendingTimesheets,
} from "@/actions/timesheet.action";
import { toast } from "sonner";

export const useTimesheetsByProject = (projectId: number) => {
  return useQuery({
    queryKey: ["timesheets", "project", projectId],
    queryFn: async () => {
      const result = await onGetTimesheetsByProject(projectId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data;
    },
  });
};

export const useTimesheetsByTask = (taskId: number) => {
  return useQuery({
    queryKey: ["timesheets", "task", taskId],
    queryFn: async () => {
      const result = await onGetTimesheetsByTask(taskId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data;
    },
  });
};

export const useMyTimesheets = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ["timesheets", "my", startDate, endDate],
    queryFn: async () => {
      const result = await onGetMyTimesheets(startDate, endDate);
      if (result.status !== 200) throw new Error(result.message);
      return result.data;
    },
  });
};

export const useCreateTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onCreateTimesheet,
    onSuccess: (data) => {
      if (data.status === 201) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["timesheets"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useUpdateTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => onUpdateTimesheet(id, data),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useDeleteTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onDeleteTimesheet,
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["timesheets"] });
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useApproveTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: onApproveTimesheet,
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const useRejectTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => onRejectTimesheet(id, reason),
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      } else {
        toast.error(data.message);
      }
    },
  });
};

export const usePendingTimesheets = (projectId?: number) => {
  return useQuery({
    queryKey: ["timesheets", "pending", projectId],
    queryFn: async () => {
      const result = await onGetPendingTimesheets(projectId);
      if (result.status !== 200) throw new Error(result.message);
      return result.data;
    },
  });
};

