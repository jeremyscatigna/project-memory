// =============================================================================
// DRAFTING PROMPTS INDEX (PRD-08)
// =============================================================================

export {
  buildFollowUpPrompt,
  // Follow-up prompts
  buildFollowUpSystemPrompt,
  buildReminderSchedulePrompt,
  // Follow-up context
  type FollowUpContext,
  type FollowUpDraft,
  // Follow-up schemas
  FollowUpDraftSchema,
  type ReminderSchedule,
  ReminderScheduleSchema,
} from "./followup.js";
export {
  buildImprovementPrompt,
  buildLengthAdjustmentPrompt,
  buildQuickActionPrompt,
  // Refinement prompts
  buildRefinementPrompt,
  buildVariationsPrompt,
  type DraftVariation,
  DraftVariationSchema,
  type Improvement,
  ImprovementSchema,
  type ImprovementType,
  type LengthAdjustment,
  LengthAdjustmentSchema,
  type Refinement,
  // Refinement schemas
  RefinementSchema,
} from "./refinement.js";
export {
  buildConsistencyCheckPrompt,
  // Reply prompts
  buildDraftingSystemPrompt,
  buildReplyDraftPrompt,
  buildToneAdjustmentPrompt,
  buildToneAnalysisPrompt,
  type Citation,
  // Reply schemas
  CitationSchema,
  type CommitmentContext,
  type ConsistencyCheck,
  ConsistencyCheckSchema,
  type DraftContext,
  type DraftReply,
  DraftReplySchema,
  type HistoricalContext,
  type RelationshipContext,
  // Context types
  type ThreadContext,
  type ToneAnalysis,
  ToneAnalysisSchema,
} from "./reply.js";
