// =============================================================================
// EMAIL PROCESSING PIPELINE
// =============================================================================
//
// Transforms raw email data from providers into Evidence Store format.
// Handles thread reconstruction, message normalization, participant extraction,
// and attachment metadata processing.
//

import { db } from "@saas-template/db";
import {
  emailAttachment,
  emailMessage,
  emailParticipant,
  emailThread,
} from "@saas-template/db/schema";
import { and, eq } from "drizzle-orm";
import type {
  AttachmentMetadata,
  EmailMessageData,
  EmailThreadData,
  EmailThreadWithMessages,
} from "../email-client/types";
import { log } from "../logger";
import type { BatchResult, ProcessedThread, SyncError } from "./types";

// =============================================================================
// THREAD PROCESSING
// =============================================================================

/**
 * Process a thread and its messages into the Evidence Store.
 *
 * @param accountId - Email account ID
 * @param threadData - Thread with messages from provider
 * @param options - Processing options
 * @returns Processed thread result
 */
export async function processThread(
  accountId: string,
  threadData: EmailThreadWithMessages,
  options: { skipExisting?: boolean; forceUpdate?: boolean } = {}
): Promise<ProcessedThread> {
  const { skipExisting = true, forceUpdate = false } = options;

  // Check if thread exists
  const existingThread = await db.query.emailThread.findFirst({
    where: and(
      eq(emailThread.accountId, accountId),
      eq(emailThread.providerThreadId, threadData.providerThreadId)
    ),
  });

  const isNew = !existingThread;

  // Skip if exists and not forcing update
  if (existingThread && skipExisting && !forceUpdate) {
    return {
      thread: threadData,
      messages: threadData.messages,
      isNew: false,
      wasUpdated: false,
    };
  }

  // Upsert thread
  const threadId = existingThread?.id ?? crypto.randomUUID();
  const threadRecord = mapThreadToRecord(accountId, threadId, threadData);

  if (existingThread) {
    await db
      .update(emailThread)
      .set({ ...threadRecord, updatedAt: new Date() })
      .where(eq(emailThread.id, existingThread.id));
  } else {
    await db.insert(emailThread).values(threadRecord);
  }

  // Process messages
  for (const message of threadData.messages) {
    await processMessage(threadId, message, { skipExisting, forceUpdate });
  }

  return {
    thread: threadData,
    messages: threadData.messages,
    isNew,
    wasUpdated: !isNew,
  };
}

/**
 * Map thread data to database record format
 */
function mapThreadToRecord(
  accountId: string,
  threadId: string,
  thread: EmailThreadData
) {
  return {
    id: threadId,
    accountId,
    providerThreadId: thread.providerThreadId,
    subject: thread.subject,
    snippet: thread.snippet,
    participantEmails: thread.participants.map((p) => p.email),
    messageCount: thread.messageCount,
    hasAttachments: thread.hasAttachments,
    firstMessageAt: thread.firstMessageAt,
    lastMessageAt: thread.lastMessageAt,
    labels: thread.labels,
    isRead: thread.isRead,
    isStarred: thread.isStarred,
    isArchived: thread.isArchived,
    isDraft: thread.isDraft,
    isTrashed: thread.isTrashed,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// =============================================================================
// MESSAGE PROCESSING
// =============================================================================

/**
 * Process a single message into the Evidence Store.
 *
 * @param threadId - Thread ID in our database
 * @param message - Message data from provider
 * @param options - Processing options
 * @returns Message ID
 */
export async function processMessage(
  threadId: string,
  message: EmailMessageData,
  options: { skipExisting?: boolean; forceUpdate?: boolean } = {}
): Promise<string> {
  const { skipExisting = true, forceUpdate = false } = options;

  // Check if message exists
  const existingMessage = await db.query.emailMessage.findFirst({
    where: and(
      eq(emailMessage.threadId, threadId),
      eq(emailMessage.providerMessageId, message.providerMessageId)
    ),
  });

  // Skip if exists and not forcing update
  if (existingMessage && skipExisting && !forceUpdate) {
    return existingMessage.id;
  }

  const messageId = existingMessage?.id ?? crypto.randomUUID();
  const messageRecord = mapMessageToRecord(threadId, messageId, message);

  if (existingMessage) {
    await db
      .update(emailMessage)
      .set({ ...messageRecord, updatedAt: new Date() })
      .where(eq(emailMessage.id, existingMessage.id));
  } else {
    await db.insert(emailMessage).values(messageRecord);

    // Process participants for new messages
    await processParticipants(messageId, message);

    // Process attachments for new messages
    await processAttachments(messageId, message.attachments);
  }

  return messageId;
}

/**
 * Map message data to database record format
 */
function mapMessageToRecord(
  threadId: string,
  messageId: string,
  message: EmailMessageData
) {
  return {
    id: messageId,
    threadId,
    providerMessageId: message.providerMessageId,
    inReplyTo: message.inReplyTo,
    references: message.references,
    from: { email: message.from.email, name: message.from.name },
    to: message.to.map((r) => ({ email: r.email, name: r.name })),
    cc: message.cc.map((r) => ({ email: r.email, name: r.name })),
    bcc: message.bcc.map((r) => ({ email: r.email, name: r.name })),
    subject: message.subject,
    bodyText: message.bodyText,
    bodyHtml: message.bodyHtml,
    snippet: message.snippet,
    sentAt: message.sentAt,
    receivedAt: message.receivedAt,
    headers: message.headers,
    labelIds: message.labels,
    sizeBytes: message.sizeBytes,
    isFromUser: message.isFromUser,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// =============================================================================
// PARTICIPANT PROCESSING
// =============================================================================

/**
 * Extract and store participants from a message.
 *
 * @param messageId - Message ID in our database
 * @param message - Message data with participants
 */
export async function processParticipants(
  messageId: string,
  message: EmailMessageData
): Promise<void> {
  const participants: Array<{
    id: string;
    messageId: string;
    email: string;
    displayName: string | null;
    role: "from" | "to" | "cc" | "bcc";
  }> = [];

  // From
  participants.push({
    id: crypto.randomUUID(),
    messageId,
    email: message.from.email,
    displayName: message.from.name ?? null,
    role: "from",
  });

  // To
  for (const recipient of message.to) {
    participants.push({
      id: crypto.randomUUID(),
      messageId,
      email: recipient.email,
      displayName: recipient.name ?? null,
      role: "to",
    });
  }

  // CC
  for (const recipient of message.cc) {
    participants.push({
      id: crypto.randomUUID(),
      messageId,
      email: recipient.email,
      displayName: recipient.name ?? null,
      role: "cc",
    });
  }

  // BCC
  for (const recipient of message.bcc) {
    participants.push({
      id: crypto.randomUUID(),
      messageId,
      email: recipient.email,
      displayName: recipient.name ?? null,
      role: "bcc",
    });
  }

  if (participants.length > 0) {
    await db.insert(emailParticipant).values(participants);
  }
}

// =============================================================================
// ATTACHMENT PROCESSING
// =============================================================================

/**
 * Store attachment metadata.
 *
 * @param messageId - Message ID in our database
 * @param attachments - Attachment metadata from provider
 */
export async function processAttachments(
  messageId: string,
  attachments: AttachmentMetadata[]
): Promise<void> {
  if (attachments.length === 0) {
    return;
  }

  const records = attachments.map((attachment) => ({
    id: crypto.randomUUID(),
    messageId,
    providerAttachmentId: attachment.id,
    filename: attachment.filename,
    mimeType: attachment.mimeType,
    size: attachment.size,
    contentId: attachment.contentId,
    isInline: attachment.isInline,
    createdAt: new Date(),
  }));

  await db.insert(emailAttachment).values(records);
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

/**
 * Process a batch of threads.
 *
 * @param accountId - Email account ID
 * @param threads - Threads to process
 * @param options - Processing options
 * @returns Batch result summary
 */
export async function processBatch(
  accountId: string,
  threads: EmailThreadWithMessages[],
  options: {
    skipExisting?: boolean;
    forceUpdate?: boolean;
    batchSize?: number;
  } = {}
): Promise<BatchResult> {
  const { batchSize = 50 } = options;
  const result: BatchResult = {
    processed: 0,
    skipped: 0,
    errors: [],
    threads: [],
  };

  // Process in smaller batches for memory efficiency
  for (let i = 0; i < threads.length; i += batchSize) {
    const batch = threads.slice(i, i + batchSize);

    for (const threadData of batch) {
      try {
        const processed = await processThread(accountId, threadData, options);
        result.threads.push(processed);

        if (processed.isNew || processed.wasUpdated) {
          result.processed++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        const syncError: SyncError = {
          code: "PROCESSING_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
          threadId: threadData.id,
          retryable: true,
        };
        result.errors.push(syncError);

        log.error("Error processing thread", error, {
          threadId: threadData.id,
          accountId,
        });
      }
    }
  }

  return result;
}

// =============================================================================
// THREAD METADATA UPDATES
// =============================================================================

/**
 * Update thread metadata without reprocessing messages.
 * Used for label changes, read status, etc.
 *
 * @param accountId - Email account ID
 * @param providerThreadId - Provider's thread ID
 * @param updates - Fields to update
 */
export async function updateThreadMetadata(
  accountId: string,
  providerThreadId: string,
  updates: Partial<{
    labels: string[];
    isRead: boolean;
    isStarred: boolean;
    isArchived: boolean;
    isDraft: boolean;
    isTrashed: boolean;
  }>
): Promise<void> {
  await db
    .update(emailThread)
    .set({ ...updates, updatedAt: new Date() })
    .where(
      and(
        eq(emailThread.accountId, accountId),
        eq(emailThread.providerThreadId, providerThreadId)
      )
    );
}

/**
 * Mark a thread as deleted (soft delete).
 *
 * @param accountId - Email account ID
 * @param providerThreadId - Provider's thread ID
 */
export async function markThreadDeleted(
  accountId: string,
  providerThreadId: string
): Promise<void> {
  await db
    .update(emailThread)
    .set({ isTrashed: true, updatedAt: new Date() })
    .where(
      and(
        eq(emailThread.accountId, accountId),
        eq(emailThread.providerThreadId, providerThreadId)
      )
    );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get thread ID from provider thread ID.
 */
export async function getThreadId(
  accountId: string,
  providerThreadId: string
): Promise<string | null> {
  const thread = await db.query.emailThread.findFirst({
    where: and(
      eq(emailThread.accountId, accountId),
      eq(emailThread.providerThreadId, providerThreadId)
    ),
    columns: { id: true },
  });
  return thread?.id ?? null;
}

/**
 * Check if a message exists by provider ID.
 */
export async function messageExists(
  threadId: string,
  providerMessageId: string
): Promise<boolean> {
  const message = await db.query.emailMessage.findFirst({
    where: and(
      eq(emailMessage.threadId, threadId),
      eq(emailMessage.providerMessageId, providerMessageId)
    ),
    columns: { id: true },
  });
  return !!message;
}

/**
 * Get sync statistics for an account.
 */
export async function getSyncStats(accountId: string): Promise<{
  threadCount: number;
  messageCount: number;
  lastSyncAt: Date | null;
}> {
  const [threadCount] = await db
    .select({ count: emailThread.id })
    .from(emailThread)
    .where(eq(emailThread.accountId, accountId));

  // Get the most recent message's receivedAt as lastSyncAt
  const latestThread = await db.query.emailThread.findFirst({
    where: eq(emailThread.accountId, accountId),
    orderBy: (t, { desc }) => [desc(t.lastMessageAt)],
    columns: { lastMessageAt: true },
  });

  // Count messages across all threads for this account
  const threads = await db.query.emailThread.findMany({
    where: eq(emailThread.accountId, accountId),
    columns: { messageCount: true },
  });
  const messageCount = threads.reduce((sum, t) => sum + t.messageCount, 0);

  return {
    threadCount: Number(threadCount?.count ?? 0),
    messageCount,
    lastSyncAt: latestThread?.lastMessageAt ?? null,
  };
}
