"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { X, Check } from "lucide-react";
import type { NotificationDto } from "@/actions/notification.action";
import { useMarkNotificationAsRead, useDeleteNotification } from "@/hooks/notifications/use-notification-queries";
import { getAvatarGradient, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: NotificationDto;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "TASK_ASSIGNED":
    case "TASK_STATUS_CHANGED":
    case "TASK_DUE_SOON":
    case "TASK_OVERDUE":
      return "📋";
    case "PROJECT_ASSIGNED":
    case "PROJECT_STATUS_CHANGED":
      return "📁";
    case "TIMESHEET_APPROVED":
    case "TIMESHEET_REJECTED":
      return "⏰";
    case "EXPENSE_APPROVED":
    case "EXPENSE_REJECTED":
      return "💰";
    case "INVOICE_CREATED":
    case "INVOICE_PAID":
      return "🧾";
    case "COMMENT_ADDED":
      return "💬";
    case "MILESTONE_COMPLETED":
      return "🎯";
    case "SYSTEM_ALERT":
      return "🔔";
    default:
      return "📢";
  }
};

const getNotificationBadgeVariant = (type: string) => {
  if (type.includes("APPROVED") || type === "INVOICE_PAID" || type === "MILESTONE_COMPLETED") {
    return "default";
  }
  if (type.includes("REJECTED") || type === "TASK_OVERDUE") {
    return "destructive";
  }
  if (type.includes("DUE_SOON")) {
    return "secondary";
  }
  return "outline";
};

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { mutate: markAsRead, isPending: markingRead } = useMarkNotificationAsRead();
  const { mutate: deleteNotification, isPending: deleting } = useDeleteNotification();

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleDelete = () => {
    deleteNotification(notification.id);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
  const gradient = getAvatarGradient(notification.type);

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors rounded-lg relative cursor-pointer",
        !notification.isRead && "bg-muted/30"
      )}
      onClick={handleMarkAsRead}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className={cn(gradient, "text-white font-semibold")}>
          {getNotificationIcon(notification.type)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-semibold text-foreground">{notification.title}</p>
              <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                {notification.type.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{notification.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
          </div>

          {!notification.isRead && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {!notification.isRead && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              disabled={markingRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={deleting}
          >
            <X className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
