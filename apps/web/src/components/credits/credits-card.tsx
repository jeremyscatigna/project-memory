import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Coins, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export function CreditsCard() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const { data: creditStatus, isLoading } = useQuery({
    ...trpc.credits.getStatus.queryOptions(),
    refetchInterval: 60_000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="px-2 py-2">
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!creditStatus) {
    return null;
  }

  const {
    balance,
    isTrialActive,
    trialDaysRemaining,
    trialProgress,
    isLowBalance,
  } = creditStatus;

  // Collapsed view - just show icon with badge
  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            tooltip={`${balance} credits${isTrialActive ? ` (${trialDaysRemaining}d trial)` : ""}`}
          >
            <Link to="/dashboard/billing">
              <div className="relative">
                <Coins className="h-4 w-4" />
                {isLowBalance && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-yellow-500" />
                )}
              </div>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // Expanded view
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="mx-2 rounded-lg border bg-sidebar-accent/50 p-3">
          {/* Credits Balance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Credits</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "font-bold text-lg",
                  isLowBalance && "text-yellow-600 dark:text-yellow-500"
                )}
              >
                {balance.toLocaleString()}
              </span>
              {isLowBalance && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Trial Progress */}
          {isTrialActive && (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>Free Trial</span>
                </div>
                <span>{trialDaysRemaining} days left</span>
              </div>
              <Progress className="h-1.5" value={100 - trialProgress} />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex gap-2">
            <Button
              asChild
              className="h-7 flex-1 text-xs"
              size="sm"
              variant={isLowBalance ? "default" : "outline"}
            >
              <Link to="/dashboard/billing">
                <Zap className="mr-1 h-3 w-3" />
                {isLowBalance ? "Buy Credits" : "Manage"}
              </Link>
            </Button>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default CreditsCard;
