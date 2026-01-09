// =============================================================================
// EMAIL SYNC TYPES
// =============================================================================

import type { EmailMessageData, EmailThreadData } from "../email-client/types";

/**
 * Sync job types
 */
export type SyncJobType = "incremental" | "backfill" | "on_demand";

/**
 * Sync job status
 */
export type SyncJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Sync job record
 */
export interface SyncJob {
  id: string;
  accountId: string;
  organizationId: string;
  type: SyncJobType;
  status: SyncJobStatus;
  progress: number;
  totalItems?: number;
  processedItems: number;
  cursor?: string;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sync result summary
 */
export interface SyncResult {
  success: boolean;
  jobId: string;
  accountId: string;
  type: SyncJobType;
  threadsProcessed: number;
  messagesProcessed: number;
  newThreads: number;
  updatedThreads: number;
  newMessages: number;
  updatedMessages: number;
  errors: SyncError[];
  duration: number;
  newCursor?: string;
}

/**
 * Sync error details
 */
export interface SyncError {
  code: string;
  message: string;
  threadId?: string;
  messageId?: string;
  retryable: boolean;
}

/**
 * Processing options for threads/messages
 */
export interface ProcessingOptions {
  /** Skip messages we've already processed */
  skipExisting?: boolean;
  /** Force reprocessing even if exists */
  forceUpdate?: boolean;
  /** Maximum items per batch */
  batchSize?: number;
}

/**
 * Processed thread result
 */
export interface ProcessedThread {
  thread: EmailThreadData;
  messages: EmailMessageData[];
  isNew: boolean;
  wasUpdated: boolean;
}

/**
 * Batch processing result
 */
export interface BatchResult {
  processed: number;
  skipped: number;
  errors: SyncError[];
  threads: ProcessedThread[];
}

/**
 * Provider-specific sync options
 */
export interface ProviderSyncOptions {
  /** Starting cursor/historyId */
  cursor?: string;
  /** Maximum threads to fetch */
  maxThreads?: number;
  /** Labels/folders to include */
  labels?: string[];
  /** Date range start */
  after?: Date;
  /** Include spam/trash */
  includeSpamTrash?: boolean;
}

/**
 * Backfill configuration
 */
export interface BackfillConfig {
  /** Account ID to backfill */
  accountId: string;
  /** Organization ID */
  organizationId: string;
  /** How far back to go (days) */
  backfillDays: number;
  /** Batch size for fetching */
  batchSize: number;
  /** Priority (recent emails first) */
  prioritizeRecent: boolean;
}

/**
 * Sync schedule configuration
 */
export interface SyncScheduleConfig {
  /** Account ID */
  accountId: string;
  /** Interval in minutes */
  intervalMinutes: number;
  /** Whether sync is enabled */
  enabled: boolean;
}

/**
 * Event emitted when sync completes
 */
export interface SyncCompleteEvent {
  jobId: string;
  accountId: string;
  organizationId: string;
  result: SyncResult;
  timestamp: Date;
}

/**
 * Event emitted for new/updated threads (for downstream processing)
 */
export interface ThreadProcessedEvent {
  threadId: string;
  accountId: string;
  organizationId: string;
  isNew: boolean;
  messageCount: number;
  timestamp: Date;
}
