// =============================================================================
// GMAIL OAUTH CALLBACK HANDLER
// =============================================================================

import { parseOAuthState } from "@saas-template/api/routers/email-accounts";
import {
  exchangeGmailCode,
  getGmailUserInfo,
  validateGmailScopes,
} from "@saas-template/auth/providers";
import { db } from "@saas-template/db";
import { emailAccount } from "@saas-template/db/schema";
import { env } from "@saas-template/env/server";
import { tasks } from "@trigger.dev/sdk";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { safeEncryptToken } from "../../lib/crypto/tokens";
import { log } from "../../lib/logger";

const gmailOAuth = new Hono();

/**
 * Gmail OAuth callback handler
 * GET /api/oauth/gmail/callback
 *
 * This endpoint is called by Google after user authorization.
 * It exchanges the authorization code for tokens and creates the email account.
 *
 * Email accounts are scoped to organizations, not individual users.
 */
gmailOAuth.get("/callback", async (c) => {
  const { code, state, error, error_description } = c.req.query();

  // Handle OAuth errors from Google
  if (error) {
    log.warn("Gmail OAuth error", { error, error_description });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=${encodeURIComponent(error_description || error)}`
    );
  }

  // Validate required parameters
  if (!(code && state)) {
    log.warn("Gmail OAuth callback missing parameters", {
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
    log.warn("Gmail OAuth invalid state", { state: state.substring(0, 20) });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=invalid_state`
    );
  }

  const { userId, organizationId, provider } = parsedState;

  if (provider !== "gmail") {
    log.warn("Gmail OAuth state has wrong provider", { provider });
    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=invalid_provider`
    );
  }

  try {
    // Exchange code for tokens
    log.info("Exchanging Gmail authorization code", { userId, organizationId });
    const tokens = await exchangeGmailCode(code);

    // Validate scopes
    if (!validateGmailScopes(tokens.scope)) {
      log.warn("Gmail OAuth insufficient scopes", {
        userId,
        organizationId,
        scopes: tokens.scope,
      });
      return c.redirect(
        `${env.CORS_ORIGIN}/dashboard/email-accounts?error=insufficient_scopes`
      );
    }

    // Get user info
    const userInfo = await getGmailUserInfo(tokens.accessToken);

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
        log.info("Reactivating revoked Gmail account", {
          userId,
          organizationId,
          email: userInfo.email,
        });
      } else {
        log.info("Updating existing Gmail account tokens", {
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
          displayName: userInfo.name,
          lastSyncStatus: null,
          lastSyncError: null,
          updatedAt: new Date(),
        })
        .where(eq(emailAccount.id, existingAccount.id));

      accountId = existingAccount.id;
    } else {
      // Create new account for this organization
      log.info("Creating new Gmail account", {
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
          provider: "gmail",
          email: userInfo.email,
          displayName: userInfo.name,
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
        provider: "gmail",
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
      `${env.CORS_ORIGIN}/dashboard/email-accounts?success=true&provider=gmail&accountId=${accountId}`
    );
  } catch (error) {
    log.error("Gmail OAuth callback error", error, { userId, organizationId });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return c.redirect(
      `${env.CORS_ORIGIN}/dashboard/email-accounts?error=${encodeURIComponent(errorMessage)}`
    );
  }
});

export { gmailOAuth };
