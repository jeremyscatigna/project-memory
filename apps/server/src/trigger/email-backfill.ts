// =============================================================================
// EMAIL BACKFILL TRIGGER.DEV TASKS
// =============================================================================
//
// Background tasks for historical email import (backfill).
// Runs after account connection to import email history.
//

import { db } from "@saas-template/db";
import { emailAccount } from "@saas-template/db/schema";
import { task } from "@trigger.dev/sdk";
import { eq } from "drizzle-orm";
import { log } from "../lib/logger";
import {
  isAccountSyncing,
  performBackfill,
  type SyncResult,
} from "../lib/sync";

// =============================================================================
// TYPES
// =============================================================================

interface BackfillPayload {
  /** Account ID to backfill */
  accountId: string;
  /** How far back to go (days) - defaults to account settings or 90 */
  backfillDays?: number;
  /** Force backfill even if already has data */
  force?: boolean;
}

interface BackfillProgress {
  accountId: string;
  stage: "collecting" | "processing" | "complete" | "failed";
  progress: number;
  total: number;
  threadsProcessed: number;
  messagesProcessed: number;
  errors: number;
}

// =============================================================================
// BACKFILL TASK
// =============================================================================

/**
 * Full backfill task - imports historical emails for an account.
 *
 * This is a long-running task that:
 * 1. Collects all thread IDs within date range
 * 2. Deduplicates against existing data
 * 3. Fetches and processes new threads
 * 4. Updates sync cursor for future incremental syncs
 */
export const backfillEmailsTask = task({
  id: "email-backfill",
  queue: {
    name: "email-backfill",
    concurrencyLimit: 3, // Limit concurrent backfills
  },
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 10_000,
    maxTimeoutInMs: 120_000,
    factor: 2,
  },
  // Backfill can take a long time for large accounts
  maxDuration: 1800, // 30 minutes
  run: async (payload: BackfillPayload): Promise<SyncResult> => {
    const { accountId, backfillDays, force } = payload;

    log.info("Email backfill starting", {
      accountId,
      backfillDays,
      force,
    });

    // Check if account exists
    const account = await db.query.emailAccount.findFirst({
      where: eq(emailAccount.id, accountId),
    });

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // Skip if already syncing (unless forced)
    if (!force && (await isAccountSyncing(accountId))) {
      log.warn("Backfill skipped - account already syncing", { accountId });
      return {
        success: false,
        jobId: crypto.randomUUID(),
        accountId,
        type: "backfill",
        threadsProcessed: 0,
        messagesProcessed: 0,
        newThreads: 0,
        updatedThreads: 0,
        newMessages: 0,
        updatedMessages: 0,
        errors: [
          {
            code: "ALREADY_SYNCING",
            message: "Account is already syncing",
            retryable: true,
          },
        ],
        duration: 0,
      };
    }

    // Skip if already has sync cursor (unless forced)
    if (!force && account.syncCursor) {
      log.info("Backfill skipped - account already has sync cursor", {
        accountId,
      });
      return {
        success: true,
        jobId: crypto.randomUUID(),
        accountId,
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
    }

    // Override backfill days if provided
    if (backfillDays) {
      await db
        .update(emailAccount)
        .set({
          settings: {
            ...(account.settings as object),
            backfillDays,
          },
          updatedAt: new Date(),
        })
        .where(eq(emailAccount.id, accountId));
    }

    // Perform backfill with progress tracking
    let lastProgress: BackfillProgress | null = null;

    const result = await performBackfill(accountId, (progress, total) => {
      lastProgress = {
        accountId,
        stage: "processing",
        progress,
        total,
        threadsProcessed: 0,
        messagesProcessed: 0,
        errors: 0,
      };

      log.debug("Backfill progress", lastProgress);
    });

    log.info("Email backfill completed", {
      accountId,
      success: result.success,
      threadsProcessed: result.threadsProcessed,
      messagesProcessed: result.messagesProcessed,
      newThreads: result.newThreads,
      errors: result.errors.length,
      duration: result.duration,
    });

    return result;
  },
});

// =============================================================================
// AUTO-BACKFILL TASK
// =============================================================================

/**
 * Triggered automatically when a new email account is connected.
 * Initiates the backfill process with default settings.
 */
export const autoBackfillTask = task({
  id: "email-auto-backfill",
  queue: {
    name: "email-backfill",
    concurrencyLimit: 3,
  },
  run: async (payload: {
    accountId: string;
  }): Promise<{ triggered: boolean }> => {
    const { accountId } = payload;

    log.info("Auto-backfill triggered for new account", { accountId });

    // Trigger the full backfill task
    await backfillEmailsTask.trigger({
      accountId,
      force: false,
    });

    return { triggered: true };
  },
});

// =============================================================================
// RESUME BACKFILL TASK
// =============================================================================

/**
 * Resume a failed or interrupted backfill.
 * Uses existing progress to continue from where it left off.
 */
export const resumeBackfillTask = task({
  id: "email-resume-backfill",
  queue: {
    name: "email-backfill",
    concurrencyLimit: 3,
  },
  maxDuration: 1800, // 30 minutes
  run: async (payload: { accountId: string }): Promise<SyncResult> => {
    const { accountId } = payload;

    log.info("Resuming backfill", { accountId });

    // Check account status
    const account = await db.query.emailAccount.findFirst({
      where: eq(emailAccount.id, accountId),
    });

    if (!account) {
      throw new Error(`Account not found: ${accountId}`);
    }

    // If account has cursor, it was already completed
    if (account.syncCursor) {
      log.info("Backfill already complete", { accountId });
      return {
        success: true,
        jobId: crypto.randomUUID(),
        accountId,
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
    }

    // Reset status and retry
    await db
      .update(emailAccount)
      .set({
        status: "active",
        lastSyncError: null,
        updatedAt: new Date(),
      })
      .where(eq(emailAccount.id, accountId));

    // Perform backfill (will skip already processed threads via deduplication)
    const result = await performBackfill(accountId);

    log.info("Resume backfill completed", {
      accountId,
      success: result.success,
      threadsProcessed: result.threadsProcessed,
    });

    return result;
  },
});

// =============================================================================
// EXPORTS
// =============================================================================

export type { BackfillPayload, BackfillProgress };
