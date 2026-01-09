import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  CheckCircle,
  Filter,
  Info,
  Loader2,
  Settings,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/notifications")({
  component: NotificationsPage,
});

function getNotificationIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "system":
      return <Settings className="h-5 w-5 text-blue-500" />;
    default:
      return <Info className="h-5 w-5 text-muted-foreground" />;
  }
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) {
    return "just now";
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} minutes ago`;
  }
  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)} hours ago`;
  }
  if (seconds < 604_800) {
    return `${Math.floor(seconds / 86_400)} days ago`;
  }
  return d.toLocaleDateString();
}

function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: [["notifications", "list"]] });
    queryClient.invalidateQueries({
      queryKey: [["notifications", "unreadCount"]],
    });
  };

  const { data, isLoading } = useQuery(
    trpc.notifications.list.queryOptions({
      limit: 50,
      unreadOnly: filter === "unread",
    })
  );

  const { data: unreadData } = useQuery(
    trpc.notifications.unreadCount.queryOptions()
  );

  const markAsReadMutation = useMutation({
    ...trpc.notifications.markAsRead.mutationOptions(),
    onSuccess: invalidateNotifications,
  });

  const markAllAsReadMutation = useMutation({
    ...trpc.notifications.markAllAsRead.mutationOptions(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success("All notifications marked as read");
    },
  });

  const deleteMutation = useMutation({
    ...trpc.notifications.delete.mutationOptions(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success("Notification deleted");
    },
  });

  const deleteAllMutation = useMutation({
    ...trpc.notifications.deleteAll.mutationOptions(),
    onSuccess: () => {
      invalidateNotifications();
      toast.success("All notifications deleted");
    },
  });

  const notifications = data?.notifications ?? [];
  const unreadCount = unreadData?.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your account activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              disabled={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
              variant="outline"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} unread</Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value: "all" | "unread") => setFilter(value)}
                value={filter}
              >
                <SelectTrigger className="w-32">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>
              {notifications.length > 0 && (
                <Button
                  disabled={deleteAllMutation.isPending}
                  onClick={() => deleteAllMutation.mutate()}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            {filter === "unread"
              ? "Showing only unread notifications"
              : "Showing all notifications"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-muted-foreground text-sm">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "When you get notifications, they'll show up here"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                    notification.read
                      ? "hover:bg-muted/30"
                      : "border-primary/20 bg-muted/50"
                  }`}
                  key={notification.id}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`text-sm ${
                            notification.read ? "" : "font-medium"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="mt-1 text-muted-foreground text-sm">
                            {notification.message}
                          </p>
                        )}
                        <p className="mt-2 text-muted-foreground text-xs">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button
                            disabled={markAsReadMutation.isPending}
                            onClick={() =>
                              markAsReadMutation.mutate({ id: notification.id })
                            }
                            size="sm"
                            variant="ghost"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            deleteMutation.mutate({ id: notification.id })
                          }
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
