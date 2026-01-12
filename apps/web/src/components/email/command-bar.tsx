"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  Loader2,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Tag,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: "thread" | "message" | "commitment" | "decision" | "contact";
  title: string;
  snippet: string;
  confidence: number;
  metadata?: {
    threadId?: string;
    date?: string;
    sender?: string;
  };
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface AIResponse {
  answer: string;
  citations: Array<{
    id: string;
    text: string;
    source: string;
    threadId?: string;
  }>;
  confidence: number;
  followUpQuestions?: string[];
}

type CommandMode = "search" | "ask" | "navigate" | "action";

// =============================================================================
// COMMAND BAR COMPONENT
// =============================================================================

export function CommandBar({ open, onOpenChange }: CommandBarProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<CommandMode>("search");
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const trpc = useTRPC();

  // Detect mode from query
  useEffect(() => {
    if (query.startsWith("?") || query.startsWith("ask ")) {
      setMode("ask");
    } else if (query.startsWith(">") || query.startsWith("go ")) {
      setMode("navigate");
    } else if (query.startsWith("!") || query.startsWith("do ")) {
      setMode("action");
    } else {
      setMode("search");
    }
  }, [query]);

  // Search query
  const cleanQuery = query
    .replace(/^[?!>]/, "")
    .replace(/^(ask|go|do)\s+/i, "")
    .trim();

  const { data: searchResults, isLoading: isSearching } = useQuery({
    ...trpc.search.query.queryOptions({
      query: cleanQuery,
      limit: 10,
      includeTypes: ["thread", "message", "commitment", "decision"],
    }),
    enabled: mode === "search" && cleanQuery.length > 2,
  });

  // Ask AI mutation
  const askAIMutation = useMutation({
    ...trpc.search.askQuestion.mutationOptions(),
    onSuccess: (data) => {
      setAiResponse(data as AIResponse);
      setIsAskingAI(false);
    },
    onError: () => {
      setIsAskingAI(false);
    },
  });

  // Handle ask AI
  const handleAskAI = useCallback(() => {
    if (cleanQuery.length < 3) return;
    setIsAskingAI(true);
    askAIMutation.mutate({ question: cleanQuery });
  }, [cleanQuery, askAIMutation]);

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: "inbox",
      label: "Go to Inbox",
      description: "View your email inbox",
      icon: <Inbox className="h-4 w-4" />,
      shortcut: "G I",
      action: () => {
        onOpenChange(false);
        window.location.href = "/dashboard/email";
      },
    },
    {
      id: "commitments",
      label: "View Commitments",
      description: "See all tracked commitments",
      icon: <CheckCircle2 className="h-4 w-4" />,
      shortcut: "G C",
      action: () => {
        onOpenChange(false);
        window.location.href = "/dashboard/commitments";
      },
    },
    {
      id: "decisions",
      label: "View Decisions",
      description: "Browse decision history",
      icon: <BookOpen className="h-4 w-4" />,
      shortcut: "G D",
      action: () => {
        onOpenChange(false);
        window.location.href = "/dashboard/decisions";
      },
    },
    {
      id: "contacts",
      label: "View Contacts",
      description: "Relationship intelligence",
      icon: <Users className="h-4 w-4" />,
      shortcut: "G R",
      action: () => {
        onOpenChange(false);
        window.location.href = "/dashboard/contacts";
      },
    },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setAiResponse(null);
      setMode("search");
    }
  }, [open]);

  const getModeIcon = () => {
    switch (mode) {
      case "ask":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case "navigate":
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case "action":
        return <Zap className="h-4 w-4 text-amber-500" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case "ask":
        return "Ask your email";
      case "navigate":
        return "Navigate to...";
      case "action":
        return "Quick action";
      default:
        return "Search everything";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border-0 bg-background/95 backdrop-blur-xl max-w-2xl">
        <DialogTitle className="sr-only">Command Bar</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {/* Input */}
          <div className="flex items-center border-b px-3 py-2">
            <div className="mr-2 flex items-center gap-2">
              {getModeIcon()}
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {getModeLabel()}
              </span>
            </div>
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search, ask questions, or navigate..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {mode === "ask" && cleanQuery.length > 2 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAskAI}
                disabled={isAskingAI}
                className="ml-2 shrink-0"
              >
                {isAskingAI ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Ask AI
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Mode hints */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
            <Badge
              variant={mode === "search" ? "default" : "outline"}
              className="text-[10px] cursor-pointer"
              onClick={() => setQuery("")}
            >
              search
            </Badge>
            <Badge
              variant={mode === "ask" ? "default" : "outline"}
              className="text-[10px] cursor-pointer"
              onClick={() => setQuery("? ")}
            >
              ? ask AI
            </Badge>
            <Badge
              variant={mode === "navigate" ? "default" : "outline"}
              className="text-[10px] cursor-pointer"
              onClick={() => setQuery("> ")}
            >
              {">"} navigate
            </Badge>
            <Badge
              variant={mode === "action" ? "default" : "outline"}
              className="text-[10px] cursor-pointer"
              onClick={() => setQuery("! ")}
            >
              ! action
            </Badge>
          </div>

          {/* Results */}
          <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              {/* AI Response */}
              {aiResponse && mode === "ask" && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 border-b"
                >
                  <AIResponseView
                    response={aiResponse}
                    onCitationClick={(threadId) => {
                      onOpenChange(false);
                      if (threadId) {
                        window.location.href = `/dashboard/email/thread/${threadId}`;
                      }
                    }}
                    onFollowUp={(q) => setQuery(`? ${q}`)}
                  />
                </motion.div>
              )}

              {/* Loading */}
              {(isSearching || isAskingAI) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4"
                >
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-3/4" />
                  </div>
                </motion.div>
              )}

              {/* Search Results */}
              {!isSearching &&
                !isAskingAI &&
                searchResults?.results &&
                searchResults.results.length > 0 && (
                  <Command.Group heading="Results">
                    {searchResults.results.map((result) => (
                      <SearchResultItem
                        key={result.id}
                        result={result as SearchResult}
                        onSelect={() => {
                          onOpenChange(false);
                          if (result.metadata?.threadId) {
                            window.location.href = `/dashboard/email/thread/${result.metadata.threadId}`;
                          }
                        }}
                      />
                    ))}
                  </Command.Group>
                )}

              {/* Quick Actions */}
              {!query && (
                <Command.Group heading="Quick Actions">
                  {quickActions.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={action.label}
                      onSelect={action.action}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      {action.shortcut && (
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                          {action.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Navigation */}
              {mode === "navigate" && (
                <Command.Group heading="Navigate">
                  <NavigationItem
                    icon={<Inbox />}
                    label="Inbox"
                    description="All your emails"
                    href="/dashboard/email"
                    onSelect={() => onOpenChange(false)}
                  />
                  <NavigationItem
                    icon={<Star />}
                    label="Starred"
                    description="Important threads"
                    href="/dashboard/email?filter=starred"
                    onSelect={() => onOpenChange(false)}
                  />
                  <NavigationItem
                    icon={<Clock />}
                    label="Snoozed"
                    description="Come back later"
                    href="/dashboard/email?filter=snoozed"
                    onSelect={() => onOpenChange(false)}
                  />
                  <NavigationItem
                    icon={<Archive />}
                    label="Archive"
                    description="Archived threads"
                    href="/dashboard/email?filter=archived"
                    onSelect={() => onOpenChange(false)}
                  />
                  <NavigationItem
                    icon={<CheckCircle2 />}
                    label="Commitments"
                    description="Track promises & tasks"
                    href="/dashboard/commitments"
                    onSelect={() => onOpenChange(false)}
                  />
                  <NavigationItem
                    icon={<BookOpen />}
                    label="Decisions"
                    description="Decision history"
                    href="/dashboard/decisions"
                    onSelect={() => onOpenChange(false)}
                  />
                  <NavigationItem
                    icon={<Users />}
                    label="Contacts"
                    description="Relationship intelligence"
                    href="/dashboard/contacts"
                    onSelect={() => onOpenChange(false)}
                  />
                </Command.Group>
              )}

              {/* Actions */}
              {mode === "action" && (
                <Command.Group heading="Actions">
                  <ActionItem
                    icon={<MessageSquare />}
                    label="Compose new email"
                    description="Start a new conversation"
                    onSelect={() => {
                      onOpenChange(false);
                      // TODO: Open compose modal
                    }}
                  />
                  <ActionItem
                    icon={<Bell />}
                    label="Mark all as read"
                    description="Clear unread notifications"
                    onSelect={() => {
                      onOpenChange(false);
                      // TODO: Mark all read
                    }}
                  />
                  <ActionItem
                    icon={<Calendar />}
                    label="Schedule follow-up"
                    description="Set a reminder"
                    onSelect={() => {
                      onOpenChange(false);
                      // TODO: Open scheduler
                    }}
                  />
                  <ActionItem
                    icon={<Tag />}
                    label="Apply label"
                    description="Organize with labels"
                    onSelect={() => {
                      onOpenChange(false);
                      // TODO: Open label picker
                    }}
                  />
                </Command.Group>
              )}

              {/* Empty state */}
              {!isSearching &&
                !isAskingAI &&
                cleanQuery.length > 2 &&
                searchResults?.results?.length === 0 && (
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found. Try asking AI with "? {cleanQuery}"
                  </Command.Empty>
                )}
            </AnimatePresence>
          </Command.List>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1">↵</kbd> select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1">esc</kbd> close
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              <span>AI-powered search</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function SearchResultItem({
  result,
  onSelect,
}: {
  result: SearchResult;
  onSelect: () => void;
}) {
  const getTypeIcon = () => {
    switch (result.type) {
      case "thread":
        return <MessageSquare className="h-4 w-4" />;
      case "commitment":
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case "decision":
        return <BookOpen className="h-4 w-4 text-purple-500" />;
      case "contact":
        return <Users className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Command.Item
      value={result.title}
      onSelect={onSelect}
      className="flex items-start gap-3 cursor-pointer"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background shrink-0 mt-0.5">
        {getTypeIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{result.title}</p>
          <ConfidenceBadge confidence={result.confidence} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {result.snippet}
        </p>
        {result.metadata?.date && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {result.metadata.sender} • {result.metadata.date}
          </p>
        )}
      </div>
    </Command.Item>
  );
}

function AIResponseView({
  response,
  onCitationClick,
  onFollowUp,
}: {
  response: AIResponse;
  onCitationClick: (threadId?: string) => void;
  onFollowUp: (question: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Answer */}
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 shrink-0">
          <Sparkles className="h-4 w-4 text-purple-500" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-purple-500">
              AI Answer
            </span>
            <ConfidenceBadge confidence={response.confidence} />
          </div>
          <p className="text-sm leading-relaxed">{response.answer}</p>
        </div>
      </div>

      {/* Citations */}
      {response.citations.length > 0 && (
        <div className="pl-11 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Sources:</p>
          <div className="space-y-1.5">
            {response.citations.map((citation, i) => (
              <button
                key={citation.id}
                type="button"
                onClick={() => onCitationClick(citation.threadId)}
                className="flex items-start gap-2 w-full text-left p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center justify-center h-5 w-5 rounded bg-purple-500/10 text-purple-500 text-[10px] font-medium shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {citation.source}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {citation.text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up questions */}
      {response.followUpQuestions && response.followUpQuestions.length > 0 && (
        <div className="pl-11 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Related questions:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {response.followUpQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => onFollowUp(q)}
                className="text-xs px-2 py-1 rounded-full border bg-background hover:bg-muted transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NavigationItem({
  icon,
  label,
  description,
  href,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  href: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={() => {
        onSelect();
        window.location.href = href;
      }}
      className="flex items-center gap-3 cursor-pointer"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Command.Item>
  );
}

function ActionItem({
  icon,
  label,
  description,
  onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={label}
      onSelect={onSelect}
      className="flex items-center gap-3 cursor-pointer"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </Command.Item>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const level =
    confidence >= 0.8 ? "high" : confidence >= 0.5 ? "medium" : "low";
  const colors = {
    high: "bg-green-500/10 text-green-600 border-green-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[level]}`}
    >
      {Math.round(confidence * 100)}%
    </span>
  );
}

// =============================================================================
// HOOK FOR GLOBAL COMMAND BAR
// =============================================================================

export function useCommandBar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return { open, setOpen };
}
