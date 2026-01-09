import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  showAdmin?: boolean;
}

export function AppShell({
  children,
  breadcrumbs = [],
  showAdmin = false,
}: AppShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar showAdmin={showAdmin} />
      <SidebarInset>
        <SiteHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// Export all layout components for easy importing
export { AppSidebar } from "./app-sidebar";
export { NavMain } from "./nav-main";
export { NavUser } from "./nav-user";
export { SiteHeader } from "./site-header";
export { TeamSwitcher } from "./team-switcher";
