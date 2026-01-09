import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Plus, Settings, Sparkles, Users } from "lucide-react";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { OnboardingWidget } from "@/components/dashboard/onboarding-widget";
import { RecentActivityTable } from "@/components/dashboard/recent-activity-table";
import { SectionCards } from "@/components/dashboard/section-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const { session, customerState } = Route.useRouteContext() as {
    session: { data: { user: { name?: string; emailVerified?: boolean } } };
    customerState: { activeSubscriptions?: unknown[] } | null;
  };
  const { data: activeOrg } = authClient.useActiveOrganization();

  const privateData = useQuery(trpc.privateData.queryOptions());

  const hasProSubscription =
    (customerState?.activeSubscriptions?.length ?? 0) > 0;

  // Sample stats - in production these would come from API
  const stats = {
    totalUsers: 12_847,
    usersThisMonth: 1243,
    conversionRate: 24.5,
    revenue: 84_320,
    activeUsers: 342,
  };

  const quickActions = [
    {
      title: "Create Item",
      description: "Add a new item to your workspace",
      icon: Plus,
      onClick: () => navigate({ to: "/dashboard" }),
    },
    {
      title: "AI Assistant",
      description: "Chat with AI",
      icon: Sparkles,
      onClick: () => navigate({ to: "/ai" }),
    },
    {
      title: "View Analytics",
      description: "Track your performance",
      icon: BarChart3,
      onClick: () => navigate({ to: "/dashboard" }),
    },
    {
      title: "Team Members",
      description: "Manage your team",
      icon: Users,
      onClick: () => navigate({ to: "/dashboard/team" }),
    },
  ];

  // Onboarding steps
  const onboardingSteps = [
    {
      id: "verify-email",
      label: "Verify your email",
      completed: !!session.data?.user.emailVerified,
      action: () => navigate({ to: "/dashboard/settings" }),
      actionLabel: "Settings",
    },
    {
      id: "create-org",
      label: "Create an organization",
      completed: !!activeOrg,
      action: () => navigate({ to: "/onboarding/create-org" }),
      actionLabel: "Create",
    },
    {
      id: "upgrade",
      label: "Upgrade to Pro",
      completed: hasProSubscription,
      action: async () => {
        if ("checkout" in authClient) {
          await (
            authClient as unknown as {
              checkout: (opts: { slug: string }) => Promise<void>;
            }
          ).checkout({ slug: "pro" });
        }
      },
      actionLabel: "Upgrade",
    },
    {
      id: "invite-team",
      label: "Invite your first team member",
      completed: false,
      action: () => navigate({ to: "/dashboard/team" }),
      actionLabel: "Invite",
    },
    {
      id: "explore-ai",
      label: "Try the AI assistant",
      completed: false,
      action: () => navigate({ to: "/ai" }),
      actionLabel: "Try it",
    },
  ];

  return (
    <>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Welcome Header */}
          <div className="flex flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between lg:px-6">
            <div>
              <h1 className="font-bold text-2xl tracking-tight md:text-3xl">
                Welcome back,{" "}
                {session.data?.user.name?.split(" ")[0] || "there"}!
              </h1>
              <p className="text-muted-foreground">
                Here's an overview of your workspace.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </Button>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Item
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <SectionCards stats={stats} />

          {/* Chart */}
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>

          {/* Quick Actions */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks to help you get things done faster
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {quickActions.map((action) => (
                    <button
                      className="group flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
                      key={action.title}
                      onClick={action.onClick}
                      type="button"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10">
                        <action.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {action.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Table */}
          <RecentActivityTable />

          {/* Organization and System Status */}
          <div className="grid gap-4 px-4 md:grid-cols-2 lg:px-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Organization</CardTitle>
                    <CardDescription>Your current workspace</CardDescription>
                  </div>
                  {activeOrg && <Badge variant="secondary">Active</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {activeOrg ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Name
                      </span>
                      <span className="font-medium">{activeOrg.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Slug
                      </span>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {activeOrg.slug}
                      </code>
                    </div>
                    <Button
                      asChild
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      <Link to="/dashboard/team/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage Organization
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="mb-3 text-muted-foreground text-sm">
                      Create an organization to collaborate with your team.
                    </p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/onboarding/create-org">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>System Status</CardTitle>
                    <CardDescription>API and service health</CardDescription>
                  </div>
                  <Badge
                    className={
                      privateData.isLoading
                        ? ""
                        : "bg-emerald-600 hover:bg-emerald-600"
                    }
                    variant={privateData.isLoading ? "outline" : "default"}
                  >
                    {privateData.isLoading ? "Checking..." : "Operational"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      API Status
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          privateData.isLoading
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      {privateData.isLoading ? "Connecting..." : "Connected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Response
                    </span>
                    <span className="font-mono text-xs">
                      {privateData.data?.message ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Plan</span>
                    <Badge variant="secondary">
                      {hasProSubscription ? "Pro" : "Free"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating Onboarding Widget */}
      <OnboardingWidget steps={onboardingSteps} />
    </>
  );
}
