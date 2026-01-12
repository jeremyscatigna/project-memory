"use client";

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
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  HelpCircle,
  Link2,
  MessageSquare,
  MoreHorizontal,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

export interface CommitmentData {
  id: string;
  title: string;
  description?: string;
  debtor: {
    email: string;
    name: string;
  };
  creditor?: {
    email: string;
    name: string;
  };
  dueDate?: Date;
  status: "pending" | "completed" | "overdue" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  confidence: number;
  evidence: EvidenceLink[];
  extractedFrom: string; // messageId
  reasoning?: string;
}

export interface DecisionData {
  id: string;
  title: string;
  statement: string;
  rationale?: string;
  maker: {
    email: string;
    name: string;
  };
  date: Date;
  category?: string;
  supersedes?: string;
  confidence: number;
  evidence: EvidenceLink[];
  extractedFrom: string;
  alternatives?: Array<{
    title: string;
    description: string;
    rejectionReason?: string;
  }>;
}

export interface OpenQuestionData {
  id: string;
  question: string;
  askedBy: {
    email: string;
    name: string;
  };
  askedAt: Date;
  context?: string;
  isAnswered: boolean;
  answeredBy?: {
    email: string;
    name: string;
  };
  answeredAt?: Date;
  confidence: number;
}

export interface RiskWarningData {
  id: string;
  type: "contradiction" | "sensitive_data" | "fraud" | "policy";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  evidence: EvidenceLink[];
}

export interface EvidenceLink {
  id: string;
  type: "message" | "thread" | "attachment";
  title: string;
  snippet: string;
  messageId?: string;
  timestamp?: Date;
}

interface IntelligencePanelProps {
  threadId: string;
  commitments: CommitmentData[];
  decisions: DecisionData[];
  openQuestions: OpenQuestionData[];
  riskWarnings?: RiskWarningData[];
  isLoading?: boolean;
  onEvidenceClick?: (evidence: EvidenceLink) => void;
  onCommitmentAction?: (id: string, action: "complete" | "dismiss" | "edit") => void;
  onFeedback?: (type: "commitment" | "decision", id: string, positive: boolean) => void;
  className?: string;
}

// =============================================================================
// INTELLIGENCE PANEL
// =============================================================================

export function IntelligencePanel({
  threadId,
  commitments,
  decisions,
  openQuestions,
  riskWarnings = [],
  isLoading = false,
  onEvidenceClick,
  onCommitmentAction,
  onFeedback,
  className,
}: IntelligencePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["commitments", "decisions", "questions"])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (isLoading) {
    return <IntelligencePanelSkeleton />;
  }

  const hasContent =
    commitments.length > 0 ||
    decisions.length > 0 ||
    openQuestions.length > 0 ||
    riskWarnings.length > 0;

  if (!hasContent) {
    return (
      <div className={cn("p-4", className)}>
        <div className="flex flex-col items-center justify-center text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No intelligence extracted yet
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            AI analysis in progress...
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-semibold">Thread Intelligence</h3>
        </div>

        {/* Risk warnings (always visible when present) */}
        {riskWarnings.length > 0 && (
          <div className="space-y-2">
            {riskWarnings.map((warning) => (
              <RiskWarningCard
                key={warning.id}
                warning={warning}
                onEvidenceClick={onEvidenceClick}
              />
            ))}
          </div>
        )}

        {/* Commitments */}
        {commitments.length > 0 && (
          <IntelligenceSection
            title="Commitments"
            icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />}
            count={commitments.length}
            expanded={expandedSections.has("commitments")}
            onToggle={() => toggleSection("commitments")}
            color="blue"
          >
            <div className="space-y-2">
              {commitments.map((commitment) => (
                <CommitmentCard
                  key={commitment.id}
                  commitment={commitment}
                  onEvidenceClick={onEvidenceClick}
                  onAction={onCommitmentAction}
                  onFeedback={onFeedback}
                />
              ))}
            </div>
          </IntelligenceSection>
        )}

        {/* Decisions */}
        {decisions.length > 0 && (
          <IntelligenceSection
            title="Decisions"
            icon={<BookOpen className="h-4 w-4 text-purple-500" />}
            count={decisions.length}
            expanded={expandedSections.has("decisions")}
            onToggle={() => toggleSection("decisions")}
            color="purple"
          >
            <div className="space-y-2">
              {decisions.map((decision) => (
                <DecisionCard
                  key={decision.id}
                  decision={decision}
                  onEvidenceClick={onEvidenceClick}
                  onFeedback={onFeedback}
                />
              ))}
            </div>
          </IntelligenceSection>
        )}

        {/* Open questions */}
        {openQuestions.length > 0 && (
          <IntelligenceSection
            title="Open Questions"
            icon={<HelpCircle className="h-4 w-4 text-amber-500" />}
            count={openQuestions.filter((q) => !q.isAnswered).length}
            expanded={expandedSections.has("questions")}
            onToggle={() => toggleSection("questions")}
            color="amber"
          >
            <div className="space-y-2">
              {openQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          </IntelligenceSection>
        )}
      </div>
    </ScrollArea>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function IntelligenceSection({
  title,
  icon,
  count,
  expanded,
  onToggle,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  color: "blue" | "purple" | "amber" | "red";
  children: React.ReactNode;
}) {
  const colors = {
    blue: "bg-blue-500/10 border-blue-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
    amber: "bg-amber-500/10 border-amber-500/20",
    red: "bg-red-500/10 border-red-500/20",
  };

  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 w-full p-2 rounded-lg border transition-colors",
            colors[color],
            "hover:bg-accent"
          )}
        >
          {icon}
          <span className="text-sm font-medium">{title}</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {count}
          </Badge>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CommitmentCard({
  commitment,
  onEvidenceClick,
  onAction,
  onFeedback,
}: {
  commitment: CommitmentData;
  onEvidenceClick?: (evidence: EvidenceLink) => void;
  onAction?: (id: string, action: "complete" | "dismiss" | "edit") => void;
  onFeedback?: (type: "commitment" | "decision", id: string, positive: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusConfig = {
    pending: { color: "bg-blue-500", label: "Pending" },
    completed: { color: "bg-green-500", label: "Completed" },
    overdue: { color: "bg-red-500", label: "Overdue" },
    cancelled: { color: "bg-gray-500", label: "Cancelled" },
  };

  const status = statusConfig[commitment.status];
  const isOverdue =
    commitment.dueDate &&
    commitment.dueDate < new Date() &&
    commitment.status === "pending";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2",
        isOverdue && "border-red-500/50"
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <div
          className={cn("h-2 w-2 rounded-full mt-1.5 shrink-0", status.color)}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{commitment.title}</p>
          {commitment.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {commitment.description}
            </p>
          )}
        </div>
        <ConfidenceIndicator confidence={commitment.confidence} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {commitment.debtor.name}
        </span>
        {commitment.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1",
              isOverdue && "text-red-500"
            )}
          >
            <Calendar className="h-3 w-3" />
            {isOverdue ? "Overdue: " : "Due: "}
            {formatDistanceToNow(commitment.dueDate, { addSuffix: true })}
          </span>
        )}
        <PriorityBadge priority={commitment.priority} />
      </div>

      {/* Evidence */}
      {commitment.evidence.length > 0 && (
        <div className="flex items-center gap-1 pt-1">
          <Link2 className="h-3 w-3 text-muted-foreground" />
          {commitment.evidence.slice(0, 2).map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEvidenceClick?.(ev)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
            >
              {ev.title}
            </button>
          ))}
          {commitment.evidence.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{commitment.evidence.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onFeedback?.("commitment", commitment.id, true)}
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Correct extraction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onFeedback?.("commitment", commitment.id, false)}
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Incorrect extraction</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-1">
          {commitment.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => onAction?.(commitment.id, "complete")}
            >
              <Check className="h-3 w-3 mr-1" />
              Complete
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onAction?.(commitment.id, "edit")}
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DecisionCard({
  decision,
  onEvidenceClick,
  onFeedback,
}: {
  decision: DecisionData;
  onEvidenceClick?: (evidence: EvidenceLink) => void;
  onFeedback?: (type: "commitment" | "decision", id: string, positive: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start gap-2">
        <BookOpen className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{decision.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {decision.statement}
          </p>
        </div>
        <ConfidenceIndicator confidence={decision.confidence} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {decision.maker.name}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(decision.date, { addSuffix: true })}
        </span>
        {decision.category && (
          <Badge variant="outline" className="text-[10px]">
            {decision.category}
          </Badge>
        )}
      </div>

      {/* Rationale (expandable) */}
      {decision.rationale && (
        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              View rationale
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="text-xs text-muted-foreground mt-1 p-2 rounded bg-muted/50">
              {decision.rationale}
            </p>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Evidence */}
      {decision.evidence.length > 0 && (
        <div className="flex items-center gap-1 pt-1">
          <Link2 className="h-3 w-3 text-muted-foreground" />
          {decision.evidence.slice(0, 2).map((ev) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onEvidenceClick?.(ev)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 transition-colors"
            >
              {ev.title}
            </button>
          ))}
        </div>
      )}

      {/* Feedback */}
      <div className="flex items-center gap-1 pt-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onFeedback?.("decision", decision.id, true)}
              >
                <ThumbsUp className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Correct extraction</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onFeedback?.("decision", decision.id, false)}
              >
                <ThumbsDown className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Incorrect extraction</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

function QuestionCard({ question }: { question: OpenQuestionData }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 space-y-2",
        question.isAnswered && "opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        <HelpCircle
          className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            question.isAnswered ? "text-green-500" : "text-amber-500"
          )}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm">{question.question}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {question.askedBy.name}
            </span>
            <span>•</span>
            <span>
              {formatDistanceToNow(question.askedAt, { addSuffix: true })}
            </span>
          </div>
        </div>
        <ConfidenceIndicator confidence={question.confidence} />
      </div>

      {question.isAnswered && question.answeredBy && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <Check className="h-3 w-3" />
          Answered by {question.answeredBy.name}
        </div>
      )}
    </div>
  );
}

function RiskWarningCard({
  warning,
  onEvidenceClick,
}: {
  warning: RiskWarningData;
  onEvidenceClick?: (evidence: EvidenceLink) => void;
}) {
  const severityConfig = {
    low: {
      color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/30",
      icon: AlertCircle,
    },
    medium: {
      color: "text-amber-600 bg-amber-500/10 border-amber-500/30",
      icon: AlertTriangle,
    },
    high: {
      color: "text-orange-600 bg-orange-500/10 border-orange-500/30",
      icon: AlertTriangle,
    },
    critical: {
      color: "text-red-600 bg-red-500/10 border-red-500/30",
      icon: ShieldAlert,
    },
  };

  const severity = severityConfig[warning.severity];
  const Icon = severity.icon;

  return (
    <div className={cn("rounded-lg border p-3 space-y-2", severity.color)}>
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{warning.title}</p>
          <p className="text-xs mt-0.5 opacity-90">{warning.description}</p>
        </div>
        <Badge
          variant="outline"
          className={cn("text-[10px] shrink-0", severity.color)}
        >
          {warning.severity}
        </Badge>
      </div>

      <div className="text-xs pl-6">
        <span className="font-medium">Recommendation:</span>{" "}
        {warning.recommendation}
      </div>
    </div>
  );
}

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low";
  const config = {
    high: { color: "bg-green-500", label: "High confidence" },
    medium: { color: "bg-amber-500", label: "Medium confidence" },
    low: { color: "bg-red-500", label: "Low confidence" },
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-0.5">
            {[0.33, 0.66, 1].map((threshold, i) => (
              <div
                key={threshold}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  confidence >= threshold ? config[level].color : "bg-muted"
                )}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {config[level].label} ({Math.round(confidence * 100)}%)
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: "low" | "medium" | "high" | "urgent";
}) {
  const config = {
    low: { color: "text-muted-foreground", label: "Low" },
    medium: { color: "text-blue-500", label: "Medium" },
    high: { color: "text-amber-500", label: "High" },
    urgent: { color: "text-red-500", label: "Urgent" },
  };

  if (priority === "low" || priority === "medium") return null;

  return (
    <span className={cn("text-[10px] font-medium", config[priority].color)}>
      {config[priority].label}
    </span>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function IntelligencePanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
