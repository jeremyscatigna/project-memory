// =============================================================================
// EMAIL CLIENT ERROR HANDLING
// =============================================================================

import type { EmailProvider } from "./types";
import {
  AuthenticationError,
  EmailClientError,
  NotFoundError,
  ProviderError,
  RateLimitError,
} from "./types";

// =============================================================================
// GMAIL ERROR MAPPING
// =============================================================================

interface GmailErrorResponse {
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{
      reason?: string;
      domain?: string;
      message?: string;
    }>;
  };
}

/**
 * Map Gmail API error responses to normalized error types
 */
export function normalizeGmailError(
  statusCode: number,
  errorBody: GmailErrorResponse,
  retryAfter?: number
): EmailClientError {
  const message = errorBody.error?.message || "Unknown Gmail error";
  const reason = errorBody.error?.errors?.[0]?.reason;

  // Authentication errors
  if (
    statusCode === 401 ||
    reason === "authError" ||
    reason === "unauthorized"
  ) {
    return new AuthenticationError(message, "gmail");
  }

  // Rate limit errors
  if (
    statusCode === 429 ||
    reason === "rateLimitExceeded" ||
    reason === "userRateLimitExceeded"
  ) {
    return new RateLimitError(message, "gmail", retryAfter);
  }

  // Not found errors
  if (statusCode === 404 || reason === "notFound") {
    return new NotFoundError(message, "gmail", "message");
  }

  // Permission/access errors (treat as auth errors)
  if (
    reason === "forbidden" ||
    reason === "accessDenied" ||
    statusCode === 403
  ) {
    return new AuthenticationError(`Access denied: ${message}`, "gmail");
  }

  // Invalid request errors
  if (
    statusCode === 400 ||
    reason === "invalidArgument" ||
    reason === "badRequest"
  ) {
    return new ProviderError(`Invalid request: ${message}`, "gmail", errorBody);
  }

  // Quota exceeded
  if (reason === "quotaExceeded" || reason === "dailyLimitExceeded") {
    return new RateLimitError(`Quota exceeded: ${message}`, "gmail", 3600); // Retry in 1 hour
  }

  // Backend errors
  if (statusCode >= 500) {
    return new ProviderError(
      `Gmail service error: ${message}`,
      "gmail",
      errorBody
    );
  }

  // Default to provider error
  return new ProviderError(message, "gmail", errorBody);
}

// =============================================================================
// OUTLOOK/MICROSOFT GRAPH ERROR MAPPING
// =============================================================================

interface GraphErrorResponse {
  error?: {
    code?: string;
    message?: string;
    innerError?: {
      code?: string;
      "request-id"?: string;
      date?: string;
    };
  };
}

/**
 * Map Microsoft Graph API error responses to normalized error types
 */
export function normalizeGraphError(
  statusCode: number,
  errorBody: GraphErrorResponse,
  retryAfter?: number
): EmailClientError {
  const message = errorBody.error?.message || "Unknown Microsoft Graph error";
  const code = errorBody.error?.code?.toLowerCase();

  // Authentication errors
  if (
    statusCode === 401 ||
    code === "invalidauthenticationtoken" ||
    code === "unauthenticated" ||
    code === "unauthorized"
  ) {
    return new AuthenticationError(message, "outlook");
  }

  // Token expired
  if (code === "tokenexpired" || code === "expiredtoken") {
    return new AuthenticationError("Access token has expired", "outlook");
  }

  // Rate limit errors
  if (
    statusCode === 429 ||
    code === "activitylimitreached" ||
    code === "throttled"
  ) {
    return new RateLimitError(message, "outlook", retryAfter);
  }

  // Not found errors
  if (
    statusCode === 404 ||
    code === "itemnotfound" ||
    code === "resourcenotfound"
  ) {
    return new NotFoundError(message, "outlook", "message");
  }

  // Permission/access errors
  if (statusCode === 403 || code === "accessdenied" || code === "forbidden") {
    return new AuthenticationError(`Access denied: ${message}`, "outlook");
  }

  // Mailbox not found or unavailable
  if (
    code === "mailboxnotfound" ||
    code === "mailboxnotenabledforrestaccessorissoftdeleted"
  ) {
    return new AuthenticationError(
      `Mailbox unavailable: ${message}`,
      "outlook"
    );
  }

  // Invalid request
  if (
    statusCode === 400 ||
    code === "badrequest" ||
    code === "invalidrequest"
  ) {
    return new ProviderError(
      `Invalid request: ${message}`,
      "outlook",
      errorBody
    );
  }

  // Sync state errors
  if (code === "synstatestainvalidorexpired" || code === "resyncneeded") {
    return new ProviderError(
      "Sync state expired, full sync required",
      "outlook",
      errorBody
    );
  }

  // Quota/limit errors
  if (code === "quotaexceeded" || code === "storagequotaexceeded") {
    return new RateLimitError(`Quota exceeded: ${message}`, "outlook", 3600);
  }

  // Backend/service errors
  if (
    statusCode >= 500 ||
    code === "serviceunavailable" ||
    code === "internalservererror"
  ) {
    return new ProviderError(
      `Microsoft service error: ${message}`,
      "outlook",
      errorBody
    );
  }

  // Default to provider error
  return new ProviderError(message, "outlook", errorBody);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof EmailClientError) {
    return error.retryable;
  }
  return false;
}

/**
 * Get retry delay for an error
 */
export function getRetryDelay(error: unknown): number {
  if (error instanceof RateLimitError && error.retryAfter) {
    return error.retryAfter * 1000; // Convert to milliseconds
  }
  // Default exponential backoff base
  return 1000;
}

/**
 * Create a user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AuthenticationError) {
    return "Your email account needs to be reconnected. Please disconnect and connect it again.";
  }

  if (error instanceof RateLimitError) {
    return "Too many requests. Please wait a moment and try again.";
  }

  if (error instanceof NotFoundError) {
    return "The requested email or thread could not be found.";
  }

  if (error instanceof EmailClientError) {
    return `Email provider error: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred while accessing your email.";
}

/**
 * Determine if an error should trigger account reconnection
 */
export function shouldReconnectAccount(error: unknown): boolean {
  if (error instanceof AuthenticationError) {
    return true;
  }
  return false;
}

/**
 * Wrap an async operation with error normalization
 */
export async function withErrorHandling<T>(
  provider: EmailProvider,
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // Already normalized
    if (error instanceof EmailClientError) {
      throw error;
    }

    // Unknown error
    throw new ProviderError(
      error instanceof Error ? error.message : "Unknown error",
      provider,
      error
    );
  }
}
