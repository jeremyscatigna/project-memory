// =============================================================================
// EMAIL PROVIDER EXPORTS
// =============================================================================

export * from "./gmail";
export * from "./outlook";

// Re-export common types
export type EmailProvider = "gmail" | "outlook";

/**
 * Check if any email provider is configured
 */
export { isGmailConfigured } from "./gmail";
export { isOutlookConfigured } from "./outlook";
