import {
  Bell,
  Bot,
  CreditCard,
  FileText,
  Home,
  Settings,
  Shield,
  Users,
} from "lucide-react";

import { CreditsCard } from "@/components/credits/credits-card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { type NavItem, NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import { TeamSwitcher } from "./team-switcher";

// Main navigation items
const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "AI Chat",
    url: "/dashboard/ai",
    icon: Bot,
  },
  {
    title: "Notifications",
    url: "/dashboard/notifications",
    icon: Bell,
  },
];

// Team management items
const teamNavItems: NavItem[] = [
  {
    title: "Team",
    url: "/dashboard/team",
    icon: Users,
    items: [
      {
        title: "Members",
        url: "/dashboard/team/members",
      },
      {
        title: "Invitations",
        url: "/dashboard/team/invitations",
      },
      {
        title: "Settings",
        url: "/dashboard/team/settings",
      },
    ],
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

// Admin items (only shown to admins)
const adminNavItems: NavItem[] = [
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
    items: [
      {
        title: "Users",
        url: "/admin/users",
      },
      {
        title: "Organizations",
        url: "/admin/organizations",
      },
      {
        title: "Audit Logs",
        url: "/admin/audit",
      },
    ],
  },
  {
    title: "Audit Log",
    url: "/dashboard/audit-log",
    icon: FileText,
  },
];

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  showAdmin?: boolean;
}

export function AppSidebar({ showAdmin = false, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainNavItems} label="Platform" />
        <NavMain items={teamNavItems} label="Management" />
        {showAdmin && <NavMain items={adminNavItems} label="Administration" />}
      </SidebarContent>
      <SidebarFooter>
        <CreditsCard />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
