import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle,
  Info,
  Loader2,
  Settings,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, trpc } from "@/utils/trpc";

function getNotificationIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "system":
      return <Settings className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "just now";
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  }
  if (seconds < 86_400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  }
  if (seconds < 604_800) {
    return `${Math.floor(seconds / 86_400)}d ago`;
  }
  return date.toLocaleDateString();
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useQuery({
    ...trpc.notifications.unreadCount.queryOptions(),
    refetchInterval: 30_000, // Refetch every 30 seconds
  });

  const { data, isLoading } = useQuery({
    ...trpc.notifications.list.queryOptions({ limit: 10 }),
    enabled: open,
  });

  const invalidateNotifications = () => {
    queryClient.invalidateQueries({ queryKey: [["notifications", "list"]] });
    queryClient.invalidateQueries({
      queryKey: [["notifications", "unreadCount"]],
    });
  };

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

  const _deleteMutation = useMutation({
    ...trpc.notifications.delete.mutationOptions(),
    onSuccess: invalidateNotifications,
  });

  const unreadCount = unreadData?.count ?? 0;

  const handleNotificationClick = (
    id: string,
    read: boolean,
    link?: string | null
  ) => {
    if (!read) {
      markAsReadMutation.mutate({ id });
    }
    if (link) {
      setOpen(false);
    }
  };

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button className="relative" size="icon" variant="ghost">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              className="h-auto px-2 py-1 text-xs"
              disabled={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
              size="sm"
              variant="ghost"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 h-3 w-3" />
              )}
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.notifications && data.notifications.length > 0 ? (
            <DropdownMenuGroup>
              {data.notifications.map((notification) => (
                <DropdownMenuItem
                  asChild={!!notification.link}
                  className={`flex cursor-pointer flex-col items-start gap-1 p-3 ${
                    notification.read ? "" : "bg-muted/50"
                  }`}
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.read,
                      notification.link
                    )
                  }
                >
                  {notification.link ? (
                    <Link to={notification.link}>
                      <NotificationContent notification={notification} />
                    </Link>
                  ) : (
                    <div className="w-full">
                      <NotificationContent notification={notification} />
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            className="w-full justify-center text-sm"
            to="/dashboard/settings"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({
  notification,
}: {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date | string;
  };
}) {
  return (
    <>
      <div className="flex w-full items-start gap-2">
        {getNotificationIcon(notification.type)}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium text-sm">{notification.title}</p>
            {!notification.read && (
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
            )}
          </div>
          <p className="line-clamp-2 text-muted-foreground text-xs">
            {notification.message}
          </p>
        </div>
      </div>
      <p className="self-end text-muted-foreground text-xs">
        {formatTimeAgo(new Date(notification.createdAt))}
      </p>
    </>
  );
}

export default NotificationsDropdown;
