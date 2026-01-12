"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Forward,
  Image,
  MoreHorizontal,
  Paperclip,
  Reply,
  ReplyAll,
  Star,
  Trash2,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface MessageData {
  id: string;
  threadId: string;
  subject: string;
  from: {
    email: string;
    name: string;
    avatarUrl?: string;
  };
  to: Array<{
    email: string;
    name: string;
  }>;
  cc?: Array<{
    email: string;
    name: string;
  }>;
  date: Date;
  body: string;
  bodyHtml?: string;
  snippet: string;
  isUnread: boolean;
  attachments?: AttachmentData[];
  labels?: string[];
}

export interface AttachmentData {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  downloadUrl?: string;
}

interface ConversationViewProps {
  messages: MessageData[];
  threadSubject: string;
  isLoading?: boolean;
  onBack?: () => void;
  onReply?: (messageId: string) => void;
  onReplyAll?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  isStarred?: boolean;
  highlightMessageId?: string;
  onMessageInView?: (messageId: string) => void;
  className?: string;
}

// =============================================================================
// CONVERSATION VIEW
// =============================================================================

export function ConversationView({
  messages,
  threadSubject,
  isLoading = false,
  onBack,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onStar,
  isStarred = false,
  highlightMessageId,
  onMessageInView,
  className,
}: ConversationViewProps) {
  // Track which messages are expanded (most recent expanded by default)
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(() => {
    if (messages.length > 0) {
      return new Set([messages[messages.length - 1]?.id ?? ""]);
    }
    return new Set();
  });

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedMessages(new Set(messages.map((m) => m.id)));
  };

  const collapseAll = () => {
    // Keep the last message expanded
    const lastId = messages[messages.length - 1]?.id;
    setExpandedMessages(new Set(lastId ? [lastId] : []));
  };

  if (isLoading) {
    return <ConversationSkeleton />;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{threadSubject}</h1>
            <p className="text-xs text-muted-foreground">
              {messages.length} message{messages.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onStar}>
                    <Star
                      className={cn(
                        "h-4 w-4",
                        isStarred && "fill-amber-400 text-amber-400"
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isStarred ? "Remove star" : "Star thread"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onArchive}>
                    <Archive className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Archive</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Expand/collapse controls */}
        {messages.length > 1 && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={expandAll}
            >
              <ChevronDown className="h-3 w-3 mr-1" />
              Expand all
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={collapseAll}
            >
              <ChevronUp className="h-3 w-3 mr-1" />
              Collapse all
            </Button>
          </div>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <MessageCard
                key={message.id}
                message={message}
                isExpanded={expandedMessages.has(message.id)}
                onToggle={() => toggleMessage(message.id)}
                onReply={() => onReply?.(message.id)}
                onReplyAll={() => onReplyAll?.(message.id)}
                onForward={() => onForward?.(message.id)}
                isLast={index === messages.length - 1}
                isHighlighted={message.id === highlightMessageId}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

// =============================================================================
// MESSAGE CARD
// =============================================================================

function MessageCard({
  message,
  isExpanded,
  onToggle,
  onReply,
  onReplyAll,
  onForward,
  isLast,
  isHighlighted,
}: {
  message: MessageData;
  isExpanded: boolean;
  onToggle: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  isLast: boolean;
  isHighlighted: boolean;
}) {
  const hasMultipleRecipients =
    message.to.length > 1 || (message.cc && message.cc.length > 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "rounded-lg border bg-card transition-all",
        isHighlighted && "ring-2 ring-primary",
        message.isUnread && "border-primary/50"
      )}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 p-4 w-full text-left hover:bg-accent/50 transition-colors rounded-t-lg"
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={message.from.avatarUrl} />
          <AvatarFallback className="text-xs">
            {message.from.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm truncate",
                message.isUnread ? "font-semibold" : "font-medium"
              )}
            >
              {message.from.name}
            </span>
            {message.isUnread && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                New
              </Badge>
            )}
          </div>
          {!isExpanded && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {message.snippet}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(message.date, { addSuffix: true })}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Separator />

            {/* Full header */}
            <div className="px-4 py-3 bg-muted/30 text-xs space-y-1">
              <div className="flex">
                <span className="text-muted-foreground w-12">From:</span>
                <span>
                  {message.from.name} &lt;{message.from.email}&gt;
                </span>
              </div>
              <div className="flex">
                <span className="text-muted-foreground w-12">To:</span>
                <span className="truncate">
                  {message.to.map((r) => `${r.name} <${r.email}>`).join(", ")}
                </span>
              </div>
              {message.cc && message.cc.length > 0 && (
                <div className="flex">
                  <span className="text-muted-foreground w-12">Cc:</span>
                  <span className="truncate">
                    {message.cc
                      .map((r) => `${r.name} <${r.email}>`)
                      .join(", ")}
                  </span>
                </div>
              )}
              <div className="flex">
                <span className="text-muted-foreground w-12">Date:</span>
                <span>{format(message.date, "PPpp")}</span>
              </div>
            </div>

            <Separator />

            {/* Body */}
            <div className="p-4">
              {message.bodyHtml ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  // Using sanitized HTML - in production, use DOMPurify
                  dangerouslySetInnerHTML={{ __html: message.bodyHtml }}
                />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-sans">
                  {message.body}
                </pre>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <>
                <Separator />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {message.attachments.length} attachment
                      {message.attachments.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {message.attachments.map((attachment) => (
                      <AttachmentCard
                        key={attachment.id}
                        attachment={attachment}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <Separator />
            <div className="flex items-center gap-2 p-3">
              <Button variant="outline" size="sm" onClick={onReply}>
                <Reply className="h-4 w-4 mr-1" />
                Reply
              </Button>
              {hasMultipleRecipients && (
                <Button variant="outline" size="sm" onClick={onReplyAll}>
                  <ReplyAll className="h-4 w-4 mr-1" />
                  Reply all
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onForward}>
                <Forward className="h-4 w-4 mr-1" />
                Forward
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// ATTACHMENT CARD
// =============================================================================

function AttachmentCard({ attachment }: { attachment: AttachmentData }) {
  const getIcon = () => {
    if (attachment.mimeType.startsWith("image/")) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (attachment.mimeType === "application/pdf") {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <a
      href={attachment.downloadUrl}
      download={attachment.filename}
      className="flex items-center gap-3 p-2 rounded-lg border bg-background hover:bg-accent transition-colors"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.filename}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(attachment.size)}
        </p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground" />
    </a>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ConversationSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
