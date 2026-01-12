// =============================================================================
// DRAFTING REFINEMENT PROMPTS (PRD-08)
// =============================================================================
//
// LLM prompts for iterative draft refinement and variations.
//

import { z } from "zod";

// =============================================================================
// SCHEMAS
// =============================================================================

export const RefinementSchema = z.object({
  refinedBody: z.string(),
  changesApplied: z.array(z.string()),
  explanations: z.array(
    z.object({
      change: z.string(),
      reason: z.string(),
    })
  ),
});

export type Refinement = z.infer<typeof RefinementSchema>;

export const DraftVariationSchema = z.object({
  variations: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      body: z.string(),
      characteristics: z.array(z.string()),
      bestFor: z.string(),
    })
  ),
});

export type DraftVariation = z.infer<typeof DraftVariationSchema>;

// =============================================================================
// REFINEMENT PROMPTS
// =============================================================================

export function buildRefinementPrompt(
  originalDraft: string,
  feedback: string,
  context?: {
    threadSubject?: string;
    recipientName?: string;
    constraints?: string[];
  }
): string {
  let prompt = `Refine the following email draft based on user feedback.

## Original Draft
${originalDraft}

## User Feedback
${feedback}
`;

  if (context) {
    prompt += `
## Context
${context.threadSubject ? `- Thread Subject: ${context.threadSubject}` : ""}
${context.recipientName ? `- Recipient: ${context.recipientName}` : ""}
${context.constraints?.length ? `- Constraints: ${context.constraints.join(", ")}` : ""}
`;
  }

  prompt += `
## Instructions
Apply the user's feedback to improve the draft:
1. Address all specific feedback points
2. Maintain the core message and intent
3. Preserve any citations or references
4. Keep the appropriate tone

Respond with JSON:
{
  "refinedBody": "The refined email text",
  "changesApplied": ["List of changes made"],
  "explanations": [
    {
      "change": "What was changed",
      "reason": "Why this change addresses the feedback"
    }
  ]
}`;

  return prompt;
}

// =============================================================================
// VARIATION PROMPTS
// =============================================================================

export function buildVariationsPrompt(
  baseDraft: string,
  intent: string,
  variationTypes: Array<"brief" | "detailed" | "formal" | "casual" | "urgent">
): string {
  const variationDescriptions = {
    brief: "Concise and to-the-point, minimal elaboration",
    detailed: "Thorough explanation, addresses all points comprehensively",
    formal: "Professional, corporate-appropriate language",
    casual: "Friendly, conversational tone",
    urgent: "Emphasizes time-sensitivity and importance",
  };

  return `Generate variations of this email draft for different communication styles.

## Base Draft
${baseDraft}

## Core Intent
${intent}

## Requested Variations
${variationTypes.map((v) => `- ${v}: ${variationDescriptions[v]}`).join("\n")}

## Instructions
Create ${variationTypes.length} variations, each maintaining the core message but adapted for the specified style.

Respond with JSON:
{
  "variations": [
    {
      "id": "variation-type",
      "label": "Human-readable label",
      "body": "The variation text",
      "characteristics": ["Key characteristics of this version"],
      "bestFor": "When to use this version"
    }
  ]
}`;
}

// =============================================================================
// LENGTH ADJUSTMENT PROMPTS
// =============================================================================

export const LengthAdjustmentSchema = z.object({
  adjustedBody: z.string(),
  originalWordCount: z.number(),
  newWordCount: z.number(),
  preservedElements: z.array(z.string()),
  removedElements: z.array(z.string()).optional(),
});

export type LengthAdjustment = z.infer<typeof LengthAdjustmentSchema>;

export function buildLengthAdjustmentPrompt(
  draft: string,
  targetLength: "shorter" | "longer" | { minWords?: number; maxWords?: number },
  preserveElements?: string[]
): string {
  const lengthInstructions =
    typeof targetLength === "string"
      ? targetLength === "shorter"
        ? "Make this email more concise (aim for 50% reduction)"
        : "Expand this email with more detail and context"
      : `Adjust length to ${targetLength.minWords ?? 0}-${targetLength.maxWords ?? "unlimited"} words`;

  return `Adjust the length of this email draft.

## Current Draft
${draft}

## Target
${lengthInstructions}

${preserveElements?.length ? `## Must Preserve\n${preserveElements.map((e) => `- ${e}`).join("\n")}` : ""}

## Instructions
${
  typeof targetLength === "string" && targetLength === "shorter"
    ? `1. Remove redundant phrases and filler words
2. Combine related points
3. Use more direct language
4. Keep all essential information`
    : `1. Add relevant context or explanation
2. Include more detail where appropriate
3. Expand on key points
4. Maintain natural flow`
}

Respond with JSON:
{
  "adjustedBody": "The adjusted email text",
  "originalWordCount": number,
  "newWordCount": number,
  "preservedElements": ["Elements that were kept"],
  "removedElements": ["Elements that were removed (for shorter)"]
}`;
}

// =============================================================================
// SPECIFIC IMPROVEMENT PROMPTS
// =============================================================================

export type ImprovementType =
  | "clarity"
  | "persuasion"
  | "empathy"
  | "professionalism"
  | "action-oriented";

export const ImprovementSchema = z.object({
  improvedBody: z.string(),
  improvements: z.array(
    z.object({
      original: z.string(),
      improved: z.string(),
      reason: z.string(),
    })
  ),
  overallImpact: z.string(),
});

export type Improvement = z.infer<typeof ImprovementSchema>;

export function buildImprovementPrompt(
  draft: string,
  improvementType: ImprovementType
): string {
  const improvementGuidelines: Record<ImprovementType, string> = {
    clarity:
      "Make the message clearer. Simplify complex sentences, remove ambiguity, use concrete language.",
    persuasion:
      "Make the message more persuasive. Add compelling arguments, address objections, include social proof if relevant.",
    empathy:
      "Add more empathy and emotional intelligence. Acknowledge the recipient's perspective, use warmer language.",
    professionalism:
      "Increase professionalism. Remove casual language, add appropriate formality, ensure business-appropriate tone.",
    "action-oriented":
      "Make it more action-oriented. Clear calls to action, specific next steps, deadlines where appropriate.",
  };

  return `Improve this email for better ${improvementType}.

## Current Draft
${draft}

## Improvement Focus: ${improvementType.toUpperCase()}
${improvementGuidelines[improvementType]}

## Instructions
Rewrite to enhance ${improvementType} while:
1. Preserving the core message
2. Maintaining factual accuracy
3. Keeping appropriate length
4. Preserving any citations

Respond with JSON:
{
  "improvedBody": "The improved email text",
  "improvements": [
    {
      "original": "Original phrase or section",
      "improved": "Improved version",
      "reason": "Why this improves ${improvementType}"
    }
  ],
  "overallImpact": "Summary of how these changes improve ${improvementType}"
}`;
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

export function buildQuickActionPrompt(
  draft: string,
  action:
    | "add-greeting"
    | "add-signoff"
    | "add-cta"
    | "soften-tone"
    | "strengthen-tone"
    | "add-appreciation"
): string {
  const actionInstructions: Record<string, string> = {
    "add-greeting":
      "Add an appropriate greeting if missing. Match the formality of the email.",
    "add-signoff":
      "Add a professional sign-off if missing. Include appropriate closing and name placeholder.",
    "add-cta":
      "Add a clear call-to-action. Be specific about what you need and when.",
    "soften-tone":
      "Soften the language throughout. Use more hedging words, add politeness markers.",
    "strengthen-tone":
      "Make the language more direct and assertive. Remove hedging, use active voice.",
    "add-appreciation":
      "Add expressions of appreciation or thanks where appropriate.",
  };

  return `Apply a quick improvement to this email.

## Draft
${draft}

## Action: ${action}
${actionInstructions[action]}

## Instructions
Make the minimal changes needed to achieve the action. Preserve the rest of the email exactly as is.

Respond with just the modified email text (no JSON, no explanation).`;
}
