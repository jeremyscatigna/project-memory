// =============================================================================
// GENERATION INDEX (PRD-08)
// =============================================================================

// Citation utilities
export {
  type CitationSource,
  type CitationValidation,
  checkCitationsComplete,
  countCitations,
  createCitation,
  extractCitationMarkers,
  type FormattedCitation,
  formatCitations,
  getCitationStats,
  insertCitationMarkers,
  mergeCitations,
  stripCitations,
  validateCitations,
} from "./citations.js";
// Reply generation
export {
  buildDraftContext,
  buildHistoricalStatements,
  type ContextSources,
  checkConsistencyRules,
  type DraftOptions,
  type DraftRequest,
  type DraftResult,
  extractCitationSources,
  getToneProfile,
  getVariationParams,
  postProcessDraft,
  type VariationType,
} from "./reply.js";
// Tone matching
export {
  adjustFormality,
  analyzeToneFromSamples,
  compareTones,
  getDefaultToneProfile,
  type ToneAdjustment,
  type ToneCharacteristic,
  type ToneProfile,
  type ToneType,
  toneAnalysisToProfile,
} from "./tone.js";
