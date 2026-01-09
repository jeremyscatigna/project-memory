import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/dashboard/email-accounts")({
  component: EmailAccountsPage,
});

type EmailAccountStatus =
  | "active"
  | "expired"
  | "revoked"
  | "syncing"
  | "error";
type EmailProvider = "gmail" | "outlook";

interface EmailAccount {
  id: string;
  provider: EmailProvider;
  email: string;
  displayName: string | null;
  status: EmailAccountStatus;
  isPrimary: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  messageCount: number;
  settings: {
    syncEnabled: boolean;
    syncFrequencyMinutes: number;
    backfillDays: number;
  };
  addedByUserId: string;
  createdAt: string;
}

function EmailAccountsPage() {
  const { data: activeOrg, isPending: orgLoading } =
    authClient.useActiveOrganization();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(
    null
  );

  // Check URL params for success/error messages
  const searchParams = new URLSearchParams(window.location.search);
  const success = searchParams.get("success");
  const error = searchParams.get("error");

  // Show toast based on URL params
  if (success === "true") {
    toast.success("Email account connected successfully!");
    // Clear params
    window.history.replaceState({}, "", window.location.pathname);
  } else if (error) {
    toast.error(`Failed to connect: ${error}`);
    window.history.replaceState({}, "", window.location.pathname);
  }

  // Fetch email accounts
  const {
    data: accounts,
    isLoading: accountsLoading,
    refetch: refetchAccounts,
  } = useQuery({
    ...trpc.emailAccounts.list.queryOptions({
      organizationId: activeOrg?.id ?? "",
    }),
    enabled: !!activeOrg?.id,
  });

  // Fetch available providers
  const { data: providers } = useQuery({
    ...trpc.emailAccounts.getAvailableProviders.queryOptions(),
    enabled: !!activeOrg?.id,
  });

  // Mutations
  const connectMutation = useMutation({
    ...trpc.emailAccounts.connect.mutationOptions(),
    onSuccess: (data) => {
      // Redirect to OAuth
      window.location.href = data.authorizationUrl;
    },
    onError: (error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });

  const disconnectMutation = useMutation({
    ...trpc.emailAccounts.disconnect.mutationOptions(),
    onSuccess: () => {
      toast.success("Account disconnected successfully");
      setDisconnectDialogOpen(false);
      setSelectedAccount(null);
      refetchAccounts();
    },
    onError: (error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const setPrimaryMutation = useMutation({
    ...trpc.emailAccounts.setPrimary.mutationOptions(),
    onSuccess: () => {
      toast.success("Primary account updated");
      refetchAccounts();
    },
    onError: (error) => {
      toast.error(`Failed to set primary: ${error.message}`);
    },
  });

  const updateSettingsMutation = useMutation({
    ...trpc.emailAccounts.updateSettings.mutationOptions(),
    onSuccess: () => {
      toast.success("Settings updated");
      setSettingsDialogOpen(false);
      setSelectedAccount(null);
      refetchAccounts();
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const handleConnect = (provider: EmailProvider) => {
    if (!activeOrg?.id) {
      return;
    }
    connectMutation.mutate({
      organizationId: activeOrg.id,
      provider,
    });
  };

  const handleDisconnect = () => {
    if (!(activeOrg?.id && selectedAccount)) {
      return;
    }
    disconnectMutation.mutate({
      organizationId: activeOrg.id,
      accountId: selectedAccount.id,
    });
  };

  const handleSetPrimary = (account: EmailAccount) => {
    if (!activeOrg?.id) {
      return;
    }
    setPrimaryMutation.mutate({
      organizationId: activeOrg.id,
      accountId: account.id,
    });
  };

  const handleUpdateSettings = (settings: {
    syncEnabled?: boolean;
    syncFrequencyMinutes?: number;
    backfillDays?: number;
  }) => {
    if (!(activeOrg?.id && selectedAccount)) {
      return;
    }
    updateSettingsMutation.mutate({
      organizationId: activeOrg.id,
      accountId: selectedAccount.id,
      settings,
    });
  };

  // Loading state
  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-48" key={i} />
          ))}
        </div>
      </div>
    );
  }

  // No org selected
  if (!activeOrg) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 font-semibold text-xl">No Organization Selected</h2>
        <p className="mt-2 text-muted-foreground">
          Create or select an organization to manage email accounts
        </p>
        <Link to="/onboarding/create-org">
          <Button className="mt-4">Create Organization</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Email Accounts</h1>
          <p className="text-muted-foreground">
            Connect and manage email accounts for your organization
          </p>
        </div>
        <Button onClick={() => setConnectDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </div>

      {/* Account grid */}
      {accountsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-48" key={i} />
          ))}
        </div>
      ) : accounts && accounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <EmailAccountCard
              account={account as unknown as EmailAccount}
              key={account.id}
              onDisconnect={() => {
                setSelectedAccount(account as unknown as EmailAccount);
                setDisconnectDialogOpen(true);
              }}
              onSetPrimary={() =>
                handleSetPrimary(account as unknown as EmailAccount)
              }
              onSettings={() => {
                setSelectedAccount(account as unknown as EmailAccount);
                setSettingsDialogOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center">
            <Mail className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-lg">
              No accounts connected
            </h3>
            <p className="mt-2 text-center text-muted-foreground">
              Connect your Gmail or Outlook account to get started with email
              intelligence
            </p>
            <Button className="mt-4" onClick={() => setConnectDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Your First Account
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connect Account Dialog */}
      <Dialog onOpenChange={setConnectDialogOpen} open={connectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Email Account</DialogTitle>
            <DialogDescription>
              Choose an email provider to connect to your organization
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Gmail */}
            <Button
              className="h-auto justify-start gap-4 p-4"
              disabled={
                !providers?.gmail.available || connectMutation.isPending
              }
              onClick={() => handleConnect("gmail")}
              variant="outline"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <Mail className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">Gmail</div>
                <div className="text-muted-foreground text-sm">
                  {providers?.gmail.available
                    ? "Connect your Google account"
                    : "Not configured"}
                </div>
              </div>
              {connectMutation.isPending && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
              )}
            </Button>

            {/* Outlook */}
            <Button
              className="h-auto justify-start gap-4 p-4"
              disabled={
                !providers?.outlook.available || connectMutation.isPending
              }
              onClick={() => handleConnect("outlook")}
              variant="outline"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">Outlook</div>
                <div className="text-muted-foreground text-sm">
                  {providers?.outlook.available
                    ? "Connect your Microsoft account"
                    : "Not configured"}
                </div>
              </div>
              {connectMutation.isPending && (
                <Loader2 className="ml-auto h-4 w-4 animate-spin" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      {selectedAccount && (
        <Dialog onOpenChange={setSettingsDialogOpen} open={settingsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Account Settings</DialogTitle>
              <DialogDescription>
                Configure sync settings for {selectedAccount.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Sync enabled */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sync Enabled</Label>
                  <p className="text-muted-foreground text-sm">
                    Automatically sync emails from this account
                  </p>
                </div>
                <Switch
                  checked={selectedAccount.settings.syncEnabled}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings({ syncEnabled: checked })
                  }
                />
              </div>

              {/* Sync frequency */}
              <div className="space-y-2">
                <Label>Sync Frequency</Label>
                <Select
                  defaultValue={selectedAccount.settings.syncFrequencyMinutes.toString()}
                  onValueChange={(value) =>
                    handleUpdateSettings({
                      syncFrequencyMinutes: Number.parseInt(value, 10),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Backfill days */}
              <div className="space-y-2">
                <Label>Historical Backfill</Label>
                <Select
                  defaultValue={selectedAccount.settings.backfillDays.toString()}
                  onValueChange={(value) =>
                    handleUpdateSettings({
                      backfillDays: Number.parseInt(value, 10),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="180">Last 6 months</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  How far back to sync historical emails
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog
        onOpenChange={setDisconnectDialogOpen}
        open={disconnectDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect {selectedAccount?.email}? This
              will stop syncing and revoke access. Existing synced data will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={disconnectMutation.isPending}
              onClick={handleDisconnect}
            >
              {disconnectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Email Account Card Component
function EmailAccountCard({
  account,
  onDisconnect,
  onSettings,
  onSetPrimary,
}: {
  account: EmailAccount;
  onDisconnect: () => void;
  onSettings: () => void;
  onSetPrimary: () => void;
}) {
  const statusConfig: Record<
    EmailAccountStatus,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    active: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: "text-green-600 dark:text-green-400",
      label: "Active",
    },
    syncing: {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      color: "text-blue-600 dark:text-blue-400",
      label: "Syncing",
    },
    expired: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-yellow-600 dark:text-yellow-400",
      label: "Expired",
    },
    revoked: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-600 dark:text-red-400",
      label: "Revoked",
    },
    error: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: "text-red-600 dark:text-red-400",
      label: "Error",
    },
  };

  const status = statusConfig[account.status];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              account.provider === "gmail"
                ? "bg-red-100 dark:bg-red-900"
                : "bg-blue-100 dark:bg-blue-900"
            )}
          >
            <Mail
              className={cn(
                "h-5 w-5",
                account.provider === "gmail"
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
              )}
            />
          </div>
          <div>
            <CardTitle className="text-base">
              {account.displayName || account.email}
            </CardTitle>
            <CardDescription className="text-xs">
              {account.email}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-8 w-8 p-0" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            {!account.isPrimary && (
              <DropdownMenuItem onClick={onSetPrimary}>
                <Zap className="mr-2 h-4 w-4" />
                Set as Primary
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={onDisconnect}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Status and Primary badge */}
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1", status.color)}>
              {status.icon}
              <span className="text-sm">{status.label}</span>
            </div>
            {account.isPrimary && <Badge variant="secondary">Primary</Badge>}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{account.messageCount.toLocaleString()} messages</span>
            </div>
            {account.lastSyncAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(account.lastSyncAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Warning for expired/error states */}
          {(account.status === "expired" || account.status === "error") && (
            <div className="rounded-md bg-yellow-50 p-2 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              {account.status === "expired"
                ? "Access expired. Please reconnect to resume syncing."
                : "An error occurred. Check settings or reconnect."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
