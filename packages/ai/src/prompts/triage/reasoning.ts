// =============================================================================
// TRIAGE REASONING PROMPTS (PRD-07)
// =============================================================================
//
// LLM prompts for generating human-readable explanations of triage decisions.
//

import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

export const ReasoningExplanationSchema = z.object({
  summary: z.string(),
  factors: z.array(
    z.object({
      factor: z.string(),
      impact: z.enum(["positive", "negative", "neutral"]),
      description: z.string(),
    })
  ),
  alternatives: z
    .array(
      z.object({
        action: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
  caveats: z.array(z.string()).optional(),
});

export type ReasoningExplanation = z.infer<typeof ReasoningExplanationSchema>;

// =============================================================================
// PROMPTS
// =============================================================================

/**
 * Build prompt for generating detailed reasoning explanation.
 */
export function buildReasoningExplanationPrompt(
  thread: {
    subject: string;
    snippet?: string;
    sender: string;
    lastMessageAt: Date;
  },
  decision: {
    action: string;
    urgencyScore: number;
    importanceScore: number;
    priorityTier: string;
  }
): string {
  return `Explain why this email triage decision was made in a way a user would understand.

**Email**:
- Subject: ${thread.subject}
- From: ${thread.sender}
- Preview: ${thread.snippet ?? "N/A"}
- Last Message: ${thread.lastMessageAt.toISOString()}

**Decision**:
- Action: ${decision.action}
- Priority: ${decision.priorityTier}
- Urgency Score: ${(decision.urgencyScore * 100).toFixed(0)}%
- Importance Score: ${(decision.importanceScore * 100).toFixed(0)}%

Provide a detailed explanation as JSON:
{
  "summary": "One sentence summary of why this action was suggested",
  "factors": [
    {
      "factor": "Name of factor (e.g., 'Sender importance', 'Deadline mentioned')",
      "impact": "positive" | "negative" | "neutral",
      "description": "How this factor influenced the decision"
    }
  ],
  "alternatives": [
    {
      "action": "Alternative action that was considered",
      "reason": "Why it wasn't chosen"
    }
  ],
  "caveats": ["Any important considerations the user should be aware of"]
}`;
}

/**
 * Build prompt for generating inbox summary.
 */
export function buildInboxSummaryPrompt(
  stats: {
    total: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
    needsResponse: number;
    canArchive: number;
  },
  topItems: Array<{
    subject: string;
    action: string;
    reason: string;
  }>
): string {
  return `Generate a brief inbox summary for the user based on triage results.

**Inbox Statistics**:
- Total unprocessed: ${stats.total}
- Urgent: ${stats.urgent}
- High priority: ${stats.high}
- Medium priority: ${stats.medium}
- Low priority: ${stats.low}
- Needs response: ${stats.needsResponse}
- Can be archived: ${stats.canArchive}

**Top Priority Items**:
${topItems.map((item, i) => `${i + 1}. "${item.subject}" - ${item.action}: ${item.reason}`).join("\n")}

Generate a friendly, concise summary (2-3 sentences) that helps the user understand their inbox state and what to focus on first. Include specific numbers and actionable guidance.`;
}

export const InboxSummarySchema = z.object({
  summary: z.string(),
  focusRecommendation: z.string(),
  quickWins: z.array(z.string()).optional(),
});

export type InboxSummary = z.infer<typeof InboxSummarySchema>;

// =============================================================================
// GROUPING PROMPTS
// =============================================================================

/**
 * Build prompt for smart grouping of emails.
 */
export function buildGroupingPrompt(
  threads: Array<{
    id: string;
    subject: string;
    sender: string;
    action: string;
  }>
): string {
  const threadsList = threads
    .map(
      (t) =>
        `- ID: ${t.id}, Subject: "${t.subject}", From: ${t.sender}, Action: ${t.action}`
    )
    .join("\n");

  return `Group these emails into logical batches that can be processed together.

**Emails**:
${threadsList}

Group by:
1. Same sender - similar emails from same person
2. Same topic - emails about the same subject/project
3. Same action - emails that need the same action type
4. Related threads - emails that reference each other

Respond with JSON:
{
  "groups": [
    {
      "name": "Group name (e.g., 'Updates from John', 'Project X Discussion')",
      "reason": "Why these are grouped",
      "threadIds": ["id1", "id2"],
      "suggestedBatchAction": "Common action for the group"
    }
  ],
  "ungrouped": ["ids that don't fit any group"]
}`;
}

export const GroupingResultSchema = z.object({
  groups: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      threadIds: z.array(z.string()),
      suggestedBatchAction: z.string().optional(),
    })
  ),
  ungrouped: z.array(z.string()),
});

export type GroupingResult = z.infer<typeof GroupingResultSchema>;

// =============================================================================
// RULE SUGGESTION PROMPTS
// =============================================================================

/**
 * Build prompt for suggesting automation rules based on user behavior.
 */
export function buildRuleSuggestionPrompt(
  patterns: Array<{
    condition: string;
    actionTaken: string;
    frequency: number;
  }>
): string {
  const patternsList = patterns
    .map(
      (p) =>
        `- When ${p.condition}: User ${p.actionTaken} (${p.frequency} times)`
    )
    .join("\n");

  return `Based on the user's email handling patterns, suggest automation rules.

**Observed Patterns**:
${patternsList}

Suggest rules that would automate common actions. Each rule should:
- Have a clear trigger condition
- Have a specific action to take
- Be explained in plain language

Respond with JSON:
{
  "suggestedRules": [
    {
      "name": "Rule name",
      "description": "What this rule does in plain language",
      "trigger": {
        "type": "sender" | "subject" | "content" | "label",
        "condition": "contains" | "equals" | "matches",
        "value": "The value to match"
      },
      "action": "archive" | "label" | "forward" | "priority",
      "actionValue": "Label name or forward address if applicable",
      "confidence": 0.0-1.0
    }
  ]
}`;
}

export const RuleSuggestionSchema = z.object({
  suggestedRules: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      trigger: z.object({
        type: z.enum(["sender", "subject", "content", "label"]),
        condition: z.enum(["contains", "equals", "matches"]),
        value: z.string(),
      }),
      action: z.enum(["archive", "label", "forward", "priority"]),
      actionValue: z.string().optional(),
      confidence: z.number().min(0).max(1),
    })
  ),
});

export type RuleSuggestion = z.infer<typeof RuleSuggestionSchema>;
