# MEMORYSTACK - Product Requirements Documents

> An AI-native email client that turns your inbox into a decision, commitment, and relationship operating system — with traceable memory and zero hallucinations.

## Overview

This directory contains the complete Product Requirements Documents (PRDs) for MEMORYSTACK, following the **Repository Planning Graph (RPG)** methodology from Microsoft Research. Each PRD is structured with explicit dependencies, enabling topological task execution.

## Document Index

### Phase 0: Foundation
| Document | Description | Status |
|----------|-------------|--------|
| [PRD-00: Data Model](./PRD-00-data-model.md) | Evidence Store + Intelligence Graph + pgvector schemas | Core |

### Phase 1: Ingestion Layer
| Document | Description | Dependencies |
|----------|-------------|--------------|
| [PRD-01: Email Providers](./PRD-01-email-providers.md) | Gmail/Outlook OAuth integration | PRD-00 |
| [PRD-02: Email Sync](./PRD-02-email-sync.md) | Incremental sync engine via Trigger.dev | PRD-00, PRD-01 |

### Phase 2: Intelligence Extraction
| Document | Description | Dependencies |
|----------|-------------|--------------|
| [PRD-03: Thread Understanding](./PRD-03-thread-understanding.md) | Agent 1: Thread analysis, classification, claim extraction | PRD-00, PRD-02 |
| [PRD-04: Commitments & Decisions](./PRD-04-commitments-decisions.md) | Agents 2+3: Commitment ledger + Decision memory | PRD-00, PRD-03 |
| [PRD-05: Relationship Intelligence](./PRD-05-relationship-intelligence.md) | Agent 4: Contact dossiers, relationship tracking | PRD-00, PRD-03 |

### Phase 3: Intelligence Services
| Document | Description | Dependencies |
|----------|-------------|--------------|
| [PRD-06: Search & Knowledge](./PRD-06-search-knowledge.md) | Agent 5: Semantic search (pgvector) + Personal Knowledge | PRD-00, PRD-03, PRD-04 |
| [PRD-07: Triage & Routing](./PRD-07-triage-routing.md) | Agent 6: Inbox automation, action suggestions | PRD-00, PRD-03, PRD-04, PRD-05 |

### Phase 4: Action Agents
| Document | Description | Dependencies |
|----------|-------------|--------------|
| [PRD-08: Drafting Agent](./PRD-08-drafting-agent.md) | Agent 7: Evidence-grounded reply drafting | PRD-00, PRD-04, PRD-06 |
| [PRD-09: Risk & Policy](./PRD-09-risk-policy.md) | Agent 8: Contradiction detection, fraud signals | PRD-00, PRD-04, PRD-06 |

### Phase 5: User Experience
| Document | Description | Dependencies |
|----------|-------------|--------------|
| [PRD-10: Inbox & Thread Views](./PRD-10-inbox-views.md) | Inbox briefs, thread detail, command bar | All Phase 2-4 PRDs |
| [PRD-11: Dashboards](./PRD-11-dashboards.md) | Commitment ledger, decision log, relationship views | PRD-04, PRD-05, PRD-10 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER EXPERIENCE (Phase 5)                          │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │   PRD-10: Inbox & Threads   │───▶│   PRD-11: Dashboards & Ledgers     │ │
│  │   • Inbox briefs            │    │   • Commitment ledger              │ │
│  │   • Thread detail view      │    │   • Decision log                   │ │
│  │   • Command bar             │    │   • Relationship views             │ │
│  └─────────────────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACTION AGENTS (Phase 4)                             │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │   PRD-08: Drafting Agent    │◀──▶│   PRD-09: Risk & Policy Agent      │ │
│  │   • Evidence-based replies  │    │   • Contradiction detection        │ │
│  │   • Inline citations        │    │   • Sensitive info detection       │ │
│  │   • Tone consistency        │    │   • Fraud signals                  │ │
│  └─────────────────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
┌─────────────────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE SERVICES (Phase 3)                         │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ PRD-06: Search & Knowledge  │◀──▶│   PRD-07: Triage & Routing         │ │
│  │   • Semantic search         │    │   • Action suggestions             │ │
│  │   • pgvector embeddings     │    │   • Priority ranking               │ │
│  │   • Personal knowledge      │    │   • Delegation recommendations     │ │
│  └─────────────────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
┌─────────────────────────────────────────────────────────────────────────────┐
│                     INTELLIGENCE EXTRACTION (Phase 2)                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                  PRD-03: Thread Understanding Agent                    │  │
│  │   • Thread classification • Claim extraction • Brief generation       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                    │                                │                        │
│                    ▼                                ▼                        │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ PRD-04: Commit & Decision   │    │ PRD-05: Relationship Intelligence  │ │
│  │   • Commitment tracking     │    │   • Contact dossiers               │ │
│  │   • Decision memory         │    │   • Communication patterns         │ │
│  │   • Open loops detection    │    │   • VIP detection                  │ │
│  └─────────────────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INGESTION LAYER (Phase 1)                            │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │  PRD-01: Email Providers    │───▶│   PRD-02: Email Sync Engine        │ │
│  │   • Gmail OAuth             │    │   • Incremental sync               │ │
│  │   • Outlook OAuth           │    │   • Historical backfill            │ │
│  │   • Token management        │    │   • Entity extraction              │ │
│  └─────────────────────────────┘    └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FOUNDATION (Phase 0)                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      PRD-00: Data Model                                │  │
│  │   • Evidence Store (immutable emails)                                  │  │
│  │   • Intelligence Graph (derived data)                                  │  │
│  │   • pgvector for semantic search                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The 8 Agents

| # | Agent | PRD | Purpose |
|---|-------|-----|---------|
| 1 | Thread Understanding | PRD-03 | Classify threads, extract claims, generate briefs, detect open loops |
| 2 | Commitment & Follow-up | PRD-04 | Track promises, create tasks, manage due dates, generate digests |
| 3 | Decision Memory | PRD-04 | Extract decisions, store rationale, track supersession |
| 4 | Relationship Intelligence | PRD-05 | Build contact dossiers, analyze communication patterns |
| 5 | Personal Knowledge | PRD-06 | Query patterns, institutional memory, cross-thread insights |
| 6 | Triage & Routing | PRD-07 | Suggest actions, rank priority, recommend delegation |
| 7 | Drafting (Grounded) | PRD-08 | Generate evidence-based replies with citations |
| 8 | Policy & Risk | PRD-09 | Detect contradictions, fraud signals, policy violations |

---

## MVP Scope (V1)

### MUST HAVE
- [ ] Gmail + Outlook integration (PRD-01, PRD-02)
- [ ] Thread briefs with citations (PRD-03, PRD-10)
- [ ] Commitment extraction + tracking (PRD-04, PRD-11)
- [ ] Decision extraction + querying (PRD-04, PRD-06, PRD-11)
- [ ] Global "Ask My Email" search (PRD-06, PRD-10)
- [ ] Grounded reply drafting (PRD-08)
- [ ] Basic risk warnings (PRD-09)

### SHOULD HAVE
- [ ] Relationship dossiers (PRD-05, PRD-11)
- [ ] Daily open-loops digest (PRD-04, PRD-07)
- [ ] Editable confidence overrides (PRD-03, PRD-04)

### WILL NOT HAVE (V1)
- Fancy writing styles
- Full CRM replacement
- Multi-tenant enterprise workflows
- External tool automation

---

## Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Database** | PostgreSQL + pgvector | Vector search via extension |
| **ORM** | Drizzle | Type-safe queries |
| **API** | tRPC + Hono | End-to-end type safety |
| **Background Jobs** | Trigger.dev | Email sync, AI processing |
| **Frontend** | React 19 + TanStack Router | Modern React patterns |
| **AI Providers** | OpenAI, Anthropic, etc. | Multi-provider via Vercel AI SDK |
| **Auth** | Better Auth | OAuth providers, 2FA |

---

## Codebase Mapping

```
project-memory/
├── packages/
│   ├── db/
│   │   └── src/schema/
│   │       ├── email.ts          # PRD-00: Evidence Store
│   │       ├── intelligence.ts   # PRD-00: Intelligence Graph
│   │       └── vectors.ts        # PRD-00: pgvector types
│   ├── api/
│   │   └── src/routers/
│   │       ├── email-accounts.ts # PRD-01
│   │       ├── email-sync.ts     # PRD-02
│   │       ├── threads.ts        # PRD-03
│   │       ├── commitments.ts    # PRD-04
│   │       ├── decisions.ts      # PRD-04
│   │       ├── contacts.ts       # PRD-05
│   │       ├── search.ts         # PRD-06
│   │       ├── triage.ts         # PRD-07
│   │       ├── drafts.ts         # PRD-08
│   │       └── risk.ts           # PRD-09
│   └── ai/
│       └── src/agents/
│           ├── thread-understanding.ts  # PRD-03
│           ├── commitment.ts            # PRD-04
│           ├── decision.ts              # PRD-04
│           ├── relationship.ts          # PRD-05
│           ├── search.ts                # PRD-06
│           ├── knowledge.ts             # PRD-06
│           ├── triage.ts                # PRD-07
│           ├── drafting.ts              # PRD-08
│           └── risk.ts                  # PRD-09
├── apps/
│   ├── server/
│   │   └── src/trigger/
│   │       ├── email-sync.ts            # PRD-02
│   │       ├── email-backfill.ts        # PRD-02
│   │       ├── thread-analysis.ts       # PRD-03
│   │       ├── commitment-extraction.ts # PRD-04
│   │       ├── decision-extraction.ts   # PRD-04
│   │       ├── relationship-analysis.ts # PRD-05
│   │       ├── embedding-generation.ts  # PRD-06
│   │       ├── triage-analysis.ts       # PRD-07
│   │       └── risk-analysis.ts         # PRD-09
│   └── web/
│       └── src/
│           ├── routes/
│           │   ├── dashboard/
│           │   │   └── email-accounts.tsx  # PRD-01
│           │   └── email/
│           │       ├── index.tsx           # PRD-10
│           │       ├── thread.$threadId.tsx # PRD-10
│           │       ├── commitments.tsx     # PRD-11
│           │       ├── decisions.tsx       # PRD-11
│           │       └── contacts.tsx        # PRD-11
│           └── components/
│               └── email/
│                   ├── thread-brief.tsx      # PRD-10
│                   ├── intelligence-panel.tsx # PRD-10
│                   ├── command-bar.tsx       # PRD-10
│                   └── draft-composer.tsx    # PRD-08
```

---

## Key Principles

### 1. Evidence-First
Every AI output must be traceable to source emails. No hallucinations.

### 2. No Black Box Decisions
AI suggestions must explain "why" with citations.

### 3. Memory Over Generation
Understanding history is primary; writing emails is secondary.

### 4. Incremental Intelligence
The system improves continuously as emails arrive.

### 5. Trust > Cleverness
Accuracy beats creativity. Always.

---

## Getting Started

1. **Read PRD-00** first to understand the data model foundation
2. **Follow the dependency chain** when implementing
3. **Each PRD is self-contained** but references dependencies
4. **Use task-master** to parse PRDs into executable tasks

---

## References

- [APP.md](../../APP.md) - Original product vision document
- [RPG Method](https://arxiv.org/abs/...) - Microsoft Research methodology
- [Trigger.dev Docs](https://trigger.dev/docs) - Background job patterns
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity search
