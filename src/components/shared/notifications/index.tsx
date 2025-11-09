"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationItem } from "./notification-item";
import { useNotifications, useUnreadNotificationCount, useMarkAllNotificationsAsRead } from "@/hooks/notifications/use-notification-queries";
import { useNotifications as useRealtimeNotifications } from "@/hooks/notifications";
import { Skeleton } from "@/components/ui/skeleton";

export const NotificationsDialog = () => {
  const [open, setOpen] = useState(false);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { data: allNotificationsData, isLoading } = useNotifications({ page: 1, limit: 50 });
  const { data: unreadNotificationsData } = useNotifications({ page: 1, limit: 50, isRead: false });
  const { notifications: realtimeNotifications } = useRealtimeNotifications();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();

  const allNotifications = allNotificationsData?.notifications || [];
  const unreadNotifications = unreadNotificationsData?.notifications || [];

  // Real-time notifications will trigger a refetch via query invalidation
  // The hook handles adding them to the state, and queries will refetch

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 gap-0" align="end" side="bottom">
        <Tabs defaultValue="all" className="w-full">
          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <div className="px-6 py-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => markAllAsRead()}
              >
                Mark all as read ({unreadCount})
              </Button>
            </div>
          )}
          {/* Header with title and tabs in same line */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Notifications</h2>
            <TabsList className="h-9 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="px-4 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="px-4 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground"
              >
                Unread
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[480px]">
              <div className="px-2 py-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : allNotifications.length > 0 ? (
                  allNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No notifications
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[480px]">
              <div className="px-2 py-2">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </div>
                ) : unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    No unread notifications
                  </div>
                )}
              </div>
            </ScrollArea>
              </TabsContent>
            </Tabs>
          </PopoverContent>
        </Popover>
      );
    };
