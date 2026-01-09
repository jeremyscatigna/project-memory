# PRD-00: Data Model Foundation

> Evidence Store + Intelligence Graph + pgvector Schemas

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-00 |
| **Title** | Data Model Foundation |
| **Phase** | 0 - Foundation |
| **Dependencies** | None (foundational) |
| **Dependent PRDs** | All other PRDs |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Email systems store messages as unstructured text in chronological order. This architecture fails knowledge workers who need to:

1. **Retrieve meaning, not messages** - Find decisions, rationales, and commitments rather than keyword matches
2. **Track commitments** - Know who owes what, when, without manual task management
3. **Access relationship context** - Understand communication history and patterns instantly
4. **Query institutional memory** - Answer "why did we decide X?" with evidence

Current email clients treat messages as a queue, not a knowledge base. The data model must transform email from a message log into a queryable intelligence system.

## Target Users

### Primary: Power Operators
- CEOs, founders, investors with 10-20+ years of email history
- 100-500+ emails/day
- High cost of forgotten commitments or contradictions
- Need truth and recall over inbox zero aesthetics

### Secondary: Leadership Teams
- Chiefs of staff, strategy/ops leads
- Need decision traceability and accountability clarity

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Evidence Store query latency | < 100ms (p95) | PostgreSQL query timing |
| Intelligence Graph freshness | < 5 min from email arrival | Processing pipeline latency |
| Provenance chain completeness | 100% of intelligence links to evidence | Schema foreign key integrity |
| Vector search recall | > 90% for semantic queries | Benchmark evaluation set |
| Schema migration success | Zero data loss | Migration test suite |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Evidence Store
The immutable, append-only storage of raw email data with full audit trail.

#### Feature: Email Account Management
- **Description**: Store OAuth connections for Gmail and Outlook accounts
- **Inputs**: OAuth tokens, provider type, user reference
- **Outputs**: Account record with sync state
- **Behavior**: Create account on OAuth success, track token refresh, store sync cursors

#### Feature: Thread Storage
- **Description**: Store email threads with participant resolution
- **Inputs**: Raw thread data from provider, message list
- **Outputs**: Normalized thread record with metadata
- **Behavior**: Deduplicate threads, resolve participant identities, maintain message ordering

#### Feature: Message Storage
- **Description**: Store individual email messages with headers and body
- **Inputs**: Raw message from provider API
- **Outputs**: Normalized message record with parsed content
- **Behavior**: Parse headers, extract body (HTML/text), store original for replay

#### Feature: Attachment Metadata
- **Description**: Store attachment metadata without binary content
- **Inputs**: Attachment info from message
- **Outputs**: Attachment record with download reference
- **Behavior**: Extract filename, size, MIME type; store provider reference for on-demand download

#### Feature: Participant Identity Resolution
- **Description**: Resolve email addresses to unified contact identities
- **Inputs**: Email address, display name from message
- **Outputs**: Resolved participant linked to contact
- **Behavior**: Match by email, merge display names, handle aliases

---

### Capability: Intelligence Graph
Derived, queryable intelligence extracted from evidence.

#### Feature: Claim Extraction Storage
- **Description**: Store atomic facts extracted from messages
- **Inputs**: AI-extracted claim, source message reference
- **Outputs**: Claim record with evidence chain
- **Behavior**: Store claim text, type, confidence; link to source messages

#### Feature: Commitment Tracking
- **Description**: Store commitments (promises, tasks) with status
- **Inputs**: Extracted commitment, parties, dates
- **Outputs**: Commitment record with lifecycle state
- **Behavior**: Track debtor/creditor, due dates, status transitions, evidence links

#### Feature: Decision Storage
- **Description**: Store decisions with rationale and alternatives
- **Inputs**: Extracted decision, context, participants
- **Outputs**: Decision record with full context
- **Behavior**: Store decision statement, rationale, alternatives considered, supersession chain

#### Feature: Contact Profiles
- **Description**: Store enriched contact information and relationship metrics
- **Inputs**: Aggregated communication data, AI analysis
- **Outputs**: Contact profile with relationship scores
- **Behavior**: Calculate responsiveness, communication frequency, topic associations

#### Feature: Topic Taxonomy
- **Description**: Store dynamic topic categorization
- **Inputs**: AI-classified topics from threads
- **Outputs**: Topic hierarchy with thread associations
- **Behavior**: Auto-generate topics, maintain hierarchy, track confidence

---

### Capability: Vector Search Infrastructure
pgvector-powered semantic search across all data.

#### Feature: Embedding Storage
- **Description**: Store vector embeddings for semantic search
- **Inputs**: Text content, embedding model output
- **Outputs**: Embedding record linked to source
- **Behavior**: Store 1536-dim vectors (OpenAI) or 384-dim (open source), index for similarity search

#### Feature: Similarity Search
- **Description**: Query embeddings by vector similarity
- **Inputs**: Query embedding, filters, limit
- **Outputs**: Ranked results with similarity scores
- **Behavior**: Use pgvector cosine similarity, apply metadata filters, return with provenance

#### Feature: Hybrid Search
- **Description**: Combine vector and keyword search
- **Inputs**: Query text, semantic weight, filters
- **Outputs**: Fused result set
- **Behavior**: Run parallel queries, normalize scores, merge results

---

### Capability: Audit & Provenance
Full traceability of all data transformations.

#### Feature: Processing Audit Log
- **Description**: Track all AI processing operations
- **Inputs**: Processing event, input/output references
- **Outputs**: Audit record with full context
- **Behavior**: Log model used, tokens consumed, confidence scores, timing

#### Feature: Evidence Chain
- **Description**: Maintain provenance links between intelligence and evidence
- **Inputs**: Intelligence record, source evidence references
- **Outputs**: Chain of citations
- **Behavior**: Store message IDs, quoted text snippets, confidence per link

#### Feature: Data Retention
- **Description**: Manage data lifecycle per user preferences
- **Inputs**: Retention policy, user settings
- **Outputs**: Archived or deleted records
- **Behavior**: Soft delete with recovery window, hard delete on expiration

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/db/
├── src/
│   ├── schema/
│   │   ├── index.ts              # Barrel export for all schemas
│   │   ├── email.ts              # Evidence Store tables
│   │   ├── intelligence.ts       # Intelligence Graph tables
│   │   ├── vectors.ts            # pgvector embedding tables
│   │   └── processing.ts         # Audit and processing tables
│   ├── migrations/               # Drizzle migrations
│   ├── seed/                     # Development seed data
│   └── index.ts                  # DB client export
├── drizzle.config.ts             # Drizzle Kit configuration
└── package.json
```

## Module Definitions

### Module: email.ts (Evidence Store)
- **Maps to capability**: Evidence Store
- **Responsibility**: Define immutable email data schemas
- **Exports**:
  - `emailAccount` - OAuth account connections
  - `emailThread` - Thread containers
  - `emailMessage` - Individual messages
  - `emailAttachment` - Attachment metadata
  - `emailParticipant` - Resolved participants
  - Relations and type exports

### Module: intelligence.ts (Intelligence Graph)
- **Maps to capability**: Intelligence Graph
- **Responsibility**: Define derived intelligence schemas
- **Exports**:
  - `claim` - Extracted facts
  - `commitment` - Tracked commitments
  - `decision` - Decision records
  - `contact` - Enriched contact profiles
  - `topic` - Topic taxonomy
  - Relations and type exports

### Module: vectors.ts (Vector Search)
- **Maps to capability**: Vector Search Infrastructure
- **Responsibility**: Define pgvector embedding schemas
- **Exports**:
  - `messageEmbedding` - Message-level embeddings
  - `threadEmbedding` - Thread-level embeddings
  - `claimEmbedding` - Claim embeddings
  - Vector index definitions

### Module: processing.ts (Audit)
- **Maps to capability**: Audit & Provenance
- **Responsibility**: Define processing audit schemas
- **Exports**:
  - `processingJob` - Job tracking
  - `processingAudit` - Detailed audit logs
  - `evidenceLink` - Provenance chains

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### Foundation Layer (Phase 0)
No external dependencies - these tables are foundational.

- **emailAccount**: No dependencies (root entity)
- **emailThread**: Depends on [emailAccount]
- **emailMessage**: Depends on [emailThread]
- **emailAttachment**: Depends on [emailMessage]
- **emailParticipant**: Depends on [emailMessage]

### Intelligence Layer (Phase 0.1)
Depends on Evidence Store being populated.

- **contact**: Depends on [emailParticipant] (for identity resolution)
- **topic**: No dependencies (can exist before threads)
- **claim**: Depends on [emailMessage] (evidence source)
- **commitment**: Depends on [claim, contact]
- **decision**: Depends on [claim, contact]

### Vector Layer (Phase 0.2)
Depends on content existing for embedding.

- **messageEmbedding**: Depends on [emailMessage]
- **threadEmbedding**: Depends on [emailThread]
- **claimEmbedding**: Depends on [claim]

### Audit Layer (Phase 0.3)
Can reference any table.

- **processingJob**: No dependencies
- **processingAudit**: Depends on [processingJob]
- **evidenceLink**: Depends on [claim, commitment, decision, emailMessage]

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 0.0: PostgreSQL + pgvector Setup
**Goal**: Establish database infrastructure with vector capabilities

**Entry Criteria**: Clean PostgreSQL 15+ instance

**Tasks**:
- [ ] Configure PostgreSQL with pgvector extension
  - Acceptance: `SELECT * FROM pg_extension WHERE extname = 'vector'` returns row
  - Test: Extension load test
- [ ] Create Drizzle configuration for pgvector types
  - Acceptance: Custom vector type compiles
  - Test: Type definition unit tests
- [ ] Set up migration infrastructure
  - Acceptance: `bun run db:generate` creates migration files
  - Test: Empty migration test

**Exit Criteria**: pgvector extension enabled, Drizzle configured

**Delivers**: Database ready for schema definition

---

### Phase 0.1: Evidence Store Schema
**Goal**: Define immutable email storage tables

**Entry Criteria**: Phase 0.0 complete

**Tasks**:
- [ ] Define `emailAccount` table (depends on: none)
  - Acceptance: OAuth token storage, provider enum, sync state
  - Test: CRUD operations, token refresh scenarios
- [ ] Define `emailThread` table (depends on: emailAccount)
  - Acceptance: Thread metadata, participant list, time range
  - Test: Thread creation, update scenarios
- [ ] Define `emailMessage` table (depends on: emailThread)
  - Acceptance: Headers, body storage, message ordering
  - Test: Message insertion, body parsing
- [ ] Define `emailAttachment` table (depends on: emailMessage)
  - Acceptance: Metadata storage, provider reference
  - Test: Attachment linking
- [ ] Define `emailParticipant` table (depends on: emailMessage)
  - Acceptance: Identity resolution, role tracking
  - Test: Participant extraction and linking
- [ ] Create relations and indexes
  - Acceptance: All foreign keys defined, query indexes created
  - Test: Relation query tests

**Exit Criteria**: Evidence Store schema migrated, relations working

**Delivers**: Email data can be stored and queried

---

### Phase 0.2: Intelligence Graph Schema
**Goal**: Define derived intelligence tables

**Entry Criteria**: Phase 0.1 complete

**Tasks**:
- [ ] Define `contact` table (depends on: emailParticipant)
  - Acceptance: Profile fields, relationship metrics
  - Test: Contact creation from participants
- [ ] Define `topic` table (depends on: none)
  - Acceptance: Hierarchical taxonomy, confidence scores
  - Test: Topic CRUD, hierarchy queries
- [ ] Define `claim` table (depends on: emailMessage)
  - Acceptance: Claim types, confidence, evidence links
  - Test: Claim creation with citations
- [ ] Define `commitment` table (depends on: claim, contact)
  - Acceptance: Lifecycle states, due dates, parties
  - Test: Commitment state transitions
- [ ] Define `decision` table (depends on: claim, contact)
  - Acceptance: Rationale storage, supersession chain
  - Test: Decision creation, supersession
- [ ] Create thread-topic and claim-topic junction tables
  - Acceptance: Many-to-many relationships
  - Test: Association queries

**Exit Criteria**: Intelligence Graph schema migrated

**Delivers**: Extracted intelligence can be stored

---

### Phase 0.3: Vector Schema
**Goal**: Define pgvector embedding tables

**Entry Criteria**: Phase 0.1, 0.2 complete

**Tasks**:
- [ ] Define `messageEmbedding` table (depends on: emailMessage)
  - Acceptance: Vector column, model tracking
  - Test: Embedding storage and retrieval
- [ ] Define `threadEmbedding` table (depends on: emailThread)
  - Acceptance: Aggregated thread vectors
  - Test: Thread-level search
- [ ] Define `claimEmbedding` table (depends on: claim)
  - Acceptance: Claim semantic search
  - Test: Claim similarity queries
- [ ] Create HNSW indexes for similarity search
  - Acceptance: Index creation with parameters
  - Test: Similarity search performance
- [ ] Implement hybrid search support
  - Acceptance: Full-text + vector combination
  - Test: Hybrid query accuracy

**Exit Criteria**: Vector search operational

**Delivers**: Semantic search across all content

---

### Phase 0.4: Audit Schema
**Goal**: Define processing audit and provenance tables

**Entry Criteria**: Phase 0.2 complete

**Tasks**:
- [ ] Define `processingJob` table
  - Acceptance: Job tracking, status, timing
  - Test: Job lifecycle tests
- [ ] Define `processingAudit` table
  - Acceptance: Detailed logging, model tracking
  - Test: Audit query tests
- [ ] Define `evidenceLink` table
  - Acceptance: Generic provenance chain
  - Test: Citation retrieval

**Exit Criteria**: Audit schema migrated

**Delivers**: Full traceability of AI operations

</implementation-roadmap>

---

<test-strategy>

## Test Pyramid

```
        /\
       /E2E\       ← 10% (Full data flow tests)
      /------\
     /Integration\ ← 30% (Cross-table queries, relations)
    /------------\
   /  Unit Tests  \ ← 60% (Schema definitions, type inference)
  /----------------\
```

## Coverage Requirements
- Line coverage: 90% minimum
- Branch coverage: 85% minimum
- Function coverage: 95% minimum

## Critical Test Scenarios

### Evidence Store (email.ts)
**Happy path**:
- Create email account with OAuth tokens
- Insert thread with multiple messages
- Expected: Data persisted, relations intact, types inferred

**Edge cases**:
- Thread with 1000+ messages (pagination test)
- Message with 10MB body (large content handling)
- Participant with unicode display name
- Expected: All edge cases handled without data loss

**Error cases**:
- Duplicate message insertion (provider message ID)
- Invalid OAuth token format
- Missing required fields
- Expected: Appropriate errors thrown, no partial writes

**Integration points**:
- Account → Thread → Message → Attachment chain
- Participant identity resolution across threads
- Expected: Full relation traversal works

### Intelligence Graph (intelligence.ts)
**Happy path**:
- Create claim with evidence links
- Create commitment with status transitions
- Create decision with supersession
- Expected: Full lifecycle management works

**Edge cases**:
- Claim with 100+ evidence links
- Commitment with null due date (inferred)
- Decision chain 10 levels deep
- Expected: All scenarios handled

**Error cases**:
- Commitment without debtor
- Decision without evidence
- Invalid status transition
- Expected: Constraint violations caught

### Vector Schema (vectors.ts)
**Happy path**:
- Store 1536-dim embedding
- Similarity search returns ranked results
- Expected: Correct ordering by similarity

**Edge cases**:
- Search with 0 results (no matches above threshold)
- Search with filters that exclude all results
- Embedding dimension mismatch
- Expected: Graceful handling

**Performance**:
- 1M embeddings similarity search < 100ms
- Batch insert 10K embeddings < 5s
- Expected: Performance targets met

## Test Generation Guidelines
- Use Drizzle's type inference for compile-time validation
- Test all relation directions (parent→child and child→parent)
- Include migration rollback tests
- Test concurrent write scenarios for sync operations

</test-strategy>

---

<architecture>

## System Components

### PostgreSQL 15+ with pgvector
- Primary data store for all MEMORYSTACK data
- pgvector extension for semantic search (HNSW indexes)
- Full-text search via tsvector for keyword queries

### Drizzle ORM
- Type-safe schema definitions
- Migration management
- Query builder with relation support

### Connection Pooling
- Use `pg` driver with connection pooling
- Pool size tuned for concurrent AI processing

## Data Models

### Evidence Store Schema

```typescript
// emailAccount
{
  id: text (PK, UUID),
  userId: text (FK → user.id),
  organizationId: text (FK → organization.id),
  provider: enum('gmail', 'outlook'),
  email: text (unique per user),
  accessToken: text (encrypted),
  refreshToken: text (encrypted),
  tokenExpiresAt: timestamp,
  syncCursor: text,
  lastSyncAt: timestamp,
  status: enum('active', 'expired', 'revoked'),
  createdAt: timestamp,
  updatedAt: timestamp
}

// emailThread
{
  id: text (PK, UUID),
  accountId: text (FK → emailAccount.id),
  providerThreadId: text (unique per account),
  subject: text,
  snippet: text,
  participantEmails: text[],
  messageCount: integer,
  hasAttachments: boolean,
  firstMessageAt: timestamp,
  lastMessageAt: timestamp,
  labels: text[],
  isRead: boolean,
  isStarred: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}

// emailMessage
{
  id: text (PK, UUID),
  threadId: text (FK → emailThread.id),
  providerMessageId: text (unique per thread),
  inReplyTo: text,
  references: text[],
  from: jsonb { email, name },
  to: jsonb[] { email, name },
  cc: jsonb[] { email, name },
  bcc: jsonb[] { email, name },
  subject: text,
  bodyText: text,
  bodyHtml: text,
  snippet: text,
  sentAt: timestamp,
  receivedAt: timestamp,
  headers: jsonb,
  labelIds: text[],
  createdAt: timestamp,
  updatedAt: timestamp
}

// emailAttachment
{
  id: text (PK, UUID),
  messageId: text (FK → emailMessage.id),
  providerAttachmentId: text,
  filename: text,
  mimeType: text,
  size: integer,
  contentId: text,
  isInline: boolean,
  createdAt: timestamp
}

// emailParticipant
{
  id: text (PK, UUID),
  messageId: text (FK → emailMessage.id),
  contactId: text (FK → contact.id, nullable),
  email: text,
  displayName: text,
  role: enum('from', 'to', 'cc', 'bcc'),
  createdAt: timestamp
}
```

### Intelligence Graph Schema

```typescript
// contact
{
  id: text (PK, UUID),
  organizationId: text (FK → organization.id),
  primaryEmail: text,
  emails: text[],
  displayName: text,
  company: text,
  title: text,
  avatarUrl: text,
  firstInteractionAt: timestamp,
  lastInteractionAt: timestamp,
  totalThreads: integer,
  totalMessages: integer,
  avgResponseTimeMinutes: integer,
  sentimentScore: real,
  importanceScore: real,
  tags: text[],
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}

// topic
{
  id: text (PK, UUID),
  organizationId: text (FK → organization.id),
  parentId: text (FK → topic.id, nullable),
  name: text,
  slug: text,
  description: text,
  confidence: real,
  threadCount: integer,
  createdAt: timestamp,
  updatedAt: timestamp
}

// claim
{
  id: text (PK, UUID),
  organizationId: text (FK → organization.id),
  type: enum('fact', 'promise', 'request', 'question', 'decision', 'opinion'),
  text: text,
  normalizedText: text,
  confidence: real,
  sourceMessageIds: text[],
  quotedText: text,
  extractedAt: timestamp,
  extractionModel: text,
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}

// commitment
{
  id: text (PK, UUID),
  organizationId: text (FK → organization.id),
  claimId: text (FK → claim.id),
  debtorContactId: text (FK → contact.id),
  creditorContactId: text (FK → contact.id),
  title: text,
  description: text,
  dueDate: timestamp,
  dueDateConfidence: real,
  status: enum('pending', 'in_progress', 'completed', 'cancelled', 'overdue'),
  priority: enum('low', 'medium', 'high', 'urgent'),
  completedAt: timestamp,
  lastReminderAt: timestamp,
  reminderCount: integer,
  sourceThreadId: text (FK → emailThread.id),
  sourceMessageId: text (FK → emailMessage.id),
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}

// decision
{
  id: text (PK, UUID),
  organizationId: text (FK → organization.id),
  claimId: text (FK → claim.id),
  title: text,
  statement: text,
  rationale: text,
  alternatives: jsonb[],
  ownerContactIds: text[],
  participantContactIds: text[],
  decidedAt: timestamp,
  confidence: real,
  supersededById: text (FK → decision.id, nullable),
  supersededAt: timestamp,
  sourceThreadId: text (FK → emailThread.id),
  sourceMessageIds: text[],
  topicIds: text[],
  metadata: jsonb,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Vector Schema

```typescript
// messageEmbedding
{
  id: text (PK, UUID),
  messageId: text (FK → emailMessage.id, unique),
  embedding: vector(1536),
  model: text,
  tokenCount: integer,
  createdAt: timestamp
}

// threadEmbedding
{
  id: text (PK, UUID),
  threadId: text (FK → emailThread.id, unique),
  embedding: vector(1536),
  aggregationMethod: enum('mean', 'first', 'weighted'),
  model: text,
  createdAt: timestamp
}

// claimEmbedding
{
  id: text (PK, UUID),
  claimId: text (FK → claim.id, unique),
  embedding: vector(1536),
  model: text,
  createdAt: timestamp
}

// HNSW Index Configuration
CREATE INDEX ON messageEmbedding
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Audit Schema

```typescript
// processingJob
{
  id: text (PK, UUID),
  type: enum('sync', 'extraction', 'embedding', 'analysis'),
  status: enum('pending', 'running', 'completed', 'failed'),
  accountId: text (FK → emailAccount.id, nullable),
  threadId: text (FK → emailThread.id, nullable),
  startedAt: timestamp,
  completedAt: timestamp,
  errorMessage: text,
  metadata: jsonb,
  createdAt: timestamp
}

// processingAudit
{
  id: text (PK, UUID),
  jobId: text (FK → processingJob.id),
  action: text,
  model: text,
  inputTokens: integer,
  outputTokens: integer,
  latencyMs: integer,
  inputPreview: text,
  outputPreview: text,
  confidence: real,
  createdAt: timestamp
}

// evidenceLink
{
  id: text (PK, UUID),
  sourceType: enum('claim', 'commitment', 'decision'),
  sourceId: text,
  targetType: enum('message', 'thread'),
  targetId: text,
  quotedText: text,
  confidence: real,
  createdAt: timestamp
}
```

## Technology Decisions

### Decision: PostgreSQL + pgvector (vs external vector DB)
- **Rationale**: Single database simplifies operations, transactions across vector and relational data, good enough scale for MVP (millions of emails)
- **Trade-offs**: Less specialized than Pinecone/Weaviate for massive scale
- **Alternatives considered**: Pinecone (complexity), Weaviate (another service), Qdrant (self-hosted complexity)

### Decision: Drizzle ORM (vs Prisma)
- **Rationale**: Better type inference, lighter weight, direct SQL access, existing codebase uses it
- **Trade-offs**: Less mature ecosystem
- **Alternatives considered**: Prisma (heavier, more abstraction)

### Decision: 1536-dim embeddings (OpenAI ada-002/text-embedding-3-small)
- **Rationale**: Industry standard, excellent quality, direct API access via existing AI package
- **Trade-offs**: API cost, data leaves system
- **Alternatives considered**: Open source (e5, bge) - could add later for on-prem

### Decision: HNSW indexes (vs IVFFlat)
- **Rationale**: Better recall at similar speed, no training required
- **Trade-offs**: More memory usage
- **Alternatives considered**: IVFFlat (faster but lower recall)

</architecture>

---

<risks>

## Technical Risks

### Risk: pgvector performance at scale
- **Impact**: High - core search functionality
- **Likelihood**: Medium - depends on index tuning
- **Mitigation**: Implement query caching, partition by organization, tune HNSW parameters
- **Fallback**: Migrate to dedicated vector DB if needed

### Risk: Schema migration complexity
- **Impact**: Medium - could block deployments
- **Likelihood**: Low - Drizzle handles migrations well
- **Mitigation**: Test migrations in staging, implement rollback procedures
- **Fallback**: Manual SQL migrations if Drizzle fails

### Risk: Embedding model changes
- **Impact**: High - all embeddings need regeneration
- **Likelihood**: Medium - models improve over time
- **Mitigation**: Store model version with embeddings, implement lazy re-embedding
- **Fallback**: Keep old embeddings, gradual migration

## Dependency Risks

### Risk: pgvector extension availability
- **Impact**: Critical - cannot function without it
- **Likelihood**: Low - widely supported
- **Mitigation**: Verify cloud provider support (Supabase, Neon, AWS RDS)
- **Fallback**: Self-hosted PostgreSQL with extension

## Scope Risks

### Risk: Schema over-engineering
- **Impact**: Medium - delays implementation
- **Likelihood**: Medium - tempting to add fields
- **Mitigation**: Start minimal, add fields as agents require them
- **Fallback**: Defer to JSONB metadata for flexibility

### Risk: Evidence Store size growth
- **Impact**: Medium - storage costs
- **Likelihood**: High - email accumulates
- **Mitigation**: Implement retention policies, archive old data
- **Fallback**: Tiered storage (hot/warm/cold)

</risks>

---

<appendix>

## References

- [pgvector documentation](https://github.com/pgvector/pgvector)
- [Drizzle ORM docs](https://orm.drizzle.team/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1603.09320)

## Glossary

| Term | Definition |
|------|------------|
| **Evidence Store** | Immutable storage of raw email data |
| **Intelligence Graph** | Derived data extracted by AI agents |
| **Claim** | Atomic fact extracted from messages |
| **Commitment** | Promise or task tracked through lifecycle |
| **Decision** | Recorded decision with rationale |
| **Provenance** | Chain of evidence linking intelligence to source |
| **HNSW** | Hierarchical Navigable Small World (vector index algorithm) |

## Open Questions

1. **Embedding dimension**: Should we support multiple models (1536 for OpenAI, 384 for open source)?
2. **Encryption**: Should we encrypt email bodies at rest beyond PostgreSQL encryption?
3. ~~**Multi-tenancy**: Organization-level isolation vs row-level security?~~ **RESOLVED**: Organization-level isolation with `organizationId` on all relevant tables. Row-level security via application queries (`WHERE organization_id = ?`).
4. **Retention**: Default retention period for evidence? User-configurable?

</appendix>

---

<task-master-integration>

## Task Extraction Summary

### Phase 0.0 Tasks
1. `setup-pgvector` - Configure PostgreSQL with pgvector extension
2. `drizzle-vector-types` - Create Drizzle custom types for vectors
3. `migration-infrastructure` - Set up migration tooling

### Phase 0.1 Tasks
4. `schema-email-account` - Define emailAccount table
5. `schema-email-thread` - Define emailThread table
6. `schema-email-message` - Define emailMessage table
7. `schema-email-attachment` - Define emailAttachment table
8. `schema-email-participant` - Define emailParticipant table
9. `schema-evidence-relations` - Create relations and indexes

### Phase 0.2 Tasks
10. `schema-contact` - Define contact table
11. `schema-topic` - Define topic table
12. `schema-claim` - Define claim table
13. `schema-commitment` - Define commitment table
14. `schema-decision` - Define decision table
15. `schema-intelligence-junctions` - Create junction tables

### Phase 0.3 Tasks
16. `schema-message-embedding` - Define messageEmbedding table
17. `schema-thread-embedding` - Define threadEmbedding table
18. `schema-claim-embedding` - Define claimEmbedding table
19. `vector-hnsw-indexes` - Create HNSW indexes
20. `hybrid-search-support` - Implement hybrid search

### Phase 0.4 Tasks
21. `schema-processing-job` - Define processingJob table
22. `schema-processing-audit` - Define processingAudit table
23. `schema-evidence-link` - Define evidenceLink table

### Dependencies
```
setup-pgvector → drizzle-vector-types → migration-infrastructure
  → schema-email-account → schema-email-thread → schema-email-message
    → schema-email-attachment, schema-email-participant
    → schema-evidence-relations
      → schema-contact → schema-claim → schema-commitment, schema-decision
      → schema-topic → schema-intelligence-junctions
        → schema-message-embedding, schema-thread-embedding, schema-claim-embedding
          → vector-hnsw-indexes → hybrid-search-support
            → schema-processing-job → schema-processing-audit → schema-evidence-link
```

</task-master-integration>
