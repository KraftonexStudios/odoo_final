"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import type { NotificationDto } from "@/actions/notification.action";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    let mounted = true;

    // Only connect if API_URL is set
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      // Socket.IO not configured - will use polling via TanStack Query instead
      return;
    }

    (async () => {
      try {
        const token = await getToken();
        if (!token || !mounted) return;

        const socket = io(apiUrl, {
          auth: { token },
          transports: ["websocket", "polling"],
        });

        socket.on("connect", () => {
          console.log("Socket.IO connected for notifications");
        });

        socket.on("disconnect", () => {
          console.log("Socket.IO disconnected");
        });

        socket.on("notification", (notification: NotificationDto) => {
          if (!mounted) return;
          setNotifications((prev) => [notification, ...prev]);

          // Invalidate queries to refetch notifications
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });

          // Browser notification permission
          if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
          }

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/favicon.ico",
            });
          }
        });

        socketRef.current = socket;
      } catch (error) {
        console.error("Failed to connect Socket.IO:", error);
      }
    })();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [getToken, queryClient]);

  const markReadViaSocket = (notificationId: number) => {
    if (socketRef.current) {
      socketRef.current.emit("notification:read", { notificationId });
    }
  };

  return { notifications, markReadViaSocket };
}

