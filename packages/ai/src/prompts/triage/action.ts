// =============================================================================
// TRIAGE ACTION PROMPTS (PRD-07)
// =============================================================================
//
// LLM prompts for email triage action classification.
//

import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

export const ActionTypeSchema = z.enum([
  "respond",
  "archive",
  "delegate",
  "schedule",
  "wait",
  "escalate",
  "review",
]);

export type LLMActionType = z.infer<typeof ActionTypeSchema>;

export const TriageResultSchema = z.object({
  action: ActionTypeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  urgencyScore: z.number().min(0).max(1),
  importanceScore: z.number().min(0).max(1),
  priorityTier: z.enum(["urgent", "high", "medium", "low"]),
  details: z
    .object({
      delegateTo: z.string().optional(),
      delegateReason: z.string().optional(),
      scheduleSuggestion: z.string().optional(),
      waitReason: z.string().optional(),
      escalateReason: z.string().optional(),
      responseTimeframe: z.string().optional(),
    })
    .optional(),
});

export type TriageResult = z.infer<typeof TriageResultSchema>;

export const BatchTriageResultSchema = z.array(
  z.object({
    threadId: z.string(),
    result: TriageResultSchema,
  })
);

// =============================================================================
// PROMPTS
// =============================================================================

/**
 * Build the triage system prompt.
 */
export function buildTriageSystemPrompt(): string {
  return `You are an expert email triage assistant. Your task is to analyze emails and suggest the most appropriate action.

## Action Types

1. **respond** - Email needs a reply from the user
   - Contains a direct question
   - Requests input, feedback, or approval
   - Awaiting user's response

2. **archive** - Email can be filed away without action
   - FYI/informational only
   - Newsletters or marketing
   - Automated notifications
   - Already resolved discussions

3. **delegate** - Email should be handled by someone else
   - Outside user's area of responsibility
   - Better suited for another team member
   - Technical expertise needed elsewhere

4. **schedule** - Email needs dedicated time to address
   - Complex analysis or report needed
   - Lengthy response required
   - Requires research before responding

5. **wait** - No action needed now, monitor later
   - Waiting for external response
   - Active discussion still ongoing
   - Pending approval from others

6. **escalate** - Requires higher authority
   - Needs manager/leadership approval
   - Sensitive HR or legal matters
   - Budget decisions above authority

7. **review** - Unclear, needs manual review
   - Cannot determine appropriate action
   - Ambiguous situation

## Priority Assessment

### Urgency (time-sensitivity)
- Explicit deadlines mentioned
- Urgent language (ASAP, immediately, critical)
- VIP sender expecting quick response
- Questions awaiting answers
- Thread age (older = more urgent)

### Importance (business value)
- Sender importance (VIP, internal, external)
- Contains decisions or commitments
- Financial or legal implications
- Direct message vs broadcast
- Topic relevance

### Priority Matrix
- URGENT: High urgency + High importance (Do now)
- HIGH: High urgency OR High importance (Do soon)
- MEDIUM: Moderate scores (Handle when possible)
- LOW: Low urgency + Low importance (Can wait/archive)

## Response Format

Always respond with valid JSON matching this structure:
{
  "action": "respond" | "archive" | "delegate" | "schedule" | "wait" | "escalate" | "review",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this action is suggested",
  "urgencyScore": 0.0-1.0,
  "importanceScore": 0.0-1.0,
  "priorityTier": "urgent" | "high" | "medium" | "low",
  "details": {
    "delegateTo": "If delegating, suggest who/what role",
    "delegateReason": "Why delegate to this person",
    "scheduleSuggestion": "If scheduling, when to address",
    "waitReason": "If waiting, what we're waiting for",
    "escalateReason": "If escalating, why it needs escalation",
    "responseTimeframe": "Suggested timeframe to respond"
  }
}`;
}

/**
 * Build the triage user prompt for a single thread.
 */
export function buildTriageUserPrompt(thread: {
  subject: string;
  snippet?: string;
  bodyText?: string;
  sender: string;
  senderName?: string;
  isVIP?: boolean;
  isInternal?: boolean;
  participants: string[];
  lastMessageAt: Date;
  messageCount: number;
  classification?: string;
  claims?: Array<{ type: string; content: string; dueDate?: string }>;
}): string {
  const parts: string[] = [];

  parts.push("Analyze this email and suggest the appropriate action:");
  parts.push("");
  parts.push(`**Subject**: ${thread.subject}`);
  parts.push(
    `**From**: ${thread.senderName ?? thread.sender}${thread.isVIP ? " (VIP)" : ""}${thread.isInternal ? " (Internal)" : ""}`
  );
  parts.push(`**To/CC**: ${thread.participants.join(", ")}`);
  parts.push(`**Last Message**: ${thread.lastMessageAt.toISOString()}`);
  parts.push(`**Message Count**: ${thread.messageCount}`);

  if (thread.classification) {
    parts.push(`**Classification**: ${thread.classification}`);
  }

  parts.push("");
  parts.push("**Content Preview**:");
  parts.push(
    thread.snippet ?? thread.bodyText?.slice(0, 500) ?? "No content available"
  );

  if (thread.claims && thread.claims.length > 0) {
    parts.push("");
    parts.push("**Extracted Claims**:");
    for (const claim of thread.claims) {
      parts.push(
        `- [${claim.type}] ${claim.content}${claim.dueDate ? ` (Due: ${claim.dueDate})` : ""}`
      );
    }
  }

  parts.push("");
  parts.push(
    "Based on this email, provide your triage recommendation as JSON."
  );

  return parts.join("\n");
}

/**
 * Build prompt for batch triage of multiple threads.
 */
export function buildBatchTriagePrompt(
  threads: Array<{
    id: string;
    subject: string;
    snippet?: string;
    sender: string;
    isVIP?: boolean;
    isInternal?: boolean;
    lastMessageAt: Date;
    messageCount: number;
  }>
): string {
  const parts: string[] = [];

  parts.push(
    "Triage these emails and provide action recommendations for each:"
  );
  parts.push("");

  for (const thread of threads) {
    parts.push("---");
    parts.push(`**Thread ID**: ${thread.id}`);
    parts.push(`**Subject**: ${thread.subject}`);
    parts.push(
      `**From**: ${thread.sender}${thread.isVIP ? " (VIP)" : ""}${thread.isInternal ? " (Internal)" : ""}`
    );
    parts.push(`**Last Message**: ${thread.lastMessageAt.toISOString()}`);
    parts.push(`**Messages**: ${thread.messageCount}`);
    if (thread.snippet) {
      parts.push(`**Preview**: ${thread.snippet.slice(0, 200)}...`);
    }
    parts.push("");
  }

  parts.push("---");
  parts.push("");
  parts.push("Respond with a JSON array of triage results:");
  parts.push("```json");
  parts.push("[");
  parts.push(
    '  { "threadId": "...", "result": { action, confidence, reasoning, urgencyScore, importanceScore, priorityTier, details } },'
  );
  parts.push("  ...");
  parts.push("]");
  parts.push("```");

  return parts.join("\n");
}

// =============================================================================
// DELEGATION PROMPT
// =============================================================================

/**
 * Build prompt for delegation suggestions.
 */
export function buildDelegationPrompt(
  thread: {
    subject: string;
    snippet?: string;
    bodyText?: string;
  },
  teamMembers: Array<{
    name: string;
    email: string;
    role: string;
    expertise: string[];
  }>
): string {
  const parts: string[] = [];

  parts.push("Suggest who should handle this email based on team expertise:");
  parts.push("");
  parts.push(`**Subject**: ${thread.subject}`);
  parts.push(
    `**Content**: ${thread.snippet ?? thread.bodyText?.slice(0, 500) ?? ""}`
  );
  parts.push("");
  parts.push("**Available Team Members**:");

  for (const member of teamMembers) {
    parts.push(
      `- **${member.name}** (${member.role}): ${member.expertise.join(", ")}`
    );
  }

  parts.push("");
  parts.push("Respond with JSON:");
  parts.push("```json");
  parts.push("{");
  parts.push('  "delegateTo": "email@example.com",');
  parts.push('  "reason": "Why this person is best suited",');
  parts.push('  "confidence": 0.0-1.0');
  parts.push("}");
  parts.push("```");

  return parts.join("\n");
}

export const DelegationResultSchema = z.object({
  delegateTo: z.string().email(),
  reason: z.string(),
  confidence: z.number().min(0).max(1),
});

export type DelegationResult = z.infer<typeof DelegationResultSchema>;
