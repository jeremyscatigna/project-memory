import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, RefreshCw, Search } from "lucide-react";
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
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/admin/organizations")({
  component: AdminOrganizationsPage,
});

function AdminOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isPending, refetch } = useQuery(
    trpc.admin.listOrganizations.queryOptions({
      limit: 50,
      search: searchQuery || undefined,
    })
  );

  const organizations = data?.organizations ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage all organizations in the system
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search organizations..."
            value={searchQuery}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
          <CardDescription>
            {data?.total ?? 0} organization{(data?.total ?? 0) !== 1 ? "s" : ""}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div className="h-16 animate-pulse rounded bg-muted" key={i} />
              ))}
            </div>
          ) : organizations.length === 0 ? (
            <div className="py-8 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">No organizations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div
                  className="flex items-center justify-between border-b py-2 last:border-0"
                  key={org.id}
                >
                  <div className="flex items-center gap-4">
                    {org.logo ? (
                      <img
                        alt={org.name}
                        className="h-10 w-10 rounded-lg"
                        height={40}
                        src={org.logo}
                        width={40}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <span className="font-bold text-muted-foreground">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{org.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {org.slug} - {org.memberCount} member
                        {org.memberCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        org.plan === "enterprise"
                          ? "default"
                          : org.plan === "pro"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {org.plan}
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </span>
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
