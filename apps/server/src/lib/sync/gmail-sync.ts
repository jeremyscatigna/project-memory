// =============================================================================
// GMAIL-SPECIFIC SYNC LOGIC
// =============================================================================
//
// Implements Gmail's sync strategy using the History API for incremental sync
// and paginated thread listing for backfill.
//

import type { GmailEmailClient } from "../email-client/gmail";
import type { EmailThreadWithMessages } from "../email-client/types";
import { log } from "../logger";
import { batchDeduplicateThreads } from "./deduplication";
import { markThreadDeleted, processBatch } from "./processor";
import type {
  BackfillConfig,
  BatchResult,
  ProviderSyncOptions,
  SyncError,
  SyncResult,
} from "./types";

// =============================================================================
// INCREMENTAL SYNC
// =============================================================================

/**
 * Perform incremental sync for a Gmail account.
 * Uses the History API to fetch changes since the last sync cursor.
 *
 * @param client - Gmail client instance
 * @param accountId - Email account ID in our database
 * @param options - Sync options including cursor
 * @returns Sync result with statistics
 */
export async function syncGmailIncremental(
  client: GmailEmailClient,
  accountId: string,
  options: ProviderSyncOptions
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    jobId: crypto.randomUUID(),
    accountId,
    type: "incremental",
    threadsProcessed: 0,
    messagesProcessed: 0,
    newThreads: 0,
    updatedThreads: 0,
    newMessages: 0,
    updatedMessages: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Get changes since last sync
    const delta = await client.getChanges(options.cursor);

    log.info("Gmail incremental sync: changes detected", {
      accountId,
      changedThreads: delta.changedThreadIds.length,
      deletedThreads: delta.deletedThreadIds.length,
      fullSyncRequired: delta.fullSyncRequired,
    });

    // If full sync is required (history expired), we need to do a backfill
    if (delta.fullSyncRequired) {
      result.errors.push({
        code: "FULL_SYNC_REQUIRED",
        message: "History expired, full sync required",
        retryable: false,
      });
      result.success = false;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Handle deleted threads
    for (const threadId of delta.deletedThreadIds) {
      try {
        await markThreadDeleted(accountId, threadId);
      } catch (error) {
        result.errors.push({
          code: "DELETE_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          threadId,
          retryable: true,
        });
      }
    }

    // Fetch and process changed threads
    if (delta.changedThreadIds.length > 0) {
      const batchResult = await fetchAndProcessThreads(
        client,
        accountId,
        delta.changedThreadIds,
        { forceUpdate: true }
      );

      result.threadsProcessed = batchResult.processed;
      result.newThreads = batchResult.threads.filter((t) => t.isNew).length;
      result.updatedThreads = batchResult.threads.filter(
        (t) => t.wasUpdated
      ).length;
      result.messagesProcessed = batchResult.threads.reduce(
        (sum, t) => sum + t.messages.length,
        0
      );
      result.errors.push(...batchResult.errors);
    }

    // Update cursor
    result.newCursor = delta.newCursor;
    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    log.info("Gmail incremental sync completed", {
      accountId,
      ...result,
    });

    return result;
  } catch (error) {
    result.errors.push({
      code: "SYNC_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
      retryable: true,
    });
    result.duration = Date.now() - startTime;
    log.error("Gmail incremental sync failed", error, { accountId });
    return result;
  }
}

// =============================================================================
// BACKFILL
// =============================================================================

/**
 * Perform full backfill for a Gmail account.
 * Fetches all threads within the configured date range.
 *
 * @param client - Gmail client instance
 * @param config - Backfill configuration
 * @param onProgress - Progress callback
 * @returns Sync result with statistics
 */
export async function backfillGmail(
  client: GmailEmailClient,
  config: BackfillConfig,
  onProgress?: (progress: number, total: number) => void
): Promise<SyncResult> {
  const startTime = Date.now();
  const result: SyncResult = {
    success: false,
    jobId: crypto.randomUUID(),
    accountId: config.accountId,
    type: "backfill",
    threadsProcessed: 0,
    messagesProcessed: 0,
    newThreads: 0,
    updatedThreads: 0,
    newMessages: 0,
    updatedMessages: 0,
    errors: [],
    duration: 0,
  };

  try {
    const afterDate = new Date();
    afterDate.setDate(afterDate.getDate() - config.backfillDays);

    let cursor: string | undefined;
    let totalFetched = 0;
    const allThreadIds: string[] = [];

    // Phase 1: Collect all thread IDs
    log.info("Gmail backfill: collecting thread IDs", {
      accountId: config.accountId,
      afterDate,
    });

    do {
      const response = await client.listThreads({
        limit: 100,
        cursor,
        after: afterDate,
        includeSpamTrash: false,
      });

      const threadIds = response.items.map((t) => t.providerThreadId);
      allThreadIds.push(...threadIds);
      totalFetched += threadIds.length;
      cursor = response.nextCursor;

      log.debug("Gmail backfill: fetched thread list page", {
        accountId: config.accountId,
        fetched: threadIds.length,
        total: totalFetched,
        hasMore: response.hasMore,
      });
    } while (cursor);

    log.info("Gmail backfill: collected all thread IDs", {
      accountId: config.accountId,
      totalThreads: allThreadIds.length,
    });

    // Phase 2: Deduplicate to find new threads
    const dedupeResult = await batchDeduplicateThreads(
      config.accountId,
      allThreadIds
    );

    log.info("Gmail backfill: deduplication complete", {
      accountId: config.accountId,
      newThreads: dedupeResult.newIds.length,
      existingThreads: dedupeResult.existingIds.length,
    });

    // Phase 3: Process threads (prioritize recent if configured)
    const threadsToProcess = config.prioritizeRecent
      ? allThreadIds // Already sorted by date desc from API
      : allThreadIds;

    const batchSize = config.batchSize;
    let processed = 0;

    for (let i = 0; i < threadsToProcess.length; i += batchSize) {
      const batch = threadsToProcess.slice(i, i + batchSize);
      const isNew = (id: string) => dedupeResult.newIds.includes(id);

      // Only process new threads (skip existing unless we want updates)
      const newThreadsInBatch = batch.filter(isNew);

      if (newThreadsInBatch.length > 0) {
        const batchResult = await fetchAndProcessThreads(
          client,
          config.accountId,
          newThreadsInBatch,
          { skipExisting: true }
        );

        result.threadsProcessed += batchResult.processed;
        result.newThreads += batchResult.threads.filter((t) => t.isNew).length;
        result.messagesProcessed += batchResult.threads.reduce(
          (sum, t) => sum + t.messages.length,
          0
        );
        result.errors.push(...batchResult.errors);
      }

      processed += batch.length;
      onProgress?.(processed, threadsToProcess.length);

      // Small delay to respect rate limits
      if (i + batchSize < threadsToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Get final cursor for future incremental syncs
    result.newCursor = await client.getInitialCursor();
    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    log.info("Gmail backfill completed", {
      accountId: config.accountId,
      ...result,
    });

    return result;
  } catch (error) {
    result.errors.push({
      code: "BACKFILL_ERROR",
      message: error instanceof Error ? error.message : "Unknown error",
      retryable: true,
    });
    result.duration = Date.now() - startTime;
    log.error("Gmail backfill failed", error, {
      accountId: config.accountId,
    });
    return result;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Fetch full thread data and process into Evidence Store.
 *
 * @param client - Gmail client
 * @param accountId - Account ID
 * @param threadIds - Provider thread IDs to fetch
 * @param options - Processing options
 * @returns Batch processing result
 */
async function fetchAndProcessThreads(
  client: GmailEmailClient,
  accountId: string,
  threadIds: string[],
  options: { skipExisting?: boolean; forceUpdate?: boolean } = {}
): Promise<BatchResult> {
  const threads: EmailThreadWithMessages[] = [];
  const errors: SyncError[] = [];

  // Fetch thread details in batches
  for (const threadId of threadIds) {
    try {
      const thread = await client.getThread(threadId);
      if (thread) {
        threads.push(thread);
      }
    } catch (error) {
      errors.push({
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        threadId,
        retryable: true,
      });
    }
  }

  // Process fetched threads
  const batchResult = await processBatch(accountId, threads, options);
  batchResult.errors.push(...errors);

  return batchResult;
}

/**
 * Get initial sync cursor for Gmail (historyId).
 */
export async function getGmailInitialCursor(
  client: GmailEmailClient
): Promise<string> {
  return await client.getInitialCursor();
}
