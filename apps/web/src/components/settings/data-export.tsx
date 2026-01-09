import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileJson,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, trpc } from "@/utils/trpc";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge className="gap-1" variant="outline">
          <Clock className="h-3 w-3" />
          Pending
        </Badge>
      );
    case "processing":
      return (
        <Badge className="gap-1" variant="secondary">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
    case "completed":
      return (
        <Badge className="gap-1 bg-green-600" variant="default">
          <CheckCircle2 className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge className="gap-1" variant="destructive">
          <AlertCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function DataExport() {
  const [showDataPreview, setShowDataPreview] = useState(false);

  // Fetch export requests
  const { data: exportRequests, isLoading: isLoadingRequests } = useQuery(
    trpc.user.getDataExportRequests.queryOptions()
  );

  // Fetch user data for preview
  const { data: userData, isLoading: isLoadingUserData } = useQuery({
    ...trpc.user.getMyData.queryOptions(),
    enabled: showDataPreview,
  });

  // Request new export
  const requestExport = useMutation({
    ...trpc.user.requestDataExport.mutationOptions(),
    onSuccess: () => {
      toast.success(
        "Data export requested! You'll be notified when it's ready."
      );
      queryClient.invalidateQueries({
        queryKey: [["user", "getDataExportRequests"]],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete export request
  const deleteRequest = useMutation({
    ...trpc.user.deleteDataExportRequest.mutationOptions(),
    onSuccess: () => {
      toast.success("Export request deleted");
      queryClient.invalidateQueries({
        queryKey: [["user", "getDataExportRequests"]],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDownload = (data: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Export
              </CardTitle>
              <CardDescription>
                Download a copy of all your personal data (GDPR)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={requestExport.isPending}
              onClick={() => requestExport.mutate()}
            >
              {requestExport.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Request Full Export
                </>
              )}
            </Button>

            <Button onClick={() => setShowDataPreview(true)} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Preview My Data
            </Button>

            {userData && (
              <Button
                onClick={() =>
                  handleDownload(
                    userData,
                    `my-data-${new Date().toISOString().split("T")[0]}.json`
                  )
                }
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Quick Download
              </Button>
            )}
          </div>

          {/* Export history */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Export History</h4>
              <Button
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: [["user", "getDataExportRequests"]],
                  })
                }
                size="sm"
                variant="ghost"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {isLoadingRequests ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : exportRequests?.length ? (
              <div className="space-y-2">
                {exportRequests.map((request) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={request.id}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={request.status} />
                        <span className="text-muted-foreground text-xs">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                      {request.expiresAt && request.status === "completed" && (
                        <p className="text-muted-foreground text-xs">
                          Expires: {formatDate(request.expiresAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === "completed" &&
                        request.downloadUrl && (
                          <Button asChild size="sm">
                            <a download href={request.downloadUrl}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete export request?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the export request from your
                              history.
                              {request.status === "completed" &&
                                " Any downloaded files will remain on your device."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteRequest.mutate({ id: request.id })
                              }
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
                <FileJson className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground text-sm">
                  No export requests yet
                </p>
                <p className="text-muted-foreground text-xs">
                  Request a full export to download all your data
                </p>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="font-medium">What's included in your data export:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
              <li>Your profile information</li>
              <li>Active sessions and login history</li>
              <li>Connected OAuth accounts</li>
              <li>Activity and audit logs</li>
              <li>Organization memberships</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Data Preview Dialog */}
      <Dialog onOpenChange={setShowDataPreview} open={showDataPreview}>
        <DialogContent className="max-h-[80vh] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Your Data Preview</DialogTitle>
            <DialogDescription>
              This is a preview of all the data we have about you
            </DialogDescription>
          </DialogHeader>

          {isLoadingUserData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userData ? (
            <ScrollArea className="h-[60vh]">
              <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </ScrollArea>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Failed to load data
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowDataPreview(false)} variant="outline">
              Close
            </Button>
            {userData && (
              <Button
                onClick={() =>
                  handleDownload(
                    userData,
                    `my-data-${new Date().toISOString().split("T")[0]}.json`
                  )
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
