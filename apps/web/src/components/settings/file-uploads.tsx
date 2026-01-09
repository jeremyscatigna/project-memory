import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  File,
  FileImage,
  FileText,
  Loader2,
  MoreHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryClient, trpc } from "@/utils/trpc";

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <FileImage className="h-4 w-4" />;
  }
  if (mimeType.startsWith("text/") || mimeType.includes("document")) {
    return <FileText className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
}

export function FileUploads() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const { data, isLoading } = useQuery(
    trpc.uploads.list.queryOptions({ limit: 50 })
  );

  const confirmUploadMutation = useMutation({
    ...trpc.uploads.confirmUpload.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["uploads", "list"]] });
      toast.success("File uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    ...trpc.uploads.delete.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [["uploads", "list"]] });
      toast.success("File deleted");
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        // Generate a file ID
        const fileId = crypto.randomUUID();
        const ext = file.name.split(".").pop() || "";
        const key = `uploads/${fileId}.${ext}`;

        // Determine category based on mime type
        let category: "general" | "avatar" | "document" | "image" = "general";
        if (file.type.startsWith("image/")) {
          category = "image";
        } else if (
          file.type.includes("document") ||
          file.type.includes("pdf") ||
          file.type.startsWith("text/")
        ) {
          category = "document";
        }

        // Confirm the upload
        await confirmUploadMutation.mutateAsync({
          fileId,
          key,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          category,
          isPublic: false,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
      } catch {
        toast.error("Failed to upload file");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset the input
        event.target.value = "";
      }
    },
    [confirmUploadMutation]
  );

  const handleDelete = (id: string) => {
    setFileToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate({ id: fileToDelete });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          File Uploads
        </CardTitle>
        <CardDescription>
          Upload and manage your files. Files are stored securely and can be
          accessed anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="sr-only" htmlFor="file-upload">
                Choose file
              </Label>
              <Input
                className="cursor-pointer"
                disabled={isUploading}
                id="file-upload"
                onChange={handleFileChange}
                type="file"
              />
            </div>
          </div>
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-muted-foreground text-sm">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        {/* Files Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : data?.files && data.files.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.mimeType)}
                      <span className="max-w-[200px] truncate font-medium">
                        {file.filename}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatFileSize(file.size)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{file.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            toast.info("Download URL would be generated here")
                          }
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <Upload className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No files uploaded yet</p>
            <p className="text-sm">Upload a file to get started</p>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete File</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this file? This action cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                onClick={confirmDelete}
                variant="destructive"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default FileUploads;
