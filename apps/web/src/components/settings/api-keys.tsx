import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
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
  AlertDialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, trpc } from "@/utils/trpc";

const SCOPES = [
  {
    id: "read:data",
    label: "Read Data",
    description: "Read access to your data",
  },
  {
    id: "write:data",
    label: "Write Data",
    description: "Write access to your data",
  },
  {
    id: "read:analytics",
    label: "Read Analytics",
    description: "Access analytics and reports",
  },
  { id: "admin", label: "Admin", description: "Full administrative access" },
];

const EXPIRY_OPTIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
  { value: "never", label: "Never" },
];

function formatDate(date: Date | string | null) {
  if (!date) {
    return "Never";
  }
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatRelativeTime(date: Date | string | null) {
  if (!date) {
    return "Never used";
  }
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    return `${hours}h ago`;
  }
  if (days < 30) {
    return `${days}d ago`;
  }
  return formatDate(date);
}

function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) {
    return false;
  }
  return new Date(expiresAt) < new Date();
}

export function ApiKeys() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{
    key: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read:data"]);
  const [expiresIn, setExpiresIn] = useState("90");

  // Fetch API keys
  const { data: apiKeys, isLoading } = useQuery(
    trpc.apiKeys.list.queryOptions()
  );

  // Create key mutation
  const createKey = useMutation({
    ...trpc.apiKeys.create.mutationOptions(),
    onSuccess: (data) => {
      setNewKeyData({ key: data.key, name: data.name });
      setShowCreateDialog(false);
      setShowKeyDialog(true);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [["apiKeys", "list"]] });
      toast.success("API key created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete key mutation
  const deleteKey = useMutation({
    ...trpc.apiKeys.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["apiKeys", "list"]] });
      toast.success("API key deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Regenerate key mutation
  const regenerateKey = useMutation({
    ...trpc.apiKeys.regenerate.mutationOptions(),
    onSuccess: (data) => {
      setNewKeyData({ key: data.key, name: data.name });
      setShowKeyDialog(true);
      queryClient.invalidateQueries({ queryKey: [["apiKeys", "list"]] });
      toast.success("API key regenerated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setSelectedScopes(["read:data"]);
    setExpiresIn("90");
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    createKey.mutate({
      name: name.trim(),
      scopes: selectedScopes as (
        | "read:data"
        | "write:data"
        | "read:analytics"
        | "admin"
      )[],
      expiresInDays:
        expiresIn === "never" ? undefined : Number.parseInt(expiresIn, 10),
    });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : apiKeys?.length ? (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    isExpired(key.expiresAt)
                      ? "border-destructive/50 bg-destructive/5"
                      : ""
                  }`}
                  key={key.id}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.name}</span>
                      {isExpired(key.expiresAt) && (
                        <Badge className="gap-1" variant="destructive">
                          <AlertTriangle className="h-3 w-3" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {key.keyPrefix}...
                      </code>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last used: {formatRelativeTime(key.lastUsedAt)}
                      </span>
                      {key.expiresAt && (
                        <span>Expires: {formatDate(key.expiresAt)}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {key.scopes?.map((scope) => (
                        <Badge
                          className="text-xs"
                          key={scope}
                          variant="secondary"
                        >
                          {scope}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={regenerateKey.isPending}
                      onClick={() => regenerateKey.mutate({ id: key.id })}
                      size="sm"
                      variant="ghost"
                    >
                      {regenerateKey.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the API key "{key.name}
                            ". Any applications using this key will stop
                            working.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteKey.mutate({ id: key.id })}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Key className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground text-sm">
                No API keys yet
              </p>
              <p className="text-muted-foreground text-xs">
                Create an API key to access the API programmatically
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Key
              </Button>
            </div>
          )}

          <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="font-medium">API Documentation</p>
            <p className="mt-1 text-muted-foreground">
              Use your API key in the{" "}
              <code className="rounded bg-muted px-1">Authorization</code>{" "}
              header:
            </p>
            <code className="mt-2 block rounded bg-muted px-3 py-2 text-xs">
              Authorization: Bearer lm_xxxxx...
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Create Key Dialog */}
      <Dialog onOpenChange={setShowCreateDialog} open={showCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for programmatic access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="My API Key"
                value={name}
              />
              <p className="text-muted-foreground text-xs">
                A descriptive name to identify this key
              </p>
            </div>

            <div className="space-y-2">
              <Label>Scopes</Label>
              <div className="space-y-2">
                {SCOPES.map((scope) => (
                  <div className="flex items-center space-x-2" key={scope.id}>
                    <Checkbox
                      checked={selectedScopes.includes(scope.id)}
                      id={scope.id}
                      onCheckedChange={() => toggleScope(scope.id)}
                    />
                    <Label
                      className="cursor-pointer font-normal text-sm"
                      htmlFor={scope.id}
                    >
                      {scope.label}
                      <span className="ml-1 text-muted-foreground">
                        - {scope.description}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Expiration</Label>
              <Select onValueChange={setExpiresIn} value={expiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowCreateDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createKey.isPending} onClick={handleCreate}>
              {createKey.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Key"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Key Dialog */}
      <Dialog onOpenChange={setShowKeyDialog} open={showKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your API key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Save this key securely
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    This is the only time you'll see this key. Store it
                    somewhere safe.
                  </p>
                </div>
              </div>
            </div>

            {newKeyData && (
              <div className="space-y-2">
                <Label>API Key for "{newKeyData.name}"</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      className="pr-20 font-mono text-sm"
                      readOnly
                      type={showKey ? "text" : "password"}
                      value={newKeyData.key}
                    />
                    <div className="absolute top-1/2 right-1 flex -translate-y-1/2 gap-1">
                      <Button
                        className="h-7 w-7 p-0"
                        onClick={() => setShowKey(!showKey)}
                        size="sm"
                        variant="ghost"
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        className="h-7 w-7 p-0"
                        onClick={() => handleCopy(newKeyData.key)}
                        size="sm"
                        variant="ghost"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowKeyDialog(false)}>
              I've saved my key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
