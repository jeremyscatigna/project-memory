import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw, Search, Shield } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/audit")({
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  // Fetch audit logs using admin router (no org filter)
  const { data, isPending, refetch } = useQuery(
    trpc.admin.listAuditLogs.queryOptions({
      limit: 50,
      level:
        levelFilter !== "all"
          ? (levelFilter as "info" | "warning" | "error" | "critical")
          : undefined,
    })
  );

  const auditLogs = data?.logs ?? [];

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case "error":
      case "critical":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            View system activity and security events
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            value={searchQuery}
          />
        </div>
        <Select
          onValueChange={(val) => val && setLevelFilter(val)}
          value={levelFilter}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {data?.total ?? 0} event{(data?.total ?? 0) !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div className="h-16 animate-pulse rounded bg-muted" key={i} />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-8 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="mt-2 text-muted-foreground text-sm">
                Audit logs will appear here as users perform actions in the
                system.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div
                  className="flex items-start justify-between border-b py-3 last:border-0"
                  key={log.id}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <Badge variant={getLevelBadgeVariant(log.level)}>
                        {log.level}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {log.resource}
                      {log.resourceId && ` (${log.resourceId})`}
                    </p>
                    {log.ipAddress && (
                      <p className="text-muted-foreground text-xs">
                        IP: {log.ipAddress}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                    {log.userId && (
                      <p className="text-muted-foreground text-xs">
                        User: {log.userId.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
