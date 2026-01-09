import { createFileRoute } from "@tanstack/react-router";
import { Activity, Building2, Shield, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  // In a real app, these would come from API calls
  const stats = {
    totalUsers: 0,
    activeUsers: 0,
    totalOrganizations: 0,
    recentActivity: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and administration tools
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalUsers}</div>
            <p className="text-muted-foreground text-xs">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.activeUsers}</div>
            <p className="text-muted-foreground text-xs">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.totalOrganizations}</div>
            <p className="text-muted-foreground text-xs">Total organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Recent Activity
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.recentActivity}</div>
            <p className="text-muted-foreground text-xs">Audit events today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Overview of system status and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span>Database</span>
                <span className="text-green-500">Healthy</span>
              </li>
              <li className="flex items-center justify-between">
                <span>API</span>
                <span className="text-green-500">Operational</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Background Jobs</span>
                <span className="text-green-500">Running</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Email Service</span>
                <span className="text-green-500">Connected</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>Latest administrative actions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="py-8 text-center text-muted-foreground text-sm">
              No recent actions
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
