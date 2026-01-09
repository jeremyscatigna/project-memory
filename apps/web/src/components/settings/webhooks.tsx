import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { queryClient, trpc } from "@/utils/trpc";

const EVENT_CATEGORIES = {
  user: { label: "User Events", description: "User account activities" },
  organization: {
    label: "Organization Events",
    description: "Organization changes",
  },
  member: { label: "Member Events", description: "Team member activities" },
  subscription: {
    label: "Subscription Events",
    description: "Billing and subscription changes",
  },
};

function formatDate(date: Date | string | null) {
  if (!date) {
    return "Never";
  }
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Webhooks() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [showDeliveriesDialog, setShowDeliveriesDialog] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<{
    id: string;
    name: string;
    secret?: string;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery(
    trpc.webhooks.list.queryOptions()
  );

  // Fetch available events
  const { data: availableEvents } = useQuery(
    trpc.webhooks.getAvailableEvents.queryOptions()
  );

  // Fetch webhook details (with secret)
  const { data: webhookDetails, refetch: refetchDetails } = useQuery({
    ...trpc.webhooks.get.queryOptions({ id: selectedWebhook?.id ?? "" }),
    enabled: !!selectedWebhook?.id && showSecretDialog,
  });

  // Fetch deliveries
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery({
    ...trpc.webhooks.getDeliveries.queryOptions({
      webhookId: selectedWebhook?.id ?? "",
      limit: 20,
    }),
    enabled: !!selectedWebhook?.id && showDeliveriesDialog,
  });

  // Create webhook
  const createWebhook = useMutation({
    ...trpc.webhooks.create.mutationOptions(),
    onSuccess: (data) => {
      setSelectedWebhook({ id: data.id, name: data.name, secret: data.secret });
      setShowCreateDialog(false);
      setShowSecretDialog(true);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [["webhooks", "list"]] });
      toast.success("Webhook created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update webhook
  const updateWebhook = useMutation({
    ...trpc.webhooks.update.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["webhooks", "list"]] });
      toast.success("Webhook updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete webhook
  const deleteWebhook = useMutation({
    ...trpc.webhooks.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["webhooks", "list"]] });
      toast.success("Webhook deleted");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Regenerate secret
  const regenerateSecret = useMutation({
    ...trpc.webhooks.regenerateSecret.mutationOptions(),
    onSuccess: (data) => {
      setSelectedWebhook((prev) =>
        prev ? { ...prev, secret: data.secret } : null
      );
      refetchDetails();
      toast.success("Secret regenerated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Test webhook
  const testWebhook = useMutation({
    ...trpc.webhooks.test.mutationOptions(),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(
          `Test successful (${data.statusCode}) - ${data.duration}ms`
        );
      } else {
        toast.error(`Test failed (${data.statusCode})`);
      }
      queryClient.invalidateQueries({ queryKey: [["webhooks", "list"]] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setName("");
    setUrl("");
    setSelectedEvents([]);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    createWebhook.mutate({
      name: name.trim(),
      url: url.trim(),
      events: selectedEvents as (
        | "user.created"
        | "user.updated"
        | "user.deleted"
        | "organization.created"
        | "organization.updated"
        | "organization.deleted"
        | "member.invited"
        | "member.joined"
        | "member.removed"
        | "subscription.created"
        | "subscription.updated"
        | "subscription.cancelled"
      )[],
    });
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  const toggleEvent = (eventName: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventName)
        ? prev.filter((e) => e !== eventName)
        : [...prev, eventName]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryEvents =
      availableEvents
        ?.filter((e) => e.category === category)
        .map((e) => e.event) ?? [];

    const allSelected = categoryEvents.every((e) => selectedEvents.includes(e));

    if (allSelected) {
      setSelectedEvents((prev) =>
        prev.filter((e) => !(categoryEvents as string[]).includes(e))
      );
    } else {
      setSelectedEvents((prev) => [...new Set([...prev, ...categoryEvents])]);
    }
  };

  const groupedEvents = availableEvents?.reduce(
    (acc, event) => {
      if (!acc[event.category]) {
        acc[event.category] = [];
      }
      acc[event.category].push(event);
      return acc;
    },
    {} as Record<string, typeof availableEvents>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receive real-time notifications for events in your account
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks?.length ? (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    wh.enabled ? "" : "opacity-60"
                  }`}
                  key={wh.id}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wh.name}</span>
                      <Badge variant={wh.enabled ? "default" : "secondary"}>
                        {wh.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {wh.failureCount > 0 && (
                        <Badge className="gap-1" variant="destructive">
                          <AlertTriangle className="h-3 w-3" />
                          {wh.failureCount} failures
                        </Badge>
                      )}
                    </div>
                    <p className="max-w-md truncate text-muted-foreground text-sm">
                      {wh.url}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {wh.events.slice(0, 3).map((event) => (
                        <Badge
                          className="text-xs"
                          key={event}
                          variant="outline"
                        >
                          {event}
                        </Badge>
                      ))}
                      {wh.events.length > 3 && (
                        <Badge className="text-xs" variant="outline">
                          +{wh.events.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={wh.enabled}
                      onCheckedChange={(enabled) =>
                        updateWebhook.mutate({ id: wh.id, enabled })
                      }
                    />
                    <Button
                      disabled={testWebhook.isPending}
                      onClick={() => testWebhook.mutate({ id: wh.id })}
                      size="sm"
                      variant="ghost"
                    >
                      {testWebhook.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedWebhook({ id: wh.id, name: wh.name });
                        setShowDeliveriesDialog(true);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedWebhook({ id: wh.id, name: wh.name });
                        setShowSecretDialog(true);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Webhook?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the webhook "{wh.name}
                            ". You will stop receiving notifications for its
                            events.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deleteWebhook.mutate({ id: wh.id })}
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
              <Webhook className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground text-sm">
                No webhooks configured
              </p>
              <p className="text-muted-foreground text-xs">
                Create a webhook to receive real-time event notifications
              </p>
              <Button
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Webhook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Webhook Dialog */}
      <Dialog onOpenChange={setShowCreateDialog} open={showCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>
              Create a new webhook to receive event notifications
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Name</Label>
              <Input
                id="wh-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="My Webhook"
                value={name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wh-url">Endpoint URL</Label>
              <Input
                id="wh-url"
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
                type="url"
                value={url}
              />
            </div>

            <div className="space-y-2">
              <Label>Events</Label>
              <ScrollArea className="h-48 rounded-md border p-2">
                <Accordion className="w-full" type="multiple">
                  {groupedEvents &&
                    Object.entries(groupedEvents).map(([category, events]) => (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="py-2">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={events.every((e) =>
                                selectedEvents.includes(e.event)
                              )}
                              onCheckedChange={() => toggleCategory(category)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span>
                              {EVENT_CATEGORIES[
                                category as keyof typeof EVENT_CATEGORIES
                              ]?.label ?? category}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pl-6">
                            {events.map((event) => (
                              <div
                                className="flex items-center space-x-2"
                                key={event.event}
                              >
                                <Checkbox
                                  checked={selectedEvents.includes(event.event)}
                                  id={event.event}
                                  onCheckedChange={() =>
                                    toggleEvent(event.event)
                                  }
                                />
                                <Label
                                  className="cursor-pointer font-normal text-sm"
                                  htmlFor={event.event}
                                >
                                  {event.event}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                </Accordion>
              </ScrollArea>
              <p className="text-muted-foreground text-xs">
                {selectedEvents.length} events selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowCreateDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createWebhook.isPending} onClick={handleCreate}>
              {createWebhook.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Webhook"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Dialog */}
      <Dialog onOpenChange={setShowSecretDialog} open={showSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook Secret</DialogTitle>
            <DialogDescription>
              Use this secret to verify webhook signatures
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm dark:border-yellow-900 dark:bg-yellow-900/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                <p className="text-yellow-800 dark:text-yellow-200">
                  Keep this secret safe. Use it to verify that webhook requests
                  are from us.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Signing Secret</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    className="pr-20 font-mono text-sm"
                    readOnly
                    type={showSecret ? "text" : "password"}
                    value={
                      selectedWebhook?.secret ?? webhookDetails?.secret ?? ""
                    }
                  />
                  <div className="absolute top-1/2 right-1 flex -translate-y-1/2 gap-1">
                    <Button
                      className="h-7 w-7 p-0"
                      onClick={() => setShowSecret(!showSecret)}
                      size="sm"
                      variant="ghost"
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      className="h-7 w-7 p-0"
                      onClick={() =>
                        handleCopy(
                          selectedWebhook?.secret ??
                            webhookDetails?.secret ??
                            ""
                        )
                      }
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

            <Button
              className="w-full"
              disabled={regenerateSecret.isPending}
              onClick={() =>
                selectedWebhook &&
                regenerateSecret.mutate({ id: selectedWebhook.id })
              }
              variant="outline"
            >
              {regenerateSecret.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate Secret
            </Button>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliveries Dialog */}
      <Dialog
        onOpenChange={setShowDeliveriesDialog}
        open={showDeliveriesDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>
              Recent webhook deliveries for "{selectedWebhook?.name}"
            </DialogDescription>
          </DialogHeader>

          {isLoadingDeliveries ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : deliveries?.length ? (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {deliveries.map((delivery) => (
                  <div
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      delivery.success
                        ? ""
                        : "border-destructive/50 bg-destructive/5"
                    }`}
                    key={delivery.id}
                  >
                    <div className="flex items-center gap-3">
                      {delivery.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{delivery.event}</Badge>
                          <span className="text-muted-foreground text-sm">
                            {delivery.statusCode}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(delivery.createdAt)} · {delivery.duration}
                          ms
                        </p>
                      </div>
                    </div>
                    {delivery.attempts > 1 && (
                      <Badge variant="secondary">
                        {delivery.attempts} attempts
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No deliveries yet
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDeliveriesDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
