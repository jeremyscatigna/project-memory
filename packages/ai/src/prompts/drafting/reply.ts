// =============================================================================
// DRAFTING REPLY PROMPTS (PRD-08)
// =============================================================================
//
// LLM prompts for generating evidence-grounded email replies with citations.
//

import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

export const CitationSchema = z.object({
  id: z.string(),
  sourceType: z.enum(["thread", "message", "decision", "commitment"]),
  sourceId: z.string(),
  quotedText: z.string(),
  context: z.string().optional(),
});

export type Citation = z.infer<typeof CitationSchema>;

export const DraftReplySchema = z.object({
  subject: z.string().optional(),
  body: z.string(),
  citations: z.array(CitationSchema),
  tone: z.enum(["formal", "professional", "casual", "friendly"]),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).optional(),
});

export type DraftReply = z.infer<typeof DraftReplySchema>;

export const ConsistencyCheckSchema = z.object({
  isConsistent: z.boolean(),
  conflicts: z.array(
    z.object({
      draftStatement: z.string(),
      conflictingSource: z.string(),
      sourceId: z.string(),
      severity: z.enum(["critical", "warning", "info"]),
      suggestion: z.string(),
    })
  ),
  score: z.number().min(0).max(1),
});

export type ConsistencyCheck = z.infer<typeof ConsistencyCheckSchema>;

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface ThreadContext {
  id: string;
  subject: string;
  messages: Array<{
    id: string;
    from: string;
    fromName?: string;
    date: Date;
    bodyText: string;
    isFromUser: boolean;
  }>;
  claims: Array<{
    id: string;
    type: string;
    text: string;
    messageId?: string;
  }>;
}

export interface RelationshipContext {
  contactEmail: string;
  contactName?: string;
  company?: string;
  title?: string;
  relationshipSummary?: string;
  lastInteractionAt?: Date;
  totalThreads: number;
  sentimentScore?: number;
  isVip: boolean;
  communicationStyle?: string;
}

export interface HistoricalContext {
  relatedThreads: Array<{
    id: string;
    subject: string;
    date: Date;
    relevanceScore: number;
    summary?: string;
  }>;
  decisions: Array<{
    id: string;
    title: string;
    statement: string;
    decidedAt: Date;
  }>;
}

export interface CommitmentContext {
  openCommitments: Array<{
    id: string;
    title: string;
    direction: "owed_by_me" | "owed_to_me";
    dueDate?: Date;
    status: string;
  }>;
}

export interface DraftContext {
  thread: ThreadContext;
  relationship?: RelationshipContext;
  history?: HistoricalContext;
  commitments?: CommitmentContext;
  userIntent: string;
  userToneSamples?: string[];
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

export function buildDraftingSystemPrompt(): string {
  return `You are an expert email drafting assistant. Your role is to help write professional, contextual email replies that are:

1. **Grounded in evidence** - Every claim or reference should be backed by actual content from the conversation history
2. **Consistent with history** - Never contradict previous commitments, decisions, or statements
3. **Appropriately toned** - Match the user's communication style and the relationship context
4. **Concise yet complete** - Address all relevant points without unnecessary length

When drafting:
- Reference specific past discussions, decisions, or commitments when relevant
- Use citation markers [1], [2], etc. to link claims to sources
- Match the formality level of the conversation
- Be aware of any open commitments or pending items
- Flag any potential inconsistencies with past statements

Citation Format:
- Use [N] markers for inline citations
- Each citation should reference a specific message, thread, or decision
- Never fabricate quotes or references - only cite what's actually in the context

Response Format (JSON):
{
  "subject": "Optional - only if suggesting a subject change",
  "body": "The draft email body with [1] citation markers",
  "citations": [
    {
      "id": "1",
      "sourceType": "message|thread|decision|commitment",
      "sourceId": "The ID of the source",
      "quotedText": "The exact text being cited",
      "context": "Optional context about why this is relevant"
    }
  ],
  "tone": "formal|professional|casual|friendly",
  "confidence": 0.0-1.0,
  "warnings": ["Any concerns or caveats about the draft"]
}`;
}

// =============================================================================
// USER PROMPTS
// =============================================================================

export function buildReplyDraftPrompt(context: DraftContext): string {
  const {
    thread,
    relationship,
    history,
    commitments,
    userIntent,
    userToneSamples,
  } = context;

  let prompt = `Draft a reply to the following email thread.

## User Intent
${userIntent}

## Current Thread
Subject: ${thread.subject}

### Messages:
${thread.messages
  .map(
    (m) => `---
From: ${m.fromName ?? m.from} (${m.isFromUser ? "User" : "Other"})
Date: ${m.date.toISOString()}
${m.bodyText}
---`
  )
  .join("\n\n")}

### Extracted Claims from Thread:
${
  thread.claims.length > 0
    ? thread.claims.map((c) => `- [${c.type}] ${c.text}`).join("\n")
    : "No claims extracted."
}
`;

  if (relationship) {
    prompt += `
## Relationship Context
- Contact: ${relationship.contactName ?? relationship.contactEmail}
- Company: ${relationship.company ?? "Unknown"}
- Title: ${relationship.title ?? "Unknown"}
- Relationship: ${relationship.relationshipSummary ?? "No summary available"}
- VIP Status: ${relationship.isVip ? "Yes" : "No"}
- Communication Style: ${relationship.communicationStyle ?? "Professional"}
- Total Past Threads: ${relationship.totalThreads}
`;
  }

  if (
    history &&
    (history.relatedThreads.length > 0 || history.decisions.length > 0)
  ) {
    prompt += `
## Historical Context
`;
    if (history.relatedThreads.length > 0) {
      prompt += `
### Related Past Discussions:
${history.relatedThreads
  .map(
    (t) =>
      `- "${t.subject}" (${t.date.toISOString()}) - ${t.summary ?? "No summary"}`
  )
  .join("\n")}
`;
    }
    if (history.decisions.length > 0) {
      prompt += `
### Relevant Decisions:
${history.decisions
  .map(
    (d) =>
      `- ${d.title}: "${d.statement}" (decided ${d.decidedAt.toISOString()})`
  )
  .join("\n")}
`;
    }
  }

  if (commitments && commitments.openCommitments.length > 0) {
    prompt += `
## Open Commitments
${commitments.openCommitments
  .map(
    (c) =>
      `- ${c.direction === "owed_by_me" ? "You owe" : "They owe"}: ${c.title} (${c.status}${c.dueDate ? `, due ${c.dueDate.toISOString()}` : ""})`
  )
  .join("\n")}
`;
  }

  if (userToneSamples && userToneSamples.length > 0) {
    prompt += `
## User Writing Samples (for tone matching)
${userToneSamples.map((s, i) => `Sample ${i + 1}: "${s.slice(0, 200)}..."`).join("\n")}
`;
  }

  prompt += `
## Instructions
Generate a reply that:
1. Addresses the intent: "${userIntent}"
2. Is grounded in the conversation context
3. References relevant history where appropriate
4. Acknowledges any open commitments if relevant
5. Matches the appropriate tone for this relationship

Respond with a JSON object following the schema.`;

  return prompt;
}

// =============================================================================
// CONSISTENCY CHECK PROMPT
// =============================================================================

export function buildConsistencyCheckPrompt(
  draft: string,
  historicalStatements: Array<{
    id: string;
    text: string;
    source: string;
    date: Date;
  }>
): string {
  return `Check the following draft email for consistency with historical statements.

## Draft Email
${draft}

## Historical Statements to Check Against
${historicalStatements
  .map(
    (s) => `[${s.id}] From "${s.source}" on ${s.date.toISOString()}:
"${s.text}"`
  )
  .join("\n\n")}

## Instructions
Analyze the draft for any statements that might contradict the historical record.

Respond with JSON:
{
  "isConsistent": true|false,
  "conflicts": [
    {
      "draftStatement": "The statement from the draft that conflicts",
      "conflictingSource": "Brief description of what it conflicts with",
      "sourceId": "ID of the historical statement",
      "severity": "critical|warning|info",
      "suggestion": "How to resolve the conflict"
    }
  ],
  "score": 0.0-1.0 (1.0 = fully consistent)
}`;
}

// =============================================================================
// TONE ANALYSIS PROMPT
// =============================================================================

export const ToneAnalysisSchema = z.object({
  detectedTone: z.enum(["formal", "professional", "casual", "friendly"]),
  characteristics: z.array(z.string()),
  averageSentenceLength: z.number(),
  formalityScore: z.number().min(0).max(1),
  suggestions: z.array(z.string()).optional(),
});

export type ToneAnalysis = z.infer<typeof ToneAnalysisSchema>;

export function buildToneAnalysisPrompt(samples: string[]): string {
  return `Analyze the writing style and tone from these email samples.

## Email Samples
${samples.map((s, i) => `### Sample ${i + 1}\n${s}`).join("\n\n")}

## Instructions
Analyze the writing style to identify:
1. Overall tone (formal, professional, casual, friendly)
2. Characteristic patterns (sentence structure, vocabulary, greetings, sign-offs)
3. Average sentence length
4. Formality level (0-1 scale)

Respond with JSON:
{
  "detectedTone": "formal|professional|casual|friendly",
  "characteristics": ["List of style characteristics"],
  "averageSentenceLength": number,
  "formalityScore": 0.0-1.0,
  "suggestions": ["Optional suggestions for matching this style"]
}`;
}

// =============================================================================
// TONE ADJUSTMENT PROMPT
// =============================================================================

export function buildToneAdjustmentPrompt(
  draft: string,
  targetTone: ToneAnalysis
): string {
  return `Adjust the following draft to match the target writing style.

## Current Draft
${draft}

## Target Style
- Tone: ${targetTone.detectedTone}
- Formality Score: ${targetTone.formalityScore}
- Characteristics: ${targetTone.characteristics.join(", ")}
- Average Sentence Length: ${targetTone.averageSentenceLength} words

## Instructions
Rewrite the draft to match the target style while preserving:
1. The core message and intent
2. All factual claims and citations
3. The overall structure

Only adjust:
- Word choice
- Sentence structure
- Greetings and sign-offs
- Level of formality

Respond with just the adjusted draft text (no JSON, no explanation).`;
}
