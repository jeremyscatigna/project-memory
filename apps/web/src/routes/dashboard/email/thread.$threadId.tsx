"use client";

import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { ConversationView, type MessageData } from "@/components/email/conversation-view";
import {
  IntelligencePanel,
  type CommitmentData,
  type DecisionData,
  type OpenQuestionData,
  type RiskWarningData,
} from "@/components/email/intelligence-panel";
import { MemoryPanel } from "@/components/email/memory-panel";
import { CommandBar, useCommandBar } from "@/components/email/command-bar";

import { useTRPC, queryClient } from "@/utils/trpc";

// =============================================================================
// ROUTE DEFINITION
// =============================================================================

export const Route = createFileRoute("/dashboard/email/thread/$threadId")({
  component: ThreadDetailPage,
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ThreadDetailPage() {
  const navigate = useNavigate();
  const { threadId } = useParams({ from: "/dashboard/email/thread/$threadId" });
  const trpc = useTRPC();
  const { open: commandBarOpen, setOpen: setCommandBarOpen } = useCommandBar();

  // Fetch thread details
  const {
    data: threadData,
    isLoading: isLoadingThread,
  } = useQuery({
    ...trpc.threads.getById.queryOptions({ threadId }),
    enabled: !!threadId,
  });

  // Fetch messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    ...trpc.threads.getMessages.queryOptions({ threadId }),
    enabled: !!threadId,
  });

  // Fetch intelligence
  const { data: intelligenceData, isLoading: isLoadingIntelligence } = useQuery({
    ...trpc.threads.getIntelligence.queryOptions({ threadId }),
    enabled: !!threadId,
    staleTime: 60000,
  });

  // Fetch related context
  const { data: contextData, isLoading: isLoadingContext } = useQuery({
    ...trpc.threads.getRelatedContext.queryOptions({ threadId }),
    enabled: !!threadId,
    staleTime: 60000,
  });

  // Mark as read on mount
  const markReadMutation = useMutation({
    ...trpc.threads.markRead.mutationOptions(),
  });

  useEffect(() => {
    if (threadId) {
      markReadMutation.mutate({ threadId, read: true });
    }
  }, [threadId, markReadMutation]);

  // Mutations
  const archiveMutation = useMutation({
    ...trpc.threads.archive.mutationOptions(),
    onSuccess: () => {
      toast.success("Thread archived");
      navigate({ to: "/dashboard/email" });
    },
  });

  const starMutation = useMutation({
    ...trpc.threads.star.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const deleteMutation = useMutation({
    ...trpc.threads.delete.mutationOptions(),
    onSuccess: () => {
      toast.success("Thread deleted");
      navigate({ to: "/dashboard/email" });
    },
  });

  // Handlers
  const handleBack = useCallback(() => {
    navigate({ to: "/dashboard/email" });
  }, [navigate]);

  const handleArchive = useCallback(async () => {
    await archiveMutation.mutateAsync({ threadId });
  }, [archiveMutation, threadId]);

  const handleStar = useCallback(async () => {
    const currentStarred = threadData?.thread?.isStarred ?? false;
    await starMutation.mutateAsync({ threadId, starred: !currentStarred });
  }, [starMutation, threadId, threadData?.thread?.isStarred]);

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync({ threadId });
  }, [deleteMutation, threadId]);

  const handleReply = useCallback((messageId: string) => {
    toast.info("Reply feature coming soon");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleBack();
        return;
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandBarOpen(true);
        return;
      }

      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "e") handleArchive();
      if (e.key === "s") handleStar();
      if (e.key === "r") handleReply("");
      if (e.key === "#") handleDelete();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBack, handleArchive, handleStar, handleDelete, handleReply, setCommandBarOpen]);

  // Transform data
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
      <CommandBar open={commandBarOpen} onOpenChange={setCommandBarOpen} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-[calc(100vh-var(--header-height))]"
      >
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Conversation */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ConversationView
              messages={messages}
              threadSubject={threadData?.thread?.subject ?? "Loading..."}
              isLoading={isLoadingMessages}
              onBack={handleBack}
              onReply={handleReply}
              onReplyAll={handleReply}
              onForward={handleReply}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onStar={handleStar}
              isStarred={threadData?.thread?.isStarred ?? false}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Intelligence & Memory */}
          <ResizablePanel defaultSize={40} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              {/* Intelligence panel */}
              <ResizablePanel defaultSize={60} minSize={30}>
                <IntelligencePanel
                  threadId={threadId}
                  commitments={commitments}
                  decisions={decisions}
                  openQuestions={openQuestions}
                  riskWarnings={riskWarnings}
                  isLoading={isLoadingIntelligence}
                  onEvidenceClick={(evidence) => {
                    toast.info("Scrolling to evidence...");
                  }}
                  onCommitmentAction={(id, action) => {
                    if (action === "complete") {
                      toast.success("Commitment marked complete");
                    }
                  }}
                  onFeedback={(type, id, positive) => {
                    toast.success(`Thanks for the feedback on this ${type}!`);
                  }}
                />
              </ResizablePanel>

              <ResizableHandle />

              {/* Memory panel */}
              <ResizablePanel defaultSize={40} minSize={20}>
                <MemoryPanel
                  relatedThreads={contextData?.relatedThreads ?? []}
                  relatedDecisions={contextData?.relatedDecisions ?? []}
                  relatedCommitments={contextData?.relatedCommitments ?? []}
                  contactContexts={contextData?.contactContexts ?? []}
                  timeline={contextData?.timeline ?? []}
                  isLoading={isLoadingContext}
                  onThreadClick={(id) => {
                    navigate({ to: "/dashboard/email/thread/$threadId", params: { threadId: id } });
                  }}
                  onContactClick={(email) => {
                    navigate({ to: "/dashboard/contacts", search: { email } });
                  }}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </motion.div>
    </>
  );
}
