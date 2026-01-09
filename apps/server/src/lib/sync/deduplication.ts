// =============================================================================
// EMAIL DEDUPLICATION
// =============================================================================
//
// Handles deduplication of emails during sync to prevent duplicate records.
// Uses provider message IDs as the unique identifier.
//

import { db } from "@saas-template/db";
import { emailMessage, emailThread } from "@saas-template/db/schema";
import { and, eq, inArray } from "drizzle-orm";

// =============================================================================
// TYPES
// =============================================================================

export interface DeduplicationResult {
  /** IDs that are new (not in database) */
  newIds: string[];
  /** IDs that already exist in database */
  existingIds: string[];
  /** Map of provider ID to database ID for existing records */
  existingMap: Map<string, string>;
}

// =============================================================================
// THREAD DEDUPLICATION
// =============================================================================

/**
 * Check which thread IDs already exist in the database.
 *
 * @param accountId - Email account ID
 * @param providerThreadIds - Provider thread IDs to check
 * @returns Deduplication result
 */
export async function deduplicateThreads(
  accountId: string,
  providerThreadIds: string[]
): Promise<DeduplicationResult> {
  if (providerThreadIds.length === 0) {
    return { newIds: [], existingIds: [], existingMap: new Map() };
  }

  // Batch check for existing threads
  const existingThreads = await db.query.emailThread.findMany({
    where: and(
      eq(emailThread.accountId, accountId),
      inArray(emailThread.providerThreadId, providerThreadIds)
    ),
    columns: {
      id: true,
      providerThreadId: true,
    },
  });

  const existingMap = new Map<string, string>();
  const existingProviderIds = new Set<string>();

  for (const thread of existingThreads) {
    existingMap.set(thread.providerThreadId, thread.id);
    existingProviderIds.add(thread.providerThreadId);
  }

  const newIds = providerThreadIds.filter((id) => !existingProviderIds.has(id));
  const existingIds = providerThreadIds.filter((id) =>
    existingProviderIds.has(id)
  );

  return { newIds, existingIds, existingMap };
}

// =============================================================================
// MESSAGE DEDUPLICATION
// =============================================================================

/**
 * Check which message IDs already exist in the database.
 *
 * @param threadId - Thread ID in our database
 * @param providerMessageIds - Provider message IDs to check
 * @returns Deduplication result
 */
export async function deduplicateMessages(
  threadId: string,
  providerMessageIds: string[]
): Promise<DeduplicationResult> {
  if (providerMessageIds.length === 0) {
    return { newIds: [], existingIds: [], existingMap: new Map() };
  }

  // Batch check for existing messages
  const existingMessages = await db.query.emailMessage.findMany({
    where: and(
      eq(emailMessage.threadId, threadId),
      inArray(emailMessage.providerMessageId, providerMessageIds)
    ),
    columns: {
      id: true,
      providerMessageId: true,
    },
  });

  const existingMap = new Map<string, string>();
  const existingProviderIds = new Set<string>();

  for (const message of existingMessages) {
    existingMap.set(message.providerMessageId, message.id);
    existingProviderIds.add(message.providerMessageId);
  }

  const newIds = providerMessageIds.filter(
    (id) => !existingProviderIds.has(id)
  );
  const existingIds = providerMessageIds.filter((id) =>
    existingProviderIds.has(id)
  );

  return { newIds, existingIds, existingMap };
}

// =============================================================================
// BATCH DEDUPLICATION
// =============================================================================

/**
 * Efficiently deduplicate a large batch of thread IDs.
 * Processes in chunks to avoid memory issues.
 *
 * @param accountId - Email account ID
 * @param providerThreadIds - Provider thread IDs to check
 * @param chunkSize - Number of IDs to process at once
 * @returns Combined deduplication result
 */
export async function batchDeduplicateThreads(
  accountId: string,
  providerThreadIds: string[],
  chunkSize = 100
): Promise<DeduplicationResult> {
  const allNewIds: string[] = [];
  const allExistingIds: string[] = [];
  const existingMap = new Map<string, string>();

  // Process in chunks
  for (let i = 0; i < providerThreadIds.length; i += chunkSize) {
    const chunk = providerThreadIds.slice(i, i + chunkSize);
    const result = await deduplicateThreads(accountId, chunk);

    allNewIds.push(...result.newIds);
    allExistingIds.push(...result.existingIds);
    for (const [key, value] of result.existingMap) {
      existingMap.set(key, value);
    }
  }

  return {
    newIds: allNewIds,
    existingIds: allExistingIds,
    existingMap,
  };
}

// =============================================================================
// UPSERT HELPERS
// =============================================================================

/**
 * Get or create thread ID for a provider thread.
 * Used when you need to ensure a thread exists before processing messages.
 *
 * @param accountId - Email account ID
 * @param providerThreadId - Provider's thread ID
 * @returns Object with thread ID and whether it was newly created
 */
export async function getOrCreateThreadId(
  accountId: string,
  providerThreadId: string
): Promise<{ id: string; isNew: boolean }> {
  // Check if exists
  const existing = await db.query.emailThread.findFirst({
    where: and(
      eq(emailThread.accountId, accountId),
      eq(emailThread.providerThreadId, providerThreadId)
    ),
    columns: { id: true },
  });

  if (existing) {
    return { id: existing.id, isNew: false };
  }

  // Create placeholder (will be updated with full data later)
  const id = crypto.randomUUID();
  await db.insert(emailThread).values({
    id,
    accountId,
    providerThreadId,
    subject: "",
    snippet: "",
    participantEmails: [],
    messageCount: 0,
    hasAttachments: false,
    firstMessageAt: new Date(),
    lastMessageAt: new Date(),
    labels: [],
    isRead: false,
    isStarred: false,
    isArchived: false,
    isDraft: false,
    isTrashed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { id, isNew: true };
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Find orphaned threads (threads with no messages).
 * Can happen if message processing fails.
 *
 * @param accountId - Email account ID
 * @returns List of orphaned thread IDs
 */
export async function findOrphanedThreads(
  accountId: string
): Promise<string[]> {
  const threads = await db.query.emailThread.findMany({
    where: and(
      eq(emailThread.accountId, accountId),
      eq(emailThread.messageCount, 0)
    ),
    columns: { id: true },
  });

  return threads.map((t) => t.id);
}

/**
 * Remove orphaned threads.
 *
 * @param threadIds - Thread IDs to remove
 */
export async function removeOrphanedThreads(
  threadIds: string[]
): Promise<void> {
  if (threadIds.length === 0) {
    return;
  }

  await db.delete(emailThread).where(inArray(emailThread.id, threadIds));
}
