"use server";

import { client as prisma } from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { onAuthenticatedUser } from "@/actions/auth.action";
import { NotificationType } from "@prisma/client";

export type NotificationDto = {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
  metadata: any;
  projectId: number | null;
  taskId: number | null;
};

export interface CreateNotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  metadata?: any;
  projectId?: number;
  taskId?: number;
  userId?: number; // If not provided, will use authenticated user
}

// Create a notification
export async function onCreateNotification(payload: CreateNotificationPayload) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { success: false, error: "Unauthenticated" };
    }

    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId || user.id,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        metadata: payload.metadata || {},
        projectId: payload.projectId || null,
        taskId: payload.taskId || null,
      },
    });

    revalidatePath("/");
    return { success: true, notification };
  } catch (error) {
    console.error("[CREATE_NOTIFICATION]", error);
    return { success: false, error: "Failed to create notification" };
  }
}

// Get notifications with pagination and filters
export async function onGetNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { notifications: [], total: 0, page: 1, totalPages: 0 };
    }

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id,
    };

    if (typeof params?.isRead === "boolean") {
      where.isRead = params.isRead;
    }

    if (params?.type) {
      where.type = params.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
        readAt: n.readAt,
        metadata: n.metadata,
        projectId: n.projectId,
        taskId: n.taskId,
      })),
      total,
      page,
      totalPages,
    };
  } catch (error) {
    console.error("[GET_NOTIFICATIONS]", error);
    return { notifications: [], total: 0, page: 1, totalPages: 0 };
  }
}

// Get unread notification count
export async function onGetUnreadNotificationCount() {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { count: 0 };
    }

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return { count };
  } catch (error) {
    console.error("[GET_UNREAD_COUNT]", error);
    return { count: 0 };
  }
}

// Mark notification as read
export async function onMarkNotificationAsRead(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { success: false };
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== user.id) {
      return { success: false, error: "Notification not found" };
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[MARK_NOTIFICATION_READ]", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

// Mark all notifications as read
export async function onMarkAllNotificationsAsRead() {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { success: false };
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[MARK_ALL_READ]", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}

// Delete notification
export async function onDeleteNotification(id: number) {
  try {
    const user = await onAuthenticatedUser();
    if (user.status !== 200) {
      return { success: false };
    }

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== user.id) {
      return { success: false, error: "Notification not found" };
    }

    await prisma.notification.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_NOTIFICATION]", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

