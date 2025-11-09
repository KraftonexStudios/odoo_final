"use client";
import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Download, Trash2, File } from "lucide-react";
import { useAttachments, useCreateAttachment, useDeleteAttachment } from "@/hooks/attachments";
import { formatFileSize } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
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

type Props = {
  taskId: number;
};

export const AttachmentSection = ({ taskId }: Props) => {
  const { data: attachments, isLoading } = useAttachments(taskId);
  const { mutate: uploadAttachment, isPending: uploading } = useCreateAttachment(taskId);
  const { mutate: deleteAttachment, isPending: deleting } = useDeleteAttachment(taskId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = React.useState<number | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, we'll use a simple approach - in production, upload to S3/Vercel Blob
    // This is a placeholder - you'll need to implement actual file upload
    const reader = new FileReader();
    reader.onloadend = () => {
      // In production, upload to storage and get URL
      // For now, using data URL (not recommended for production)
      const fileUrl = reader.result as string;
      
      uploadAttachment({
        taskId,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: number) => {
    setAttachmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (attachmentToDelete) {
      deleteAttachment(attachmentToDelete);
      setDeleteDialogOpen(false);
      setAttachmentToDelete(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "📊";
    return "📎";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Attachments
        </h3>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="h-3 w-3 mr-1" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : attachments && attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment: any) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(attachment.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.open(attachment.fileUrl, "_blank")}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleting}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No attachments yet
        </p>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attachment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

