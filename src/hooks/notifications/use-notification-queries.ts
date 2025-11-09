"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  onGetNotifications,
  onGetUnreadNotificationCount,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDeleteNotification,
  type NotificationDto,
} from "@/actions/notification.action";
import { toast } from "sonner";

// Get notifications with filters
export function useNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const result = await onGetNotifications(params);
      return result;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

// Get unread count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const result = await onGetUnreadNotificationCount();
      return result.count;
    },
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await onMarkNotificationAsRead(id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast.success("Notification marked as read");
      } else {
        toast.error(result.error || "Failed to mark as read");
      }
    },
    onError: () => {
      toast.error("Failed to mark notification as read");
    },
  });
}

// Mark all as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return await onMarkAllNotificationsAsRead();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast.success("All notifications marked as read");
      } else {
        toast.error(result.error || "Failed to mark all as read");
      }
    },
    onError: () => {
      toast.error("Failed to mark all notifications as read");
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return await onDeleteNotification(id);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        toast.success("Notification deleted");
      } else {
        toast.error(result.error || "Failed to delete notification");
      }
    },
    onError: () => {
      toast.error("Failed to delete notification");
    },
  });
}

