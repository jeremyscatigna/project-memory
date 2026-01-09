// =============================================================================
// OUTLOOK-SPECIFIC SYNC LOGIC
// =============================================================================
//
// Implements Outlook's sync strategy using the Delta API for incremental sync
// and paginated message listing for backfill.
//

import type { OutlookEmailClient } from "../email-client/outlook";
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
 * Perform incremental sync for an Outlook account.
 * Uses the Delta API to fetch changes since the last sync cursor.
 *
 * @param client - Outlook client instance
 * @param accountId - Email account ID in our database
 * @param options - Sync options including cursor
 * @returns Sync result with statistics
 */
export async function syncOutlookIncremental(
  client: OutlookEmailClient,
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

    log.info("Outlook incremental sync: changes detected", {
      accountId,
      changedThreads: delta.changedThreadIds.length,
      deletedThreads: delta.deletedThreadIds.length,
      fullSyncRequired: delta.fullSyncRequired,
    });

    // If full sync is required (delta link expired), we need to do a backfill
    if (delta.fullSyncRequired) {
      result.errors.push({
        code: "FULL_SYNC_REQUIRED",
        message: "Delta link expired, full sync required",
        retryable: false,
      });
      result.success = false;
      result.duration = Date.now() - startTime;
      return result;
    }

    // Handle deleted threads (conversations)
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
      const batchResult = await fetchAndProcessConversations(
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

    log.info("Outlook incremental sync completed", {
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
    log.error("Outlook incremental sync failed", error, { accountId });
    return result;
  }
}

// =============================================================================
// BACKFILL
// =============================================================================

/**
 * Perform full backfill for an Outlook account.
 * Fetches all conversations within the configured date range.
 *
 * @param client - Outlook client instance
 * @param config - Backfill configuration
 * @param onProgress - Progress callback
 * @returns Sync result with statistics
 */
export async function backfillOutlook(
  client: OutlookEmailClient,
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

    // Phase 1: Collect all conversation IDs
    log.info("Outlook backfill: collecting conversation IDs", {
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

      log.debug("Outlook backfill: fetched conversation list page", {
        accountId: config.accountId,
        fetched: threadIds.length,
        total: totalFetched,
        hasMore: response.hasMore,
      });
    } while (cursor);

    log.info("Outlook backfill: collected all conversation IDs", {
      accountId: config.accountId,
      totalConversations: allThreadIds.length,
    });

    // Phase 2: Deduplicate to find new conversations
    const dedupeResult = await batchDeduplicateThreads(
      config.accountId,
      allThreadIds
    );

    log.info("Outlook backfill: deduplication complete", {
      accountId: config.accountId,
      newConversations: dedupeResult.newIds.length,
      existingConversations: dedupeResult.existingIds.length,
    });

    // Phase 3: Process conversations (prioritize recent if configured)
    const conversationsToProcess = config.prioritizeRecent
      ? allThreadIds // Already sorted by date desc from API
      : allThreadIds;

    const batchSize = config.batchSize;
    let processed = 0;

    for (let i = 0; i < conversationsToProcess.length; i += batchSize) {
      const batch = conversationsToProcess.slice(i, i + batchSize);
      const isNew = (id: string) => dedupeResult.newIds.includes(id);

      // Only process new conversations (skip existing unless we want updates)
      const newConversationsInBatch = batch.filter(isNew);

      if (newConversationsInBatch.length > 0) {
        const batchResult = await fetchAndProcessConversations(
          client,
          config.accountId,
          newConversationsInBatch,
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
      onProgress?.(processed, conversationsToProcess.length);

      // Small delay to respect rate limits
      if (i + batchSize < conversationsToProcess.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Get final cursor for future incremental syncs
    result.newCursor = await client.getInitialCursor();
    result.success = result.errors.length === 0;
    result.duration = Date.now() - startTime;

    log.info("Outlook backfill completed", {
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
    log.error("Outlook backfill failed", error, {
      accountId: config.accountId,
    });
    return result;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Fetch full conversation data and process into Evidence Store.
 *
 * @param client - Outlook client
 * @param accountId - Account ID
 * @param conversationIds - Provider conversation IDs to fetch
 * @param options - Processing options
 * @returns Batch processing result
 */
async function fetchAndProcessConversations(
  client: OutlookEmailClient,
  accountId: string,
  conversationIds: string[],
  options: { skipExisting?: boolean; forceUpdate?: boolean } = {}
): Promise<BatchResult> {
  const threads: EmailThreadWithMessages[] = [];
  const errors: SyncError[] = [];

  // Fetch conversation details in batches
  for (const conversationId of conversationIds) {
    try {
      const thread = await client.getThread(conversationId);
      if (thread) {
        threads.push(thread);
      }
    } catch (error) {
      errors.push({
        code: "FETCH_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        threadId: conversationId,
        retryable: true,
      });
    }
  }

  // Process fetched conversations
  const batchResult = await processBatch(accountId, threads, options);
  batchResult.errors.push(...errors);

  return batchResult;
}

/**
 * Get initial sync cursor for Outlook (deltaLink).
 */
export async function getOutlookInitialCursor(
  client: OutlookEmailClient
): Promise<string> {
  return await client.getInitialCursor();
}
