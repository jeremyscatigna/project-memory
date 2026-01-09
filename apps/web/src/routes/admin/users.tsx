import { createFileRoute } from "@tanstack/react-router";
import { Eye, MoreHorizontal, Search, UserCheck, UserX } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  banned: boolean;
  createdAt: string;
}

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setIsPending(true);
      try {
        const result = await authClient.admin.listUsers({
          query: { limit: 100 },
        });
        if (result.data?.users) {
          setUsers(result.data.users as User[]);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsPending(false);
      }
    };

    fetchUsers();
  }, []);

  const handleBanUser = async (userId: string) => {
    try {
      await authClient.admin.banUser({ userId });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, banned: true } : u))
      );
    } catch (error) {
      console.error("Failed to ban user:", error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await authClient.admin.unbanUser({ userId });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, banned: false } : u))
      );
    } catch (error) {
      console.error("Failed to unban user:", error);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      await authClient.admin.impersonateUser({ userId });
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Failed to impersonate user:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in the system
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            value={searchQuery}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div className="flex animate-pulse items-center gap-4" key={i}>
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No users found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const initials = user.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    className="flex items-center justify-between py-2"
                    key={user.id}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          alt={user.name ?? "User"}
                          src={user.image ?? undefined}
                        />
                        <AvatarFallback>{initials ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={user.role === "admin" ? "default" : "outline"}
                      >
                        {user.role}
                      </Badge>
                      {user.banned && (
                        <Badge variant="destructive">Banned</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleImpersonate(user.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Impersonate
                          </DropdownMenuItem>
                          {user.banned ? (
                            <DropdownMenuItem
                              onClick={() => handleUnbanUser(user.id)}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unban User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleBanUser(user.id)}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Ban User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
