// =============================================================================
// OUTLOOK OAUTH CALLBACK HANDLER
// =============================================================================

import { parseOAuthState } from "@saas-template/api/routers/email-accounts";
import {
  exchangeOutlookCode,
  getOutlookUserInfo,
  validateOutlookScopes,
} from "@saas-template/auth/providers";
import { db } from "@saas-template/db";
import { emailAccount } from "@saas-template/db/schema";
import { env } from "@saas-template/env/server";
import { tasks } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { safeEncryptToken } from "../../lib/crypto/tokens";
import { log } from "../../lib/logger";

const outlookOAuth = new Hono();

/**
 * Outlook OAuth callback handler
 * GET /api/oauth/outlook/callback
 *
 * This endpoint is called by Microsoft after user authorization.
 * It exchanges the authorization code for tokens and creates the email account.
 *
 * Email accounts are scoped to organizations, not individual users.
 */
outlookOAuth.get("/callback", async (c) => {
  const { code, state, error, error_description } = c.req.query();

  // Handle OAuth errors from Microsoft
  if (error) {
    log.warn("Outlook OAuth error", { error, error_description });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=${encodeURIComponent(error_description || error)}`
    );
  }

  // Validate required parameters
  if (!(code && state)) {
    log.warn("Outlook OAuth callback missing parameters", {
      hasCode: !!code,
      hasState: !!state,
    });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=invalid_request`
    );
  }

  // Parse and validate state token
  const parsedState = parseOAuthState(state);

  if (!parsedState.isValid) {
    log.warn("Outlook OAuth invalid state", { state: state.substring(0, 20) });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=invalid_state`
    );
  }

  const { userId, organizationId, provider } = parsedState;

  if (provider !== "outlook") {
    log.warn("Outlook OAuth state has wrong provider", { provider });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=invalid_provider`
    );
  }

  try {
    // Exchange code for tokens
    log.info("Exchanging Outlook authorization code", {
      userId,
      organizationId,
    });
    const tokens = await exchangeOutlookCode(code);

    // Validate scopes
    if (!validateOutlookScopes(tokens.scope)) {
      log.warn("Outlook OAuth insufficient scopes", {
        userId,
        organizationId,
        scopes: tokens.scope,
      });
      return c.redirect(
        `${env.CORS_ORIGIN}/dashboard/email-accounts?error=insufficient_scopes`
      );
    }

    // Get user info from Microsoft Graph
    const userInfo = await getOutlookUserInfo(tokens.accessToken);

    // Check if this email is already connected to this organization
    const existingAccount = await db.query.emailAccount.findFirst({
      where: and(
        eq(emailAccount.organizationId, organizationId),
        eq(emailAccount.email, userInfo.email)
      ),
    });

    let accountId: string;

    if (existingAccount) {
      // Update existing account (reconnection)
      if (existingAccount.status === "revoked") {
        log.info("Reactivating revoked Outlook account", {
          userId,
          organizationId,
          email: userInfo.email,
        });
      } else {
        log.info("Updating existing Outlook account tokens", {
          userId,
          organizationId,
          email: userInfo.email,
        });
      }

      await db
        .update(emailAccount)
        .set({
          accessToken: safeEncryptToken(tokens.accessToken),
          refreshToken: safeEncryptToken(tokens.refreshToken),
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          status: "active",
          displayName: userInfo.displayName,
          lastSyncStatus: null,
          lastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(emailAccount.id, existingAccount.id));

      accountId = existingAccount.id;
    } else {
      // Create new account for this organization
      log.info("Creating new Outlook account", {
        userId,
        organizationId,
        email: userInfo.email,
      });

      // Check if organization has any other accounts to determine if this should be primary
      const existingAccounts = await db.query.emailAccount.findMany({
        where: eq(emailAccount.organizationId, organizationId),
      });

      const isPrimary = existingAccounts.length === 0;

      const result = await db
        .insert(emailAccount)
        .values({
          organizationId,
          addedByUserId: userId,
          provider: "outlook",
          email: userInfo.email,
          displayName: userInfo.displayName,
          accessToken: safeEncryptToken(tokens.accessToken),
          refreshToken: safeEncryptToken(tokens.refreshToken),
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000),
          status: "active",
          isPrimary,
          settings: {
            syncEnabled: true,
            syncFrequencyMinutes: 5,
            backfillDays: 90,
          },
        })
        .returning({ id: emailAccount.id });

      const newAccount = result[0];
      if (!newAccount) {
        throw new Error("Failed to create email account");
      }
      accountId = newAccount.id;
    }

    // Trigger initial sync job (will be implemented in PRD-02)
    try {
      await tasks.trigger("email-backfill", {
        accountId,
        provider: "outlook",
      });
      log.info("Triggered email backfill job", { accountId });
    } catch (triggerError) {
      // Don't fail the OAuth flow if trigger fails
      log.error("Failed to trigger email backfill job", triggerError, {
        accountId,
      });
    }

    // Redirect to success page
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?success=true&provider=outlook&accountId=${accountId}`
    );
  } catch (error) {
    log.error("Outlook OAuth callback error", error, {
      userId,
      organizationId,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=${encodeURIComponent(errorMessage)}`
    );
  }
});

export { outlookOAuth };
