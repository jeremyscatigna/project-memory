# PRD-01: Email Provider Integration

> Gmail and Outlook OAuth Integration

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-01 |
| **Title** | Email Provider Integration |
| **Phase** | 1 - Ingestion Layer |
| **Dependencies** | PRD-00 (Data Model) |
| **Dependent PRDs** | PRD-02 (Email Sync) |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Users have email data locked in Gmail (Google Workspace) and Outlook (Microsoft 365). To build an intelligence layer on email, we must:

1. **Securely connect** to user email accounts via OAuth 2.0
2. **Maintain access** through token refresh cycles
3. **Handle disconnections** gracefully when tokens expire or users revoke access
4. **Support multiple accounts** per user (personal + work)
5. **Provide unified access** regardless of provider

Without robust provider integration, no intelligence extraction is possible.

## Target Users

### Primary: Individual Users
- Connect personal Gmail or Outlook accounts
- Expect seamless OAuth flow (< 30 seconds)
- Want visibility into connection status

### Secondary: Google Workspace / Microsoft 365 Admins
- May need to approve OAuth app for organization
- Require understanding of scopes requested
- Need audit trail of data access

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| OAuth completion rate | > 95% | Successful connections / OAuth initiations |
| Token refresh success | > 99.9% | Automatic refreshes / Total refresh attempts |
| Account reconnection rate | < 5% | Manual reconnections needed / Active accounts |
| Time to first sync | < 60 seconds | OAuth complete to first email visible |
| Multi-account adoption | > 30% | Users with 2+ connected accounts |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: OAuth Flow Management
Secure authentication with email providers.

#### Feature: Gmail OAuth Initiation
- **Description**: Start OAuth 2.0 flow for Gmail/Google Workspace
- **Inputs**: User ID, requested scopes, redirect URI
- **Outputs**: Authorization URL for redirect
- **Behavior**: Generate state token, construct Google OAuth URL, store pending auth state

#### Feature: Outlook OAuth Initiation
- **Description**: Start OAuth 2.0 flow for Microsoft 365/Outlook
- **Inputs**: User ID, requested scopes, redirect URI
- **Outputs**: Authorization URL for redirect
- **Behavior**: Generate state token, construct Microsoft OAuth URL, store pending auth state

#### Feature: OAuth Callback Handling
- **Description**: Process OAuth callback and exchange code for tokens
- **Inputs**: Authorization code, state token
- **Outputs**: Access token, refresh token, expiration
- **Behavior**: Validate state, exchange code, store encrypted tokens, create email account record

#### Feature: Token Refresh
- **Description**: Automatically refresh expired access tokens
- **Inputs**: Refresh token, provider type
- **Outputs**: New access token, updated expiration
- **Behavior**: Detect expiring tokens, call refresh endpoint, update stored tokens

#### Feature: Account Disconnection
- **Description**: Handle user-initiated or forced disconnections
- **Inputs**: Account ID, disconnection reason
- **Outputs**: Updated account status
- **Behavior**: Revoke tokens at provider, mark account inactive, preserve historical data

---

### Capability: Account Management
CRUD operations for connected email accounts.

#### Feature: List Connected Accounts
- **Description**: Show all email accounts for an organization
- **Inputs**: Organization ID (from authenticated user's active org)
- **Outputs**: List of accounts with status, last sync, message count
- **Behavior**: Query accounts scoped to organization, compute derived stats, return with provider metadata

#### Feature: Account Status Monitoring
- **Description**: Track health of connected accounts
- **Inputs**: Account ID
- **Outputs**: Status (active, expired, revoked, syncing)
- **Behavior**: Check token validity, last sync success, pending errors

#### Feature: Account Settings
- **Description**: Configure per-account sync preferences
- **Inputs**: Account ID, settings (sync frequency, label filters, date range)
- **Outputs**: Updated settings
- **Behavior**: Validate settings, store preferences, apply to next sync

#### Feature: Primary Account Selection
- **Description**: Designate primary account for sending/default views
- **Inputs**: Account ID
- **Outputs**: Updated primary flag
- **Behavior**: Clear previous primary, set new primary, propagate to UI

---

### Capability: Provider Abstraction
Unified interface regardless of email provider.

#### Feature: Provider Detection
- **Description**: Identify provider from email address
- **Inputs**: Email address
- **Outputs**: Provider type (gmail, outlook, other)
- **Behavior**: Check domain patterns, MX records if needed

#### Feature: Unified Email Client
- **Description**: Abstract provider-specific APIs
- **Inputs**: Account credentials, operation type
- **Outputs**: Standardized response
- **Behavior**: Route to Gmail API or Microsoft Graph, normalize responses

#### Feature: Rate Limit Handling
- **Description**: Respect provider rate limits
- **Inputs**: API call request
- **Outputs**: Response or retry-after signal
- **Behavior**: Track quota usage, implement backoff, queue requests

#### Feature: Error Normalization
- **Description**: Convert provider errors to standard format
- **Inputs**: Provider-specific error
- **Outputs**: Normalized error with user-friendly message
- **Behavior**: Map error codes, determine retry eligibility, log for debugging

---

### Capability: Security & Compliance
Protect user credentials and data.

#### Feature: Token Encryption
- **Description**: Encrypt OAuth tokens at rest
- **Inputs**: Raw token, encryption key
- **Outputs**: Encrypted token blob
- **Behavior**: AES-256 encryption, key rotation support

#### Feature: Scope Minimization
- **Description**: Request only necessary OAuth scopes
- **Inputs**: Required capabilities
- **Outputs**: Minimal scope set
- **Behavior**: Map features to scopes, request incrementally if possible

#### Feature: Audit Logging
- **Description**: Log all OAuth and access events
- **Inputs**: Event type, account, metadata
- **Outputs**: Audit record
- **Behavior**: Record connections, disconnections, token refreshes, API calls

#### Feature: Consent Management
- **Description**: Track and display what access user has granted
- **Inputs**: Account ID
- **Outputs**: Granted scopes, consent timestamp
- **Behavior**: Query provider consent info, display human-readable permissions

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/
├── auth/
│   └── src/
│       ├── providers/
│       │   ├── gmail.ts          # Gmail OAuth configuration
│       │   └── outlook.ts        # Microsoft OAuth configuration
│       └── index.ts              # Better Auth configuration
├── api/
│   └── src/
│       └── routers/
│           └── email-accounts.ts # Account management tRPC router
apps/
├── server/
│   └── src/
│       ├── routes/
│       │   └── oauth/
│       │       ├── gmail.ts      # Gmail callback handler
│       │       └── outlook.ts    # Outlook callback handler
│       └── lib/
│           └── email-client/
│               ├── index.ts      # Provider abstraction
│               ├── gmail.ts      # Gmail API client
│               ├── outlook.ts    # Microsoft Graph client
│               └── types.ts      # Shared types
└── web/
    └── src/
        └── routes/
            └── dashboard/
                └── email-accounts.tsx  # Account management UI
```

## Module Definitions

### Module: packages/auth/src/providers/gmail.ts
- **Maps to capability**: OAuth Flow Management (Gmail)
- **Responsibility**: Gmail OAuth configuration
- **Exports**:
  - `gmailOAuthConfig` - OAuth client configuration
  - `GMAIL_SCOPES` - Required OAuth scopes

### Module: packages/auth/src/providers/outlook.ts
- **Maps to capability**: OAuth Flow Management (Outlook)
- **Responsibility**: Microsoft OAuth configuration
- **Exports**:
  - `outlookOAuthConfig` - OAuth client configuration
  - `OUTLOOK_SCOPES` - Required OAuth scopes

### Module: packages/api/src/routers/email-accounts.ts
- **Maps to capability**: Account Management
- **Responsibility**: tRPC procedures for account operations
- **Exports**:
  - `emailAccountsRouter` - tRPC router
  - Procedures: `list`, `get`, `connect`, `disconnect`, `updateSettings`, `setPrimary`

### Module: apps/server/src/lib/email-client/index.ts
- **Maps to capability**: Provider Abstraction
- **Responsibility**: Unified email client interface
- **Exports**:
  - `createEmailClient(account)` - Factory function
  - `EmailClient` interface

### Module: apps/web/src/routes/dashboard/email-accounts.tsx
- **Maps to capability**: Account Management (UI)
- **Responsibility**: Account management interface
- **Exports**:
  - Default route component

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### Foundation Layer (Phase 0)
From PRD-00:
- `emailAccount` table must exist

### Provider Layer (Phase 1.0)
- **gmail.ts**: No dependencies (OAuth config only)
- **outlook.ts**: No dependencies (OAuth config only)

### API Layer (Phase 1.1)
- **email-accounts.ts**: Depends on [gmail.ts, outlook.ts, emailAccount table]

### Client Layer (Phase 1.2)
- **email-client/gmail.ts**: Depends on [gmail.ts]
- **email-client/outlook.ts**: Depends on [outlook.ts]
- **email-client/index.ts**: Depends on [gmail.ts, outlook.ts]

### UI Layer (Phase 1.3)
- **email-accounts.tsx**: Depends on [email-accounts.ts router]

### Integration Layer (Phase 1.4)
- **OAuth callback handlers**: Depends on [gmail.ts, outlook.ts, email-accounts.ts]

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 1.0: OAuth Configuration
**Goal**: Configure OAuth clients for Gmail and Outlook

**Entry Criteria**: PRD-00 schema deployed (emailAccount table)

**Tasks**:
- [ ] Create Gmail OAuth configuration (depends on: PRD-00)
  - Acceptance: OAuth client ID/secret configured, scopes defined
  - Test: Configuration validation tests
- [ ] Create Outlook OAuth configuration (depends on: PRD-00)
  - Acceptance: Azure AD app configured, scopes defined
  - Test: Configuration validation tests
- [ ] Set up environment variables for OAuth credentials
  - Acceptance: `.env.example` updated, validation in env package
  - Test: Missing credential detection

**Exit Criteria**: OAuth configs load without errors

**Delivers**: Foundation for OAuth flows

---

### Phase 1.1: Account Management API
**Goal**: Create tRPC router for email account operations

**Entry Criteria**: Phase 1.0 complete

**Tasks**:
- [ ] Implement `list` procedure (depends on: emailAccount table)
  - Acceptance: Returns accounts with status, sync info
  - Test: Empty list, multiple accounts, pagination
- [ ] Implement `connect` procedure (depends on: OAuth configs)
  - Acceptance: Generates OAuth URL, stores pending state
  - Test: Gmail flow, Outlook flow, duplicate prevention
- [ ] Implement `disconnect` procedure (depends on: list)
  - Acceptance: Revokes tokens, marks inactive
  - Test: Successful disconnect, already disconnected
- [ ] Implement `updateSettings` procedure (depends on: list)
  - Acceptance: Updates sync preferences
  - Test: Valid settings, invalid settings rejected
- [ ] Implement `setPrimary` procedure (depends on: list)
  - Acceptance: Updates primary flag atomically
  - Test: Set primary, change primary, only one primary

**Exit Criteria**: All procedures working with tests

**Delivers**: API for account management

---

### Phase 1.2: Email Client Abstraction
**Goal**: Create unified interface for email providers

**Entry Criteria**: Phase 1.1 complete

**Tasks**:
- [ ] Define EmailClient interface (depends on: none)
  - Acceptance: Common operations defined
  - Test: Type-level tests
- [ ] Implement Gmail client (depends on: interface, gmail.ts)
  - Acceptance: Token refresh, API calls work
  - Test: List threads, get thread, rate limits
- [ ] Implement Outlook client (depends on: interface, outlook.ts)
  - Acceptance: Token refresh, API calls work
  - Test: List messages, get conversation, rate limits
- [ ] Implement client factory (depends on: both clients)
  - Acceptance: Creates correct client from account
  - Test: Gmail account, Outlook account, invalid provider
- [ ] Implement error normalization (depends on: both clients)
  - Acceptance: Standard error format
  - Test: Auth errors, rate limits, not found

**Exit Criteria**: Both providers work through unified interface

**Delivers**: Provider-agnostic email access

---

### Phase 1.3: Account Management UI
**Goal**: Build account connection/management interface

**Entry Criteria**: Phase 1.2 complete

**Tasks**:
- [ ] Create email accounts page layout (depends on: none)
  - Acceptance: Responsive grid of account cards
  - Test: Visual regression tests
- [ ] Implement account card component (depends on: layout)
  - Acceptance: Shows status, last sync, actions
  - Test: All status states, loading states
- [ ] Implement connect account flow (depends on: connect procedure)
  - Acceptance: Provider selection, OAuth redirect, success/error
  - Test: Full flow E2E tests
- [ ] Implement disconnect confirmation (depends on: disconnect procedure)
  - Acceptance: Confirmation dialog, success feedback
  - Test: Confirm flow, cancel flow
- [ ] Implement settings panel (depends on: updateSettings procedure)
  - Acceptance: Edit sync preferences inline
  - Test: Save settings, validation errors

**Exit Criteria**: Full account management in UI

**Delivers**: User can connect/manage email accounts

---

### Phase 1.4: OAuth Callback Handlers
**Goal**: Handle OAuth redirects from providers

**Entry Criteria**: Phase 1.1 complete

**Tasks**:
- [ ] Create Gmail callback route (depends on: gmail.ts, email-accounts.ts)
  - Acceptance: Exchanges code, creates account, redirects
  - Test: Success flow, error handling, state mismatch
- [ ] Create Outlook callback route (depends on: outlook.ts, email-accounts.ts)
  - Acceptance: Exchanges code, creates account, redirects
  - Test: Success flow, error handling, state mismatch
- [ ] Implement token storage with encryption (depends on: callbacks)
  - Acceptance: Tokens encrypted at rest
  - Test: Encryption/decryption roundtrip
- [ ] Implement automatic token refresh job (depends on: callbacks)
  - Acceptance: Refreshes tokens before expiry
  - Test: Refresh timing, failure handling

**Exit Criteria**: Full OAuth flows working

**Delivers**: Users can authenticate with email providers

</implementation-roadmap>

---

<test-strategy>

## Test Pyramid

```
        /\
       /E2E\       ← 15% (Full OAuth flows)
      /------\
     /Integration\ ← 35% (Provider API mocking)
    /------------\
   /  Unit Tests  \ ← 50% (Config, utilities, error handling)
  /----------------\
```

## Coverage Requirements
- Line coverage: 85% minimum
- Branch coverage: 80% minimum
- Function coverage: 90% minimum

## Critical Test Scenarios

### OAuth Flow (gmail.ts, outlook.ts)
**Happy path**:
- User clicks connect → OAuth redirect → Callback → Account created
- Expected: Account appears in list with "active" status

**Edge cases**:
- User cancels OAuth flow
- User already has this account connected
- OAuth state expires (user takes too long)
- Expected: Appropriate error messages, no duplicate accounts

**Error cases**:
- Invalid OAuth credentials (misconfigured app)
- Provider returns error (user denied access)
- Network failure during token exchange
- Expected: User-friendly error, no partial state

### Token Management
**Happy path**:
- Token nearing expiry → Auto-refresh → New token stored
- Expected: Seamless continued access

**Edge cases**:
- Refresh token also expired
- User revoked access in provider settings
- Expected: Account marked as needing reconnection

**Error cases**:
- Refresh endpoint unavailable
- Encrypted token corrupted
- Expected: Graceful degradation, clear error state

### Provider Abstraction
**Happy path**:
- Create Gmail client → List threads → Get thread detail
- Create Outlook client → List messages → Get conversation
- Expected: Consistent response format

**Edge cases**:
- Empty inbox
- Thread with 100+ messages
- Message with large attachments
- Expected: Proper handling, pagination support

**Error cases**:
- Rate limit exceeded
- Invalid access token
- Thread/message not found
- Expected: Standard error format, retry hints

## Test Generation Guidelines
- Mock provider APIs for unit/integration tests
- Use real OAuth for E2E (with test accounts)
- Test token encryption with various key lengths
- Include race condition tests for concurrent refresh

</test-strategy>

---

<architecture>

## System Components

### Better Auth Integration
- Extend Better Auth with custom OAuth providers
- Leverage existing session management
- Store email-specific tokens separately from auth tokens

### OAuth State Management
- Use signed, time-limited state tokens
- Store pending auth in Redis for distributed deployments
- Clean up expired pending auths

### Token Storage
- AES-256-GCM encryption for tokens
- Encryption key from environment variable
- Support key rotation without re-encryption

## Data Models

### OAuth Scopes

```typescript
// Gmail scopes - Full read/write access for email intelligence + drafting
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',    // Read, modify labels, archive, delete
  'https://www.googleapis.com/auth/gmail.send',      // Send emails on behalf of user
  'https://www.googleapis.com/auth/gmail.compose',   // Create, read, update, delete drafts
  'https://www.googleapis.com/auth/userinfo.email',  // Get email address
  'https://www.googleapis.com/auth/userinfo.profile', // Get display name
] as const;

// Outlook scopes - Full read/write access for email intelligence + drafting
export const OUTLOOK_SCOPES = [
  'Mail.ReadWrite',        // Read, modify, delete emails
  'Mail.Send',             // Send emails on behalf of user
  'MailboxSettings.Read',  // Read mailbox settings (folders, rules)
  'User.Read',             // Read user profile
  'offline_access',        // Refresh tokens
  'openid',                // OpenID Connect
  'profile',               // Profile info
  'email',                 // Email address
] as const;
```

### Email Client Interface

```typescript
interface EmailClient {
  // List threads/conversations with pagination
  listThreads(options: {
    maxResults?: number;
    pageToken?: string;
    query?: string;
    labelIds?: string[];
  }): Promise<ThreadListResponse>;

  // Get full thread with all messages
  getThread(threadId: string): Promise<ThreadResponse>;

  // Get single message
  getMessage(messageId: string): Promise<MessageResponse>;

  // Get attachment content
  getAttachment(messageId: string, attachmentId: string): Promise<AttachmentResponse>;

  // Check if token needs refresh
  needsRefresh(): boolean;

  // Refresh access token
  refreshToken(): Promise<void>;

  // Get account info
  getAccountInfo(): Promise<AccountInfo>;
}

interface ThreadListResponse {
  threads: ThreadSummary[];
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

interface ThreadResponse {
  id: string;
  historyId: string;
  messages: MessageResponse[];
}

interface MessageResponse {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: MessagePart;
  sizeEstimate: number;
}
```

### Account Settings

```typescript
interface EmailAccountSettings {
  // Sync frequency
  syncIntervalMinutes: number; // 5, 15, 30, 60

  // Label/folder filters
  includedLabels?: string[];    // Only sync these labels
  excludedLabels?: string[];    // Skip these labels

  // Date range
  syncFromDate?: Date;          // Don't sync before this date

  // Notifications
  notifyOnNewEmails: boolean;
  notifyOnSyncErrors: boolean;
}
```

## Technology Decisions

### Decision: Google APIs (vs IMAP)
- **Rationale**: Better performance, native OAuth, batch operations, real-time push
- **Trade-offs**: Google-specific, requires app review for production
- **Alternatives considered**: IMAP (slower, no push, credentials instead of OAuth)

### Decision: Microsoft Graph (vs EWS)
- **Rationale**: Modern REST API, better OAuth support, future-proof
- **Trade-offs**: Different data model than Gmail
- **Alternatives considered**: EWS (legacy, SOAP-based)

### Decision: Separate token storage (vs Better Auth accounts)
- **Rationale**: Email tokens have different lifecycle, need provider-specific fields
- **Trade-offs**: Additional table to manage
- **Alternatives considered**: Extend Better Auth account table (too coupled)

### Decision: AES-256-GCM encryption
- **Rationale**: Industry standard, authenticated encryption, performant
- **Trade-offs**: Key management complexity
- **Alternatives considered**: RSA (slower), no encryption (insecure)

## Multi-Tenancy Model

### Organization-Scoped Email Accounts
All email accounts belong to **organizations**, not individual users. This enables:
- Team collaboration on shared email intelligence
- Centralized account management by org admins
- Multi-account per organization (personal + work accounts)
- Clear data isolation between organizations

### Key Multi-Tenancy Rules
1. **Account Creation**: `emailAccount.organizationId` is required, set during OAuth callback
2. **Account Listing**: Filtered by `session.activeOrganizationId`
3. **Account Modification**: Requires org admin role verification via `verifyOrgAdmin()`
4. **Account Viewing**: Requires org membership via `verifyOrgMembership()`
5. **OAuth State**: Encodes `organizationId` alongside `userId` for callback routing
6. **Data Isolation**: All queries include `WHERE organization_id = ?`

### Database Constraints
- `emailAccount` has unique constraint on `(organization_id, email)` - same email can exist in different orgs
- `addedByUserId` tracks who connected the account for audit purposes
- Foreign key to `organization.id` ensures referential integrity

</architecture>

---

<risks>

## Technical Risks

### Risk: OAuth app review delays
- **Impact**: High - cannot launch without approval
- **Likelihood**: Medium - Google has strict review
- **Mitigation**: Start review process early, maintain compliance
- **Fallback**: Limited user testing with unverified app warning

### Risk: Provider API changes
- **Impact**: Medium - sync breaks
- **Likelihood**: Low - APIs are stable
- **Mitigation**: Version API calls, monitor changelogs
- **Fallback**: Rapid client updates, feature flags

### Risk: Token encryption key exposure
- **Impact**: Critical - all tokens compromised
- **Likelihood**: Low - with proper secret management
- **Mitigation**: Use secret manager, rotate keys regularly
- **Fallback**: Mass token revocation, force reconnection

## Dependency Risks

### Risk: Better Auth compatibility
- **Impact**: Medium - auth integration breaks
- **Likelihood**: Low - stable library
- **Mitigation**: Pin version, test upgrades
- **Fallback**: Custom OAuth implementation

## Scope Risks

### Risk: Supporting additional providers
- **Impact**: Medium - increased maintenance
- **Likelihood**: High - users will request Yahoo, iCloud
- **Mitigation**: Design abstraction layer from start
- **Fallback**: Defer additional providers post-MVP

### Risk: Enterprise Google Workspace restrictions
- **Impact**: Medium - some orgs can't connect
- **Likelihood**: Medium - common in enterprises
- **Mitigation**: Document admin requirements, provide guidance
- **Fallback**: Org-level app approval flow

</risks>

---

<appendix>

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Reference](https://developers.google.com/gmail/api/reference/rest)
- [Microsoft Identity Platform](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/api/overview)
- [Better Auth Documentation](https://www.better-auth.com/)

## Glossary

| Term | Definition |
|------|------------|
| **OAuth 2.0** | Authorization framework for secure API access |
| **Access Token** | Short-lived token for API calls |
| **Refresh Token** | Long-lived token to obtain new access tokens |
| **Scope** | Permission granted during OAuth |
| **Google Workspace** | Google's enterprise email/productivity suite |
| **Microsoft 365** | Microsoft's enterprise email/productivity suite |
| **Microsoft Graph** | Microsoft's unified API for M365 services |

## Open Questions

1. ~~**Sending email**: Should we request send scopes for drafting agent?~~ **RESOLVED**: Yes, full send scopes included for drafting agent (PRD-08)
2. **Real-time sync**: Use webhooks/push notifications or polling?
3. **Archive accounts**: Allow soft-delete while preserving historical data?
4. **Service accounts**: Support Google Workspace service accounts for orgs?
5. ~~**Multi-tenancy model**: User-scoped or org-scoped accounts?~~ **RESOLVED**: Organization-scoped with team collaboration

</appendix>

---

<task-master-integration>

## Task Extraction Summary

### Phase 1.0 Tasks
1. `oauth-gmail-config` - Create Gmail OAuth configuration
2. `oauth-outlook-config` - Create Outlook OAuth configuration
3. `oauth-env-setup` - Set up environment variables for OAuth

### Phase 1.1 Tasks
4. `api-accounts-list` - Implement list accounts procedure
5. `api-accounts-connect` - Implement connect account procedure
6. `api-accounts-disconnect` - Implement disconnect procedure
7. `api-accounts-settings` - Implement update settings procedure
8. `api-accounts-primary` - Implement set primary procedure

### Phase 1.2 Tasks
9. `client-interface` - Define EmailClient interface
10. `client-gmail` - Implement Gmail client
11. `client-outlook` - Implement Outlook client
12. `client-factory` - Implement client factory
13. `client-errors` - Implement error normalization

### Phase 1.3 Tasks
14. `ui-accounts-page` - Create email accounts page layout
15. `ui-account-card` - Implement account card component
16. `ui-connect-flow` - Implement connect account flow
17. `ui-disconnect-confirm` - Implement disconnect confirmation
18. `ui-settings-panel` - Implement settings panel

### Phase 1.4 Tasks
19. `callback-gmail` - Create Gmail callback route
20. `callback-outlook` - Create Outlook callback route
21. `token-encryption` - Implement token encryption
22. `token-refresh-job` - Implement automatic token refresh

### Dependencies
```
PRD-00 (emailAccount table)
  → oauth-gmail-config, oauth-outlook-config
    → oauth-env-setup
      → api-accounts-list
        → api-accounts-connect, api-accounts-disconnect
        → api-accounts-settings, api-accounts-primary
          → client-interface
            → client-gmail, client-outlook
              → client-factory → client-errors
                → ui-accounts-page
                  → ui-account-card
                    → ui-connect-flow, ui-disconnect-confirm, ui-settings-panel
                      → callback-gmail, callback-outlook
                        → token-encryption → token-refresh-job
```

</task-master-integration>
