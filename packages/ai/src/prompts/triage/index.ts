// =============================================================================
// TRIAGE PROMPTS INDEX
// =============================================================================

export {
  // Schemas
  ActionTypeSchema,
  BatchTriageResultSchema,
  buildBatchTriagePrompt,
  buildDelegationPrompt,
  // Prompts
  buildTriageSystemPrompt,
  buildTriageUserPrompt,
  type DelegationResult,
  DelegationResultSchema,
  type LLMActionType,
  type TriageResult,
  TriageResultSchema,
} from "./action.js";

export {
  buildGroupingPrompt,
  buildInboxSummaryPrompt,
  // Prompts
  buildReasoningExplanationPrompt,
  buildRuleSuggestionPrompt,
  type GroupingResult,
  GroupingResultSchema,
  type InboxSummary,
  InboxSummarySchema,
  type ReasoningExplanation,
  // Schemas
  ReasoningExplanationSchema,
  type RuleSuggestion,
  RuleSuggestionSchema,
} from "./reasoning.js";
