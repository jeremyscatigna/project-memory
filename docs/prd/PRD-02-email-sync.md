# PRD-02: Email Sync Engine

> Incremental Email Synchronization via Trigger.dev

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-02 |
| **Title** | Email Sync Engine |
| **Phase** | 1 - Ingestion Layer |
| **Dependencies** | PRD-00 (Data Model), PRD-01 (Email Providers) |
| **Dependent PRDs** | PRD-03 (Thread Understanding) |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Once email accounts are connected (PRD-01), we must continuously synchronize email data into our Evidence Store. This involves:

1. **Historical backfill** - Import years of email history without blocking the user
2. **Incremental sync** - Capture new emails within minutes of arrival
3. **Update handling** - Track when emails are read, labeled, deleted
4. **Scale management** - Handle accounts with millions of emails
5. **Reliability** - Recover from failures without data loss or duplication

The sync engine is the pipeline that feeds all downstream intelligence extraction.

## Target Users

### Primary: System (Background Process)
- Runs automatically after account connection
- Operates continuously without user intervention
- Self-heals from transient failures

### Secondary: Users (Visibility)
- See sync progress for initial backfill
- Understand when new emails will appear
- Debug sync issues if they occur

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| New email latency | < 5 minutes | Time from email arrival to Evidence Store |
| Backfill throughput | > 10K emails/hour | Emails processed per hour per account |
| Sync success rate | > 99.9% | Successful syncs / Total sync attempts |
| Deduplication accuracy | 100% | No duplicate emails in Evidence Store |
| Resource efficiency | < 100ms CPU per email | Processing overhead |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Historical Backfill
Import existing email history for new accounts.

#### Feature: Backfill Job Initiation
- **Description**: Start backfill after account connection
- **Inputs**: Account ID, date range (optional)
- **Outputs**: Backfill job record
- **Behavior**: Create job, estimate scope, begin processing

#### Feature: Paginated Email Retrieval
- **Description**: Fetch emails in batches from provider
- **Inputs**: Account, page token, batch size
- **Outputs**: Email batch, next page token
- **Behavior**: Call provider API, handle pagination, respect rate limits

#### Feature: Priority Processing
- **Description**: Process recent emails before older ones
- **Inputs**: Email batch
- **Outputs**: Prioritized processing order
- **Behavior**: Sort by date descending, process VIP senders first

#### Feature: Progress Tracking
- **Description**: Track and report backfill progress
- **Inputs**: Job ID
- **Outputs**: Progress percentage, estimated completion
- **Behavior**: Update job record, emit progress events

#### Feature: Backfill Resume
- **Description**: Continue backfill after interruption
- **Inputs**: Job ID
- **Outputs**: Resumed job
- **Behavior**: Find last processed cursor, continue from there

---

### Capability: Incremental Sync
Keep Evidence Store current with provider.

#### Feature: Change Detection
- **Description**: Identify new/modified/deleted emails
- **Inputs**: Account, last sync cursor
- **Outputs**: Change set (new, modified, deleted IDs)
- **Behavior**: Use provider history/delta API, compare with local state

#### Feature: Scheduled Sync
- **Description**: Periodic sync on configurable interval
- **Inputs**: Sync interval configuration
- **Outputs**: Triggered sync jobs
- **Behavior**: Cron-scheduled, per-account intervals

#### Feature: On-Demand Sync
- **Description**: User-triggered immediate sync
- **Inputs**: Account ID
- **Outputs**: Sync job
- **Behavior**: Queue priority sync, return job ID for tracking

#### Feature: Real-Time Webhooks (Future)
- **Description**: Process provider push notifications
- **Inputs**: Webhook payload
- **Outputs**: Triggered sync for affected account
- **Behavior**: Validate webhook, identify account, queue sync

---

### Capability: Email Processing Pipeline
Transform provider data into Evidence Store format.

#### Feature: Thread Reconstruction
- **Description**: Build thread structure from messages
- **Inputs**: Raw messages
- **Outputs**: Thread record with message list
- **Behavior**: Group by thread ID, order messages, compute metadata

#### Feature: Message Normalization
- **Description**: Parse and normalize message content
- **Inputs**: Raw message from provider
- **Outputs**: Normalized message record
- **Behavior**: Parse headers, extract body, handle encoding

#### Feature: Participant Extraction
- **Description**: Extract and resolve participants
- **Inputs**: Message headers (from, to, cc, bcc)
- **Outputs**: Participant records
- **Behavior**: Parse addresses, resolve to contacts, handle aliases

#### Feature: Attachment Processing
- **Description**: Extract attachment metadata
- **Inputs**: Message parts
- **Outputs**: Attachment records
- **Behavior**: Identify attachments, extract metadata, store references

#### Feature: Deduplication
- **Description**: Prevent duplicate emails in Evidence Store
- **Inputs**: Message with provider ID
- **Outputs**: Insert or skip decision
- **Behavior**: Check existence by provider message ID, handle race conditions

---

### Capability: Sync Orchestration
Coordinate sync operations across accounts.

#### Feature: Job Queuing
- **Description**: Manage sync job queue
- **Inputs**: Sync request
- **Outputs**: Queued job
- **Behavior**: Add to Trigger.dev queue, set priority, handle concurrency

#### Feature: Concurrency Control
- **Description**: Limit concurrent syncs per account
- **Inputs**: Account ID, job type
- **Outputs**: Execution or queue decision
- **Behavior**: One active sync per account, queue additional requests

#### Feature: Rate Limit Coordination
- **Description**: Respect provider rate limits across jobs
- **Inputs**: Provider, API operation
- **Outputs**: Proceed or wait decision
- **Behavior**: Track quota usage, implement backoff, share limits across jobs

#### Feature: Error Recovery
- **Description**: Handle and recover from sync failures
- **Inputs**: Failed job, error type
- **Outputs**: Retry or escalate decision
- **Behavior**: Classify error, retry transient failures, alert on persistent issues

---

### Capability: Downstream Triggers
Initiate intelligence extraction after sync.

#### Feature: Processing Queue
- **Description**: Queue threads for AI processing
- **Inputs**: Newly synced threads
- **Outputs**: Processing jobs triggered
- **Behavior**: Emit events for new/updated threads, trigger extraction pipeline

#### Feature: Embedding Generation Trigger
- **Description**: Queue messages for embedding
- **Inputs**: Newly synced messages
- **Outputs**: Embedding jobs triggered
- **Behavior**: Queue messages without embeddings for PRD-06 processing

#### Feature: Notification Events
- **Description**: Emit events for user notifications
- **Inputs**: Sync completion, new email counts
- **Outputs**: Notification events
- **Behavior**: Summarize sync results, trigger UI updates

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
apps/server/
├── src/
│   ├── trigger/
│   │   ├── email-sync.ts           # Incremental sync task
│   │   ├── email-backfill.ts       # Historical backfill task
│   │   ├── email-process.ts        # Message processing task
│   │   └── index.ts                # Task exports
│   ├── lib/
│   │   └── sync/
│   │       ├── index.ts            # Sync orchestration
│   │       ├── gmail-sync.ts       # Gmail-specific sync logic
│   │       ├── outlook-sync.ts     # Outlook-specific sync logic
│   │       ├── processor.ts        # Email processing pipeline
│   │       └── deduplication.ts    # Deduplication logic
│   └── routes/
│       └── webhooks/
│           └── email-push.ts       # Provider webhook handlers
packages/api/
└── src/
    └── routers/
        └── email-sync.ts           # Sync status/control tRPC router
```

## Module Definitions

### Module: apps/server/src/trigger/email-sync.ts
- **Maps to capability**: Incremental Sync
- **Responsibility**: Trigger.dev task for incremental synchronization
- **Exports**:
  - `syncEmailsTask` - Scheduled sync task
  - `syncEmailsOnDemandTask` - User-triggered sync task

### Module: apps/server/src/trigger/email-backfill.ts
- **Maps to capability**: Historical Backfill
- **Responsibility**: Trigger.dev task for historical import
- **Exports**:
  - `backfillEmailsTask` - Full backfill task
  - `backfillEmailsBatchTask` - Single batch processing

### Module: apps/server/src/trigger/email-process.ts
- **Maps to capability**: Email Processing Pipeline
- **Responsibility**: Process raw emails into Evidence Store
- **Exports**:
  - `processEmailBatchTask` - Batch email processing

### Module: apps/server/src/lib/sync/processor.ts
- **Maps to capability**: Email Processing Pipeline
- **Responsibility**: Core processing logic
- **Exports**:
  - `processThread(rawThread)` - Thread processing
  - `processMessage(rawMessage)` - Message processing
  - `extractParticipants(message)` - Participant extraction

### Module: packages/api/src/routers/email-sync.ts
- **Maps to capability**: Sync Orchestration (API)
- **Responsibility**: tRPC procedures for sync control
- **Exports**:
  - `emailSyncRouter` - Sync control procedures

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### Foundation (from PRD-00, PRD-01)
- `emailAccount` table - Account credentials
- `emailThread`, `emailMessage` tables - Storage targets
- `EmailClient` interface - Provider access

### Sync Infrastructure (Phase 2.0)
- **email-sync.ts**: Depends on [EmailClient, emailAccount]
- **email-backfill.ts**: Depends on [EmailClient, emailAccount]

### Processing Pipeline (Phase 2.1)
- **processor.ts**: Depends on [emailThread, emailMessage tables]
- **email-process.ts**: Depends on [processor.ts]
- **deduplication.ts**: Depends on [emailMessage table]

### Orchestration (Phase 2.2)
- **sync/index.ts**: Depends on [email-sync.ts, email-backfill.ts]
- **email-sync router**: Depends on [sync/index.ts]

### Provider-Specific (Phase 2.3)
- **gmail-sync.ts**: Depends on [Gmail EmailClient]
- **outlook-sync.ts**: Depends on [Outlook EmailClient]

### Downstream Triggers (Phase 2.4)
- Emit events for PRD-03 (Thread Understanding)
- Emit events for PRD-06 (Embedding Generation)

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 2.0: Sync Task Infrastructure
**Goal**: Create Trigger.dev tasks for sync operations

**Entry Criteria**: PRD-01 complete (EmailClient working)

**Tasks**:
- [ ] Create `syncEmailsTask` skeleton (depends on: Trigger.dev config)
  - Acceptance: Task runs on schedule, logs execution
  - Test: Manual trigger, schedule verification
- [ ] Create `backfillEmailsTask` skeleton (depends on: Trigger.dev config)
  - Acceptance: Task accepts account ID, runs to completion
  - Test: Start backfill, verify task lifecycle
- [ ] Implement sync cursor management (depends on: emailAccount table)
  - Acceptance: Cursor persisted, used for incremental fetch
  - Test: Cursor update, resume from cursor
- [ ] Implement job status tracking (depends on: processingJob table)
  - Acceptance: Job progress visible in database
  - Test: Status transitions, completion tracking

**Exit Criteria**: Tasks run and track progress

**Delivers**: Sync job infrastructure

---

### Phase 2.1: Email Processing Pipeline
**Goal**: Transform provider data into Evidence Store format

**Entry Criteria**: Phase 2.0 complete

**Tasks**:
- [ ] Implement thread reconstruction (depends on: emailThread table)
  - Acceptance: Threads grouped correctly, metadata computed
  - Test: Single message thread, multi-message thread, reply chains
- [ ] Implement message normalization (depends on: emailMessage table)
  - Acceptance: Headers parsed, body extracted, encoding handled
  - Test: Plain text, HTML, multipart, attachments
- [ ] Implement participant extraction (depends on: emailParticipant table)
  - Acceptance: All participants extracted with roles
  - Test: From, To, CC, BCC, display names, unicode
- [ ] Implement attachment processing (depends on: emailAttachment table)
  - Acceptance: Metadata stored, references valid
  - Test: Multiple attachments, inline images, large files
- [ ] Implement deduplication (depends on: emailMessage table)
  - Acceptance: No duplicates on re-sync, idempotent inserts
  - Test: Same message twice, concurrent inserts

**Exit Criteria**: Full processing pipeline working

**Delivers**: Raw emails become Evidence Store records

---

### Phase 2.2: Provider-Specific Sync
**Goal**: Implement Gmail and Outlook sync logic

**Entry Criteria**: Phase 2.1 complete

**Tasks**:
- [ ] Implement Gmail incremental sync (depends on: Gmail EmailClient)
  - Acceptance: Uses history API, fetches changes since cursor
  - Test: New emails, label changes, deletions
- [ ] Implement Gmail backfill (depends on: Gmail EmailClient)
  - Acceptance: Paginates through all threads, handles large accounts
  - Test: 100 threads, 10K threads, date range filter
- [ ] Implement Outlook incremental sync (depends on: Outlook EmailClient)
  - Acceptance: Uses delta API, fetches changes since cursor
  - Test: New messages, folder changes, deletions
- [ ] Implement Outlook backfill (depends on: Outlook EmailClient)
  - Acceptance: Paginates through all conversations
  - Test: 100 messages, 10K messages
- [ ] Implement rate limit coordination (depends on: both providers)
  - Acceptance: Respects limits, backs off appropriately
  - Test: Rate limit simulation, recovery

**Exit Criteria**: Both providers sync correctly

**Delivers**: Gmail and Outlook data in Evidence Store

---

### Phase 2.3: Sync Orchestration
**Goal**: Coordinate sync operations reliably

**Entry Criteria**: Phase 2.2 complete

**Tasks**:
- [ ] Implement scheduled sync (depends on: syncEmailsTask)
  - Acceptance: Syncs run on configured interval per account
  - Test: Multiple accounts, different intervals
- [ ] Implement concurrency control (depends on: job queuing)
  - Acceptance: Max one active sync per account
  - Test: Concurrent requests queued, not duplicated
- [ ] Implement error recovery (depends on: job status tracking)
  - Acceptance: Transient errors retried, persistent errors alerted
  - Test: Network failure, auth failure, rate limit
- [ ] Implement sync status API (depends on: email-sync router)
  - Acceptance: Users can see sync status, trigger manual sync
  - Test: Status query, on-demand trigger

**Exit Criteria**: Reliable, observable sync operations

**Delivers**: Production-ready sync system

---

### Phase 2.4: Downstream Triggers
**Goal**: Connect sync to intelligence pipeline

**Entry Criteria**: Phase 2.3 complete

**Tasks**:
- [ ] Emit thread processing events (depends on: PRD-03 interface)
  - Acceptance: New/updated threads trigger extraction
  - Test: New thread event, updated thread event
- [ ] Emit embedding generation events (depends on: PRD-06 interface)
  - Acceptance: New messages trigger embedding
  - Test: Batch embedding triggers
- [ ] Implement sync completion notifications (depends on: notification system)
  - Acceptance: Users notified of sync results
  - Test: Success notification, error notification

**Exit Criteria**: Sync feeds downstream processing

**Delivers**: Connected intelligence pipeline

</implementation-roadmap>

---

<test-strategy>

## Test Pyramid

```
        /\
       /E2E\       ← 10% (Full sync flows with mock providers)
      /------\
     /Integration\ ← 40% (Database operations, job lifecycle)
    /------------\
   /  Unit Tests  \ ← 50% (Processing logic, parsing, deduplication)
  /----------------\
```

## Coverage Requirements
- Line coverage: 85% minimum
- Branch coverage: 80% minimum
- Function coverage: 90% minimum

## Critical Test Scenarios

### Backfill (email-backfill.ts)
**Happy path**:
- Start backfill → Process all pages → Complete
- Expected: All emails in Evidence Store, job marked complete

**Edge cases**:
- Account with 0 emails
- Account with 1M+ emails (pagination)
- Backfill interrupted mid-page
- Expected: Handle gracefully, resume correctly

**Error cases**:
- Token expires during backfill
- Rate limit exceeded
- Network failure mid-batch
- Expected: Retry, refresh token, continue

### Incremental Sync (email-sync.ts)
**Happy path**:
- Sync runs → Fetches changes → Updates Evidence Store
- Expected: New emails appear, updates applied

**Edge cases**:
- No changes since last sync
- 1000+ changes in one sync
- Thread deleted at provider
- Expected: Efficient no-op, batch processing, soft delete

**Error cases**:
- Invalid sync cursor (history expired)
- Account disconnected during sync
- Expected: Reset cursor, stop sync gracefully

### Processing Pipeline (processor.ts)
**Happy path**:
- Raw message → Normalized record
- Expected: All fields populated correctly

**Edge cases**:
- Message with no body
- Message with 10MB body
- Message with 50 attachments
- Unicode in all fields
- Expected: Handle all edge cases

**Performance**:
- Process 1000 messages < 10 seconds
- Memory usage < 500MB during batch
- Expected: Performance targets met

## Test Generation Guidelines
- Mock provider APIs with realistic payloads
- Test with real email exports (anonymized)
- Include concurrency tests for deduplication
- Test job resume after crash

</test-strategy>

---

<architecture>

## System Components

### Trigger.dev Tasks
- Long-running background jobs
- Automatic retries with exponential backoff
- Job status tracking and logging
- Scheduled execution support

### Processing Pipeline
- Streaming processing for memory efficiency
- Transaction batching for database performance
- Idempotent operations for retry safety

### Event System
- Emit events on sync completion
- Downstream services subscribe to events
- Decoupled architecture for scalability

## Data Flow

```
Provider API
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    SYNC TASK (Trigger.dev)                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │   Fetch     │───▶│   Process   │───▶│  Store          │ │
│  │   Emails    │    │   Pipeline  │    │  (Transaction)  │ │
│  └─────────────┘    └─────────────┘    └─────────────────┘ │
│         │                                      │            │
│         ▼                                      ▼            │
│  ┌─────────────┐                      ┌─────────────────┐  │
│  │ Update      │                      │ Emit Events     │  │
│  │ Cursor      │                      │ (New Threads)   │  │
│  └─────────────┘                      └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
    │                                            │
    ▼                                            ▼
Evidence Store                          Thread Understanding
(PRD-00)                               (PRD-03)
```

## Sync Strategies

### Gmail Sync Strategy
```typescript
// Initial backfill
1. List all thread IDs (paginated)
2. Batch fetch thread details (100 at a time)
3. Process and store each thread
4. Record final historyId as cursor

// Incremental sync
1. Call history.list with startHistoryId
2. Collect all messageId changes
3. Batch fetch changed messages
4. Update/insert as needed
5. Update cursor to latest historyId
```

### Outlook Sync Strategy
```typescript
// Initial backfill
1. List all messages (paginated, sorted by date)
2. Group messages by conversationId
3. Process and store conversations
4. Record deltaLink as cursor

// Incremental sync
1. Call delta endpoint with deltaLink
2. Process all changed messages
3. Update/insert as needed
4. Store new deltaLink as cursor
```

## Technology Decisions

### Decision: Trigger.dev (vs custom job queue)
- **Rationale**: Built-in retries, scheduling, monitoring; existing in codebase
- **Trade-offs**: External dependency, cost at scale
- **Alternatives considered**: BullMQ (more setup), custom (maintenance burden)

### Decision: Batch processing (vs streaming)
- **Rationale**: Efficient database transactions, manageable memory
- **Trade-offs**: Latency for individual emails
- **Alternatives considered**: Streaming (complex error handling)

### Decision: Cursor-based sync (vs timestamp-based)
- **Rationale**: Provider-native, handles all change types
- **Trade-offs**: Provider-specific implementation
- **Alternatives considered**: Timestamp polling (misses changes)

</architecture>

---

<risks>

## Technical Risks

### Risk: Large account backfill timeout
- **Impact**: High - users can't onboard
- **Likelihood**: Medium - common for long-time users
- **Mitigation**: Chunked backfill, progress persistence, background processing
- **Fallback**: Limit initial backfill, lazy-load older emails

### Risk: Provider API changes break sync
- **Impact**: High - sync stops working
- **Likelihood**: Low - APIs are stable
- **Mitigation**: Version API calls, monitor for deprecations
- **Fallback**: Rapid updates, feature flags

### Risk: Deduplication race conditions
- **Impact**: Medium - duplicate data
- **Likelihood**: Medium - concurrent syncs possible
- **Mitigation**: Database constraints, upsert patterns
- **Fallback**: Deduplication cleanup job

## Dependency Risks

### Risk: Trigger.dev availability
- **Impact**: High - no background processing
- **Likelihood**: Low - reliable service
- **Mitigation**: Monitor health, have manual fallback
- **Fallback**: Direct API processing (degraded)

## Scope Risks

### Risk: Real-time sync requirement creep
- **Impact**: Medium - significant complexity
- **Likelihood**: High - users expect instant
- **Mitigation**: Set expectations (< 5 min), defer webhooks
- **Fallback**: Polling-only for MVP

</risks>

---

<appendix>

## References

- [Gmail API History](https://developers.google.com/gmail/api/guides/sync)
- [Microsoft Graph Delta Queries](https://docs.microsoft.com/en-us/graph/delta-query-overview)
- [Trigger.dev Documentation](https://trigger.dev/docs)

## Glossary

| Term | Definition |
|------|------------|
| **Backfill** | Historical import of existing emails |
| **Incremental Sync** | Fetching only changes since last sync |
| **Cursor** | Marker for sync position (historyId, deltaLink) |
| **History API** | Gmail's change tracking API |
| **Delta Query** | Microsoft Graph's change tracking API |

## Open Questions

1. **Sync frequency**: Default 5 min or configurable per account?
2. **Backfill depth**: Sync all history or limit to N years?
3. **Webhook priority**: Implement provider push before MVP?
4. **Deleted emails**: Soft delete or remove from Evidence Store?

</appendix>

---

<task-master-integration>

## Task Extraction Summary

### Phase 2.0 Tasks
1. `sync-task-skeleton` - Create syncEmailsTask skeleton
2. `backfill-task-skeleton` - Create backfillEmailsTask skeleton
3. `sync-cursor-management` - Implement sync cursor management
4. `sync-job-status` - Implement job status tracking

### Phase 2.1 Tasks
5. `process-thread-reconstruction` - Implement thread reconstruction
6. `process-message-normalization` - Implement message normalization
7. `process-participant-extraction` - Implement participant extraction
8. `process-attachment-handling` - Implement attachment processing
9. `process-deduplication` - Implement deduplication

### Phase 2.2 Tasks
10. `sync-gmail-incremental` - Implement Gmail incremental sync
11. `sync-gmail-backfill` - Implement Gmail backfill
12. `sync-outlook-incremental` - Implement Outlook incremental sync
13. `sync-outlook-backfill` - Implement Outlook backfill
14. `sync-rate-limit-coordination` - Implement rate limit coordination

### Phase 2.3 Tasks
15. `sync-scheduled` - Implement scheduled sync
16. `sync-concurrency-control` - Implement concurrency control
17. `sync-error-recovery` - Implement error recovery
18. `sync-status-api` - Implement sync status API

### Phase 2.4 Tasks
19. `sync-event-thread-processing` - Emit thread processing events
20. `sync-event-embedding` - Emit embedding generation events
21. `sync-event-notifications` - Implement sync completion notifications

### Dependencies
```
PRD-01 (EmailClient)
  → sync-task-skeleton, backfill-task-skeleton
    → sync-cursor-management → sync-job-status
      → process-thread-reconstruction
        → process-message-normalization
          → process-participant-extraction, process-attachment-handling
            → process-deduplication
              → sync-gmail-incremental, sync-gmail-backfill
              → sync-outlook-incremental, sync-outlook-backfill
                → sync-rate-limit-coordination
                  → sync-scheduled → sync-concurrency-control
                    → sync-error-recovery → sync-status-api
                      → sync-event-thread-processing
                        → sync-event-embedding, sync-event-notifications
```

</task-master-integration>
