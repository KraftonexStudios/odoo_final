import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  onFetchAllUsers,
  onUpdateUserRole,
  onUpdateUserHourlyRate,
  onFetchAllProjectsAdmin,
  onFetchAllTasksAdmin,
  onGetTaskDetailsAdmin,
  onFetchDashboardStats,
} from "@/actions/admin.action";
import { toast } from "sonner";

// ============================================
// USER MANAGEMENT HOOKS
// ============================================

type AdminUsersOptions = {
  enabled?: boolean;
};

export const useAdminUsers = (options?: AdminUsersOptions) => {
  return useQuery<any[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const result = await onFetchAllUsers();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data ?? [];
    },
    enabled: options?.enabled ?? true,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "ADMIN" | "PROJECT_MANAGER" | "TEAM_MEMBER" | "SALES_FINANCE";
    }) => {
      return await onUpdateUserRole(userId, role);
    },
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success("User role updated successfully");
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      } else {
        toast.error(data.message || "Failed to update user role");
      }
    },
    onError: () => {
      toast.error("Failed to update user role");
    },
  });
};

export const useUpdateUserHourlyRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      hourlyRate,
    }: {
      userId: string;
      hourlyRate: number;
    }) => {
      return await onUpdateUserHourlyRate(userId, hourlyRate);
    },
    onSuccess: (data) => {
      if (data.status === 200) {
        toast.success("Hourly rate updated successfully");
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      } else {
        toast.error(data.message || "Failed to update hourly rate");
      }
    },
    onError: () => {
      toast.error("Failed to update hourly rate");
    },
  });
};

// ============================================
// PROJECT MANAGEMENT HOOKS
// ============================================

export const useAdminProjects = () => {
  return useQuery<any[]>({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const result = await onFetchAllProjectsAdmin();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// ============================================
// TASK MANAGEMENT HOOKS
// ============================================

export const useAdminTasks = () => {
  return useQuery<any[]>({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      const result = await onFetchAllTasksAdmin();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data ?? [];
    },
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

export const useAdminTaskDetails = (taskId: string | null) => {
  return useQuery<any>({
    queryKey: ["admin-task-details", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const result = await onGetTaskDetailsAdmin(taskId);
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data ?? null;
    },
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

// ============================================
// DASHBOARD STATS HOOKS
// ============================================

export const useDashboardStats = () => {
  return useQuery<any>({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const result = await onFetchDashboardStats();
      if (result.status !== 200) {
        throw new Error(result.message);
      }
      return result.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};

