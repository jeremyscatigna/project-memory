# PRD-04: Commitment & Decision Agents

> Agents 2+3: Commitment Ledger and Decision Memory

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-04 |
| **Title** | Commitment & Decision Agents |
| **Phase** | 2 - Intelligence Extraction |
| **Dependencies** | PRD-00 (Data Model), PRD-03 (Thread Understanding) |
| **Dependent PRDs** | PRD-06, PRD-07, PRD-08, PRD-09, PRD-11 |
| **Agent Numbers** | 2 and 3 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Email contains a wealth of implicit commitments and decisions that are never tracked:

1. **Commitments** - "I'll send the report by Friday" becomes a forgotten promise
2. **Decisions** - "We decided to use Stripe" gets lost in thread history
3. **Follow-ups** - No one remembers who owes what to whom
4. **Rationale** - Why we made decisions is forgotten within weeks

These two agents transform email from a message archive into an accountability and institutional memory system.

## Target Users

### Primary: Power Users
- Need commitment tracking without manual task creation
- Want to query "What did we decide about X and why?"
- Require follow-up automation

### Secondary: Teams
- Shared visibility into commitments
- Decision history for onboarding
- Accountability across org

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Commitment detection rate | > 85% | Detected / Actual commitments |
| Decision detection rate | > 80% | Detected / Actual decisions |
| False positive rate | < 10% | False / Total detections |
| Commitment resolution tracking | > 90% | Correctly tracked completions |
| User trust score | > 4/5 | "Was this accurate?" ratings |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Commitment Tracking (Agent 2)
Track promises, tasks, and follow-ups from email.

#### Feature: Promise Detection
- **Description**: Identify when someone commits to something
- **Inputs**: Claims from Thread Understanding (type: promise)
- **Outputs**: Commitment record with parties and obligation
- **Behavior**: Parse promise claims, identify debtor/creditor, extract deliverable

#### Feature: Request-to-Commitment Conversion
- **Description**: Convert accepted requests into commitments
- **Inputs**: Request claim + acceptance reply
- **Outputs**: Commitment with both parties
- **Behavior**: Match requests to acceptances, create mutual commitment

#### Feature: Due Date Extraction
- **Description**: Extract or infer due dates
- **Inputs**: Commitment context, temporal expressions
- **Outputs**: Due date with confidence
- **Behavior**: Parse explicit dates, infer from context ("ASAP", "next week")

#### Feature: Status Tracking
- **Description**: Track commitment lifecycle
- **Inputs**: Commitment ID, thread updates
- **Outputs**: Status changes (pending → completed/cancelled)
- **Behavior**: Detect completion signals, update status automatically

#### Feature: Overdue Detection
- **Description**: Identify past-due commitments
- **Inputs**: Commitments with due dates, current date
- **Outputs**: Overdue commitment list
- **Behavior**: Compare dates, escalate overdue items

#### Feature: Follow-up Generation
- **Description**: Create follow-up drafts for open commitments
- **Inputs**: Open commitment, days overdue
- **Outputs**: Follow-up email draft
- **Behavior**: Generate contextual nudge based on relationship

#### Feature: Daily Digest Generation
- **Description**: Summarize open commitments
- **Inputs**: User's commitments (owed by me, owed to me)
- **Outputs**: Daily digest email/notification
- **Behavior**: Group by urgency, include context and links

---

### Capability: Decision Memory (Agent 3)
Extract and track decisions with rationale.

#### Feature: Decision Detection
- **Description**: Identify decision points in threads
- **Inputs**: Claims from Thread Understanding (type: decision)
- **Outputs**: Decision record
- **Behavior**: Parse decision claims, extract decision statement

#### Feature: Rationale Extraction
- **Description**: Capture why decisions were made
- **Inputs**: Decision context, preceding discussion
- **Outputs**: Rationale text with evidence
- **Behavior**: Find reasoning in thread, link to source messages

#### Feature: Alternatives Recording
- **Description**: Track what alternatives were considered
- **Inputs**: Decision thread context
- **Outputs**: List of alternatives discussed
- **Behavior**: Extract "we could also", "another option", etc.

#### Feature: Owner Attribution
- **Description**: Identify who made/approved decision
- **Inputs**: Decision context, participants
- **Outputs**: Decision owner(s)
- **Behavior**: Find "I decided", approver signals

#### Feature: Supersession Tracking
- **Description**: Track when decisions are changed
- **Inputs**: New decision, existing decisions
- **Outputs**: Supersession chain
- **Behavior**: Match topics, detect reversals, link old → new

#### Feature: Decision Querying
- **Description**: Answer "What did we decide about X?"
- **Inputs**: Query topic, organization context
- **Outputs**: Relevant decisions with evidence
- **Behavior**: Semantic search on decisions, return with rationale

---

### Capability: Evidence & Confidence
Maintain provenance for all extractions.

#### Feature: Multi-Message Evidence
- **Description**: Link commitments/decisions to source messages
- **Inputs**: Extraction with message references
- **Outputs**: Evidence chain
- **Behavior**: Store all supporting message IDs and quotes

#### Feature: Confidence Scoring
- **Description**: Score extraction confidence
- **Inputs**: Extraction context, language clarity
- **Outputs**: Confidence 0-1
- **Behavior**: Higher for explicit language, lower for inferred

#### Feature: User Correction
- **Description**: Allow users to correct extractions
- **Inputs**: Extraction ID, correction details
- **Outputs**: Updated extraction, feedback record
- **Behavior**: Update record, store feedback for model improvement

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   ├── commitment.ts           # Commitment agent
│   │   ├── decision.ts             # Decision agent
│   │   └── extractors/
│   │       ├── dates.ts            # Date extraction
│   │       └── parties.ts          # Party identification
│   └── prompts/
│       ├── commitment/
│       │   ├── detection.ts
│       │   ├── status.ts
│       │   └── followup.ts
│       └── decision/
│           ├── detection.ts
│           ├── rationale.ts
│           └── supersession.ts
apps/server/
└── src/
    └── trigger/
        ├── commitment-extraction.ts
        ├── decision-extraction.ts
        └── commitment-digest.ts
packages/api/
└── src/
    └── routers/
        ├── commitments.ts
        └── decisions.ts
```

## Module Definitions

### Module: packages/ai/src/agents/commitment.ts
- **Maps to capability**: Commitment Tracking
- **Responsibility**: Extract and manage commitments
- **Exports**:
  - `CommitmentAgent`
  - `extractCommitments(claims)`
  - `trackStatus(commitment, thread)`

### Module: packages/ai/src/agents/decision.ts
- **Maps to capability**: Decision Memory
- **Responsibility**: Extract and track decisions
- **Exports**:
  - `DecisionAgent`
  - `extractDecisions(claims)`
  - `findSupersession(decision)`

### Module: packages/api/src/routers/commitments.ts
- **Responsibility**: Commitment CRUD and queries
- **Exports**:
  - `commitmentsRouter`
  - Procedures: list, get, update, complete, generateFollowup

### Module: packages/api/src/routers/decisions.ts
- **Responsibility**: Decision queries
- **Exports**:
  - `decisionsRouter`
  - Procedures: list, get, search, getWithRationale

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### From PRD-03
- `claim` records with type: promise, request, decision
- Thread analysis results

### Commitment Agent (Phase 4.0)
- **commitment.ts**: Depends on [claim table, contact table]
- **dates.ts**: No dependencies
- **parties.ts**: Depends on [contact table]

### Decision Agent (Phase 4.1)
- **decision.ts**: Depends on [claim table, contact table]
- **supersession**: Depends on [decision table, embeddings]

### Integration (Phase 4.2)
- **commitment-extraction.ts**: Depends on [commitment.ts, PRD-03 events]
- **decision-extraction.ts**: Depends on [decision.ts, PRD-03 events]
- **commitment-digest.ts**: Depends on [commitment table]

### API (Phase 4.3)
- **commitments.ts router**: Depends on [commitment table]
- **decisions.ts router**: Depends on [decision table]

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 4.0: Commitment Agent
**Goal**: Extract and track commitments

**Entry Criteria**: PRD-03 producing claims

**Tasks**:
- [ ] Implement promise-to-commitment conversion (depends on: claim table)
  - Acceptance: Promise claims become commitments
  - Test: Explicit promises, implicit promises
- [ ] Implement request-acceptance matching (depends on: claim table)
  - Acceptance: Matched requests create commitments
  - Test: Direct acceptance, implicit acceptance
- [ ] Implement due date extraction (depends on: dates.ts)
  - Acceptance: Dates parsed correctly with confidence
  - Test: Explicit dates, relative dates, no date
- [ ] Implement party identification (depends on: contact table)
  - Acceptance: Debtor/creditor correctly identified
  - Test: Clear parties, ambiguous parties
- [ ] Implement status tracking (depends on: commitment table)
  - Acceptance: Status updates on thread changes
  - Test: Completion signals, cancellation
- [ ] Implement overdue detection (depends on: commitment table)
  - Acceptance: Overdue commitments flagged
  - Test: Past due, due today, upcoming

**Exit Criteria**: Commitments extracted and tracked

**Delivers**: Automatic commitment ledger

---

### Phase 4.1: Decision Agent
**Goal**: Extract and track decisions

**Entry Criteria**: Phase 4.0 complete

**Tasks**:
- [ ] Implement decision detection (depends on: claim table)
  - Acceptance: Decision claims become records
  - Test: Explicit decisions, approvals, choices
- [ ] Implement rationale extraction (depends on: thread context)
  - Acceptance: Why captured with evidence
  - Test: Clear rationale, implicit rationale
- [ ] Implement alternatives recording (depends on: thread context)
  - Acceptance: Options discussed captured
  - Test: Multiple alternatives, none mentioned
- [ ] Implement owner attribution (depends on: contact table)
  - Acceptance: Decision makers identified
  - Test: Single owner, group decision
- [ ] Implement supersession tracking (depends on: decision table, embeddings)
  - Acceptance: Changed decisions linked
  - Test: Direct reversal, evolution

**Exit Criteria**: Decisions extracted with context

**Delivers**: Searchable decision memory

---

### Phase 4.2: Integration & Automation
**Goal**: Connect to pipeline and create automations

**Entry Criteria**: Phase 4.1 complete

**Tasks**:
- [ ] Create commitment extraction task (depends on: commitment agent)
  - Acceptance: Runs on PRD-03 events
  - Test: New thread, updated thread
- [ ] Create decision extraction task (depends on: decision agent)
  - Acceptance: Runs on PRD-03 events
  - Test: New thread, updated thread
- [ ] Implement daily digest generation (depends on: commitment table)
  - Acceptance: Daily summary of open items
  - Test: Digest content, timing
- [ ] Implement follow-up draft generation (depends on: PRD-08 interface)
  - Acceptance: Contextual follow-up emails
  - Test: Tone, context inclusion

**Exit Criteria**: Automated extraction and notifications

**Delivers**: Hands-free commitment management

---

### Phase 4.3: API Layer
**Goal**: Expose functionality via API

**Entry Criteria**: Phase 4.2 complete

**Tasks**:
- [ ] Create commitments router (depends on: commitment table)
  - Acceptance: CRUD + query operations
  - Test: All procedures
- [ ] Create decisions router (depends on: decision table)
  - Acceptance: Query + search operations
  - Test: All procedures
- [ ] Implement correction API (depends on: both routers)
  - Acceptance: Users can fix extractions
  - Test: Correction flow

**Exit Criteria**: Full API access

**Delivers**: UI-ready commitment and decision access

</implementation-roadmap>

---

<test-strategy>

## Test Pyramid

```
        /\
       /E2E\       ← 10% (Full extraction flows)
      /------\
     /Integration\ ← 35% (Agent + DB + LLM)
    /------------\
   /  Unit Tests  \ ← 55% (Parsing, matching, status logic)
  /----------------\
```

## Critical Test Scenarios

### Commitment Agent
**Happy path**:
- "I'll send the report by Friday" → Commitment created
- Expected: Debtor=sender, Obligation="send report", Due=Friday

**Edge cases**:
- Conditional commitment ("If approved, I'll...")
- Group commitment ("We will deliver...")
- No clear due date
- Expected: Appropriate handling, confidence scores

### Decision Agent
**Happy path**:
- "Let's go with Stripe for payments" → Decision recorded
- Expected: Statement, owner, rationale if present

**Edge cases**:
- Tentative decision ("I think we should...")
- Decision by silence (no objection)
- Decision reversal in later thread
- Expected: Confidence adjustment, supersession

### Integration
**Happy path**:
- Thread synced → Claims extracted → Commitments/Decisions created
- Expected: Full pipeline execution

**Error cases**:
- LLM failure mid-extraction
- Database constraint violation
- Expected: Graceful handling, no partial state

</test-strategy>

---

<architecture>

## Data Models

### Commitment Lifecycle

```
┌─────────┐     ┌─────────────┐     ┌───────────┐
│ Pending │────▶│ In Progress │────▶│ Completed │
└─────────┘     └─────────────┘     └───────────┘
     │                │
     │                │
     ▼                ▼
┌───────────┐   ┌───────────┐
│ Cancelled │   │  Overdue  │
└───────────┘   └───────────┘
```

### Decision Evolution

```
Decision v1 (2024-01-15)
  │
  │ superseded_by
  ▼
Decision v2 (2024-03-20)
  │
  │ superseded_by
  ▼
Decision v3 (Current)
```

## Technology Decisions

### Decision: Separate commitment and decision tables
- **Rationale**: Different lifecycles, queries, UI needs
- **Trade-offs**: More tables to manage
- **Alternatives**: Single "extraction" table (less flexible)

### Decision: Daily digest via scheduled job
- **Rationale**: Predictable delivery, batch efficient
- **Trade-offs**: Not real-time
- **Alternatives**: Real-time notifications (noisy)

</architecture>

---

<risks>

## Technical Risks

### Risk: False positive commitments
- **Impact**: High - user distrust
- **Likelihood**: Medium - language is ambiguous
- **Mitigation**: Confidence thresholds, easy dismissal
- **Fallback**: Human review queue

### Risk: Missing decision rationale
- **Impact**: Medium - reduced value
- **Likelihood**: High - rationale often implicit
- **Mitigation**: Search broader context, prompt for clarity
- **Fallback**: Store decision without rationale

## Scope Risks

### Risk: Commitment scope creep (full task management)
- **Impact**: Medium - feature bloat
- **Likelihood**: High - users will want more
- **Mitigation**: Clear scope boundaries, integrate with task tools
- **Fallback**: Export to external task managers

</risks>

---

<task-master-integration>

## Task Extraction Summary

### Phase 4.0 Tasks
1. `commitment-promise-conversion` - Promise to commitment
2. `commitment-request-matching` - Request-acceptance matching
3. `commitment-date-extraction` - Due date extraction
4. `commitment-party-identification` - Debtor/creditor ID
5. `commitment-status-tracking` - Status lifecycle
6. `commitment-overdue-detection` - Overdue flagging

### Phase 4.1 Tasks
7. `decision-detection` - Decision extraction
8. `decision-rationale` - Rationale extraction
9. `decision-alternatives` - Alternatives recording
10. `decision-owner` - Owner attribution
11. `decision-supersession` - Supersession tracking

### Phase 4.2 Tasks
12. `trigger-commitment-extraction` - Extraction task
13. `trigger-decision-extraction` - Extraction task
14. `trigger-daily-digest` - Digest generation
15. `trigger-followup-generation` - Follow-up drafts

### Phase 4.3 Tasks
16. `api-commitments-router` - Commitments API
17. `api-decisions-router` - Decisions API
18. `api-correction` - Correction API

</task-master-integration>
