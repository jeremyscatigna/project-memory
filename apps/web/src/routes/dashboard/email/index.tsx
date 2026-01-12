"use client";

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  ThreadList,
  type InboxFilter,
  type InboxSort,
  type IntelligenceFilter,
  ThreadBriefSkeleton,
} from "@/components/email/thread-list";
import { ThreadBrief, type ThreadBriefData } from "@/components/email/thread-brief";
import { CommandBar, useCommandBar } from "@/components/email/command-bar";
import { ConversationView, type MessageData } from "@/components/email/conversation-view";
import {
  IntelligencePanel,
  type CommitmentData,
  type DecisionData,
  type OpenQuestionData,
  type RiskWarningData,
} from "@/components/email/intelligence-panel";
import {
  MemoryPanel,
  type RelatedThread,
  type ContactContext,
} from "@/components/email/memory-panel";

import { useTRPC, queryClient } from "@/utils/trpc";

// =============================================================================
// ROUTE DEFINITION
// =============================================================================

export const Route = createFileRoute("/dashboard/email/")({
  component: EmailInboxPage,
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function EmailInboxPage() {
  const navigate = useNavigate();
  const trpc = useTRPC();
  const { open: commandBarOpen, setOpen: setCommandBarOpen } = useCommandBar();

  // State
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [sort, setSort] = useState<InboxSort>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [intelligenceFilter, setIntelligenceFilter] =
    useState<IntelligenceFilter>("all");
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Fetch threads
  const {
    data: threadsData,
    isLoading: isLoadingThreads,
    refetch: refetchThreads,
  } = useQuery({
    ...trpc.threads.list.queryOptions({
      filter,
      sort,
      sortDirection,
      intelligenceFilter,
    }),
    staleTime: 30000,
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    ...trpc.threads.getUnreadCount.queryOptions({}),
    staleTime: 60000,
  });

  // Fetch selected thread details
  const {
    data: threadDetailData,
    isLoading: isLoadingThread,
  } = useQuery({
    ...trpc.threads.getById.queryOptions({ threadId: selectedThreadId ?? "" }),
    enabled: !!selectedThreadId,
  });

  // Fetch messages for selected thread
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    ...trpc.threads.getMessages.queryOptions({ threadId: selectedThreadId ?? "" }),
    enabled: !!selectedThreadId,
  });

  // Fetch intelligence for selected thread
  const { data: intelligenceData, isLoading: isLoadingIntelligence } = useQuery({
    ...trpc.threads.getIntelligence.queryOptions({ threadId: selectedThreadId ?? "" }),
    enabled: !!selectedThreadId,
    staleTime: 60000,
  });

  // Fetch related context for selected thread
  const { data: contextData, isLoading: isLoadingContext } = useQuery({
    ...trpc.threads.getRelatedContext.queryOptions({ threadId: selectedThreadId ?? "" }),
    enabled: !!selectedThreadId,
    staleTime: 60000,
  });

  // Mutations
  const archiveMutation = useMutation({
    ...trpc.threads.archive.mutationOptions(),
    onSuccess: () => {
      toast.success("Thread archived");
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (selectedThreadId) {
        setSelectedThreadId(null);
      }
    },
  });

  const starMutation = useMutation({
    ...trpc.threads.star.mutationOptions(),
    onMutate: async ({ threadId, starred }) => {
      await queryClient.cancelQueries({ queryKey: ["threads"] });
      const previousData = queryClient.getQueryData(["threads", "list"]);
      // Optimistic update
      queryClient.setQueryData(["threads", "list"], (old: { threads: ThreadBriefData[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          threads: old.threads.map((t) =>
            t.id === threadId ? { ...t, isStarred: starred } : t
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["threads", "list"], context.previousData);
      }
      toast.error("Failed to update star");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const markReadMutation = useMutation({
    ...trpc.threads.markRead.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const deleteMutation = useMutation({
    ...trpc.threads.delete.mutationOptions(),
    onSuccess: () => {
      toast.success("Thread deleted");
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      if (selectedThreadId) {
        setSelectedThreadId(null);
      }
    },
  });

  // Handlers
  const handleThreadClick = useCallback((threadId: string) => {
    setSelectedThreadId(threadId);
    // Mark as read when opened
    markReadMutation.mutate({ threadId, read: true });
  }, [markReadMutation]);

  const handleThreadAction = useCallback(
    async (threadId: string, action: string) => {
      switch (action) {
        case "archive":
          await archiveMutation.mutateAsync({ threadId });
          break;
        case "star":
          await starMutation.mutateAsync({ threadId, starred: true });
          break;
        case "unstar":
          await starMutation.mutateAsync({ threadId, starred: false });
          break;
        case "mark_read":
          await markReadMutation.mutateAsync({ threadId, read: true });
          break;
        case "mark_unread":
          await markReadMutation.mutateAsync({ threadId, read: false });
          break;
        case "delete":
          await deleteMutation.mutateAsync({ threadId });
          break;
        case "respond":
          setSelectedThreadId(threadId);
          // TODO: Open draft composer
          break;
      }
    },
    [archiveMutation, starMutation, markReadMutation, deleteMutation]
  );

  const handleBatchAction = useCallback(
    async (threadIds: string[], action: string) => {
      try {
        await Promise.all(
          threadIds.map((threadId) => handleThreadAction(threadId, action))
        );
        toast.success(`${threadIds.length} threads updated`);
      } catch {
        toast.error("Failed to update some threads");
      }
    },
    [handleThreadAction]
  );

  const handleReply = useCallback((messageId: string) => {
    // TODO: Open draft composer with reply context
    toast.info("Reply feature coming soon");
  }, []);

  const handleBack = useCallback(() => {
    setSelectedThreadId(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if (e.key === "Escape" && selectedThreadId) {
        setSelectedThreadId(null);
        return;
      }

      // Command bar
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandBarOpen(true);
        return;
      }

      // Only process these if not in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Navigation (vim-style)
      if (e.key === "j" && !selectedThreadId) {
        // Move down in list - would need selection state
      }
      if (e.key === "k" && !selectedThreadId) {
        // Move up in list
      }

      // Quick actions
      if (selectedThreadId) {
        if (e.key === "e") {
          handleThreadAction(selectedThreadId, "archive");
        }
        if (e.key === "s") {
          const thread = threadsData?.threads?.find(
            (t) => t.id === selectedThreadId
          );
          handleThreadAction(
            selectedThreadId,
            thread?.isStarred ? "unstar" : "star"
          );
        }
        if (e.key === "r") {
          handleReply("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedThreadId,
    threadsData?.threads,
    handleThreadAction,
    handleReply,
    setCommandBarOpen,
  ]);

  // Transform data for components
  const threads: ThreadBriefData[] = (threadsData?.threads ?? []).map((t) => ({
    id: t.id,
    subject: t.subject ?? "No subject",
    brief: t.brief ?? t.snippet ?? "",
    lastMessageDate: new Date(t.lastMessageDate),
    messageCount: t.messageCount ?? 1,
    isUnread: t.isUnread ?? false,
    isStarred: t.isStarred ?? false,
    isSnoozed: t.isSnoozed ?? false,
    snoozeUntil: t.snoozeUntil ? new Date(t.snoozeUntil) : undefined,
    participants: t.participants ?? [],
    priority: t.priority ?? "medium",
    suggestedAction: t.suggestedAction,
    commitmentCount: t.commitmentCount ?? 0,
    decisionCount: t.decisionCount ?? 0,
    openQuestionCount: t.openQuestionCount ?? 0,
    hasRiskWarning: t.hasRiskWarning ?? false,
    riskLevel: t.riskLevel,
    labels: t.labels ?? [],
    briefConfidence: t.briefConfidence ?? 0.8,
  }));

  const messages: MessageData[] = (messagesData?.messages ?? []).map((m) => ({
    id: m.id,
    threadId: m.threadId,
    subject: m.subject ?? "",
    from: m.from ?? { email: "", name: "" },
    to: m.to ?? [],
    cc: m.cc,
    date: new Date(m.date),
    body: m.body ?? "",
    bodyHtml: m.bodyHtml,
    snippet: m.snippet ?? "",
    isUnread: m.isUnread ?? false,
    attachments: m.attachments,
  }));

  const commitments: CommitmentData[] = (
    intelligenceData?.commitments ?? []
  ).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    debtor: c.debtor,
    creditor: c.creditor,
    dueDate: c.dueDate ? new Date(c.dueDate) : undefined,
    status: c.status,
    priority: c.priority,
    confidence: c.confidence,
    evidence: c.evidence ?? [],
    extractedFrom: c.extractedFrom,
    reasoning: c.reasoning,
  }));

  const decisions: DecisionData[] = (intelligenceData?.decisions ?? []).map(
    (d) => ({
      id: d.id,
      title: d.title,
      statement: d.statement,
      rationale: d.rationale,
      maker: d.maker,
      date: new Date(d.date),
      category: d.category,
      supersedes: d.supersedes,
      confidence: d.confidence,
      evidence: d.evidence ?? [],
      extractedFrom: d.extractedFrom,
      alternatives: d.alternatives,
    })
  );

  const openQuestions: OpenQuestionData[] = (
    intelligenceData?.openQuestions ?? []
  ).map((q) => ({
    id: q.id,
    question: q.question,
    askedBy: q.askedBy,
    askedAt: new Date(q.askedAt),
    context: q.context,
    isAnswered: q.isAnswered,
    answeredBy: q.answeredBy,
    answeredAt: q.answeredAt ? new Date(q.answeredAt) : undefined,
    confidence: q.confidence,
  }));

  const riskWarnings: RiskWarningData[] = (
    intelligenceData?.riskWarnings ?? []
  ).map((w) => ({
    id: w.id,
    type: w.type,
    severity: w.severity,
    title: w.title,
    description: w.description,
    recommendation: w.recommendation,
    evidence: w.evidence ?? [],
  }));

  return (
    <>
      {/* Command Bar */}
      <CommandBar open={commandBarOpen} onOpenChange={setCommandBarOpen} />

      {/* Main Layout */}
      <div className="flex flex-col h-[calc(100vh-var(--header-height))]">
        {/* Command bar trigger */}
        <div className="border-b px-4 py-2 flex items-center gap-2 bg-background/95 backdrop-blur-sm">
          <Button
            variant="outline"
            className="flex-1 justify-start text-muted-foreground font-normal h-9"
            onClick={() => setCommandBarOpen(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            <span>Search, ask questions, or navigate...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Compose new email</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Split view */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Thread list */}
          <ResizablePanel
            defaultSize={selectedThreadId ? 35 : 100}
            minSize={25}
            maxSize={50}
            className={selectedThreadId ? "" : "max-w-full"}
          >
            <ThreadList
              threads={threads}
              isLoading={isLoadingThreads}
              filter={filter}
              sort={sort}
              sortDirection={sortDirection}
              intelligenceFilter={intelligenceFilter}
              onFilterChange={setFilter}
              onSortChange={setSort}
              onSortDirectionChange={setSortDirection}
              onIntelligenceFilterChange={setIntelligenceFilter}
              onThreadClick={handleThreadClick}
              onThreadAction={handleThreadAction}
              onBatchAction={handleBatchAction}
              onRefresh={() => refetchThreads()}
              unreadCount={unreadData?.count ?? 0}
              totalCount={threadsData?.total ?? 0}
            />
          </ResizablePanel>

          {/* Thread detail */}
          <AnimatePresence>
            {selectedThreadId && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={65} minSize={40}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full"
                  >
                    <ResizablePanelGroup direction="horizontal">
                      {/* Conversation */}
                      <ResizablePanel defaultSize={60} minSize={40}>
                        <ConversationView
                          messages={messages}
                          threadSubject={
                            threadDetailData?.thread?.subject ?? "Loading..."
                          }
                          isLoading={isLoadingMessages}
                          onBack={handleBack}
                          onReply={handleReply}
                          onReplyAll={handleReply}
                          onForward={handleReply}
                          onArchive={() =>
                            handleThreadAction(selectedThreadId, "archive")
                          }
                          onDelete={() =>
                            handleThreadAction(selectedThreadId, "delete")
                          }
                          onStar={() => {
                            const thread = threads.find(
                              (t) => t.id === selectedThreadId
                            );
                            handleThreadAction(
                              selectedThreadId,
                              thread?.isStarred ? "unstar" : "star"
                            );
                          }}
                          isStarred={
                            threads.find((t) => t.id === selectedThreadId)
                              ?.isStarred ?? false
                          }
                        />
                      </ResizablePanel>

                      <ResizableHandle />

                      {/* Intelligence & Memory */}
                      <ResizablePanel defaultSize={40} minSize={25}>
                        <ResizablePanelGroup direction="vertical">
                          {/* Intelligence panel */}
                          <ResizablePanel defaultSize={60} minSize={30}>
                            <IntelligencePanel
                              threadId={selectedThreadId}
                              commitments={commitments}
                              decisions={decisions}
                              openQuestions={openQuestions}
                              riskWarnings={riskWarnings}
                              isLoading={isLoadingIntelligence}
                              onEvidenceClick={(evidence) => {
                                // TODO: Scroll to evidence in conversation
                                toast.info("Scrolling to evidence...");
                              }}
                              onCommitmentAction={(id, action) => {
                                if (action === "complete") {
                                  toast.success("Commitment marked complete");
                                }
                              }}
                              onFeedback={(type, id, positive) => {
                                toast.success(
                                  `Thanks for the feedback on this ${type}!`
                                );
                              }}
                            />
                          </ResizablePanel>

                          <ResizableHandle />

                          {/* Memory panel */}
                          <ResizablePanel defaultSize={40} minSize={20}>
                            <MemoryPanel
                              relatedThreads={
                                contextData?.relatedThreads ?? []
                              }
                              relatedDecisions={
                                contextData?.relatedDecisions ?? []
                              }
                              relatedCommitments={
                                contextData?.relatedCommitments ?? []
                              }
                              contactContexts={
                                contextData?.contactContexts ?? []
                              }
                              timeline={contextData?.timeline ?? []}
                              isLoading={isLoadingContext}
                              onThreadClick={(threadId) => {
                                setSelectedThreadId(threadId);
                              }}
                              onContactClick={(email) => {
                                navigate({
                                  to: "/dashboard/contacts",
                                  search: { email },
                                });
                              }}
                            />
                          </ResizablePanel>
                        </ResizablePanelGroup>
                      </ResizablePanel>
                    </ResizablePanelGroup>
                  </motion.div>
                </ResizablePanel>
              </>
            )}
          </AnimatePresence>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
