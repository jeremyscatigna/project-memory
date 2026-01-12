// =============================================================================
// DRAFTING FOLLOW-UP PROMPTS (PRD-08)
// =============================================================================
//
// LLM prompts for generating context-aware follow-up emails.
//

import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

export const FollowUpDraftSchema = z.object({
  subject: z.string(),
  body: z.string(),
  tone: z.enum(["gentle", "firm", "urgent", "casual"]),
  urgencyLevel: z.enum(["low", "medium", "high"]),
  suggestedSendTime: z.string().optional(),
  alternativeApproaches: z
    .array(
      z.object({
        approach: z.string(),
        body: z.string(),
      })
    )
    .optional(),
});

export type FollowUpDraft = z.infer<typeof FollowUpDraftSchema>;

// =============================================================================
// CONTEXT TYPES
// =============================================================================

export interface FollowUpContext {
  commitment: {
    id: string;
    title: string;
    description?: string;
    direction: "owed_by_me" | "owed_to_me";
    dueDate?: Date;
    status: string;
    originalText?: string;
  };
  contact: {
    email: string;
    name?: string;
    company?: string;
    isVip: boolean;
    responseRate?: number;
    avgResponseTimeHours?: number;
  };
  originalThread?: {
    subject: string;
    lastMessageDate: Date;
    lastMessageFrom: string;
  };
  daysSinceCommitment: number;
  previousFollowUps: number;
}

// =============================================================================
// PROMPTS
// =============================================================================

export function buildFollowUpSystemPrompt(): string {
  return `You are an expert at writing follow-up emails that are professional, effective, and maintain good relationships.

Key principles:
1. **Be polite but clear** - State what you're following up on without being passive-aggressive
2. **Provide context** - Briefly remind them of the original discussion
3. **Offer value** - If possible, offer something helpful rather than just asking
4. **Respect their time** - Keep it concise
5. **Include a clear ask** - What do you need from them?

Tone Guidelines:
- "gentle": Friendly reminder, no pressure, maintain relationship
- "firm": Clear expectation, professional but direct
- "urgent": Time-sensitive, needs immediate attention
- "casual": Informal, between colleagues or friends

Response Format (JSON):
{
  "subject": "Email subject line",
  "body": "The follow-up email body",
  "tone": "gentle|firm|urgent|casual",
  "urgencyLevel": "low|medium|high",
  "suggestedSendTime": "e.g., 'Tuesday morning' or 'End of business day'",
  "alternativeApproaches": [
    {
      "approach": "Description of alternative approach",
      "body": "Alternative email body"
    }
  ]
}`;
}

export function buildFollowUpPrompt(context: FollowUpContext): string {
  const {
    commitment,
    contact,
    originalThread,
    daysSinceCommitment,
    previousFollowUps,
  } = context;

  const isOwedToUser = commitment.direction === "owed_to_me";
  const isOverdue = commitment.dueDate && commitment.dueDate < new Date();

  let prompt = `Generate a follow-up email for the following situation.

## Commitment Details
- What: ${commitment.title}
- Description: ${commitment.description ?? "No description"}
- Direction: ${isOwedToUser ? "They owe you" : "You owe them"}
- Status: ${commitment.status}
- Due Date: ${commitment.dueDate ? commitment.dueDate.toISOString() : "No due date"}
- Days Since Commitment: ${daysSinceCommitment}
- Previous Follow-ups Sent: ${previousFollowUps}
${commitment.originalText ? `- Original Text: "${commitment.originalText}"` : ""}

## Contact Information
- Name: ${contact.name ?? contact.email}
- Company: ${contact.company ?? "Unknown"}
- VIP: ${contact.isVip ? "Yes" : "No"}
${contact.responseRate !== undefined ? `- Response Rate: ${(contact.responseRate * 100).toFixed(0)}%` : ""}
${contact.avgResponseTimeHours !== undefined ? `- Avg Response Time: ${contact.avgResponseTimeHours} hours` : ""}
`;

  if (originalThread) {
    prompt += `
## Original Thread
- Subject: "${originalThread.subject}"
- Last Message: ${originalThread.lastMessageDate.toISOString()} from ${originalThread.lastMessageFrom}
`;
  }

  prompt += `
## Situation Analysis
- Is Overdue: ${isOverdue ? "Yes" : "No"}
- Time Since Last Contact: ${daysSinceCommitment} days
- Follow-up Count: ${previousFollowUps} (${previousFollowUps === 0 ? "first follow-up" : previousFollowUps === 1 ? "second follow-up" : "multiple follow-ups"})

## Instructions
Generate a follow-up email that:
1. ${isOwedToUser ? "Politely reminds them of their commitment" : "Provides an update on your progress"}
2. Is appropriately toned based on the situation
3. ${isOverdue ? "Acknowledges the deadline has passed without being accusatory" : "Sets clear expectations"}
4. ${contact.isVip ? "Maintains the VIP relationship" : "Is professional"}
5. ${previousFollowUps > 1 ? "Escalates slightly without being aggressive" : "Keeps things friendly"}

Respond with a JSON object following the schema.`;

  return prompt;
}

// =============================================================================
// REMINDER SCHEDULE PROMPT
// =============================================================================

export const ReminderScheduleSchema = z.object({
  recommendedDates: z.array(
    z.object({
      date: z.string(),
      reason: z.string(),
      tone: z.enum(["gentle", "firm", "urgent"]),
    })
  ),
  frequency: z.enum(["once", "weekly", "biweekly", "custom"]),
  escalationPlan: z.string().optional(),
});

export type ReminderSchedule = z.infer<typeof ReminderScheduleSchema>;

export function buildReminderSchedulePrompt(
  commitment: {
    title: string;
    dueDate?: Date;
    importance: "low" | "medium" | "high" | "critical";
  },
  contactResponsePattern?: {
    avgResponseDays: number;
    preferredDays: string[];
  }
): string {
  return `Recommend a follow-up schedule for this commitment.

## Commitment
- Title: ${commitment.title}
- Due Date: ${commitment.dueDate ? commitment.dueDate.toISOString() : "No due date"}
- Importance: ${commitment.importance}

## Contact Response Pattern
${
  contactResponsePattern
    ? `- Average Response Time: ${contactResponsePattern.avgResponseDays} days
- Preferred Days: ${contactResponsePattern.preferredDays.join(", ")}`
    : "No response pattern data available"
}

## Today's Date
${new Date().toISOString()}

## Instructions
Recommend:
1. When to send follow-up reminders
2. How the tone should escalate over time
3. An overall follow-up frequency

Respond with JSON:
{
  "recommendedDates": [
    {
      "date": "YYYY-MM-DD",
      "reason": "Why this date",
      "tone": "gentle|firm|urgent"
    }
  ],
  "frequency": "once|weekly|biweekly|custom",
  "escalationPlan": "Description of how to escalate if no response"
}`;
}
