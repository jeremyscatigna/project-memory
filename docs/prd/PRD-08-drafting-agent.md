# PRD-08: Drafting Agent

> Agent 7: Evidence-Grounded Reply Drafting with Citations

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-08 |
| **Title** | Drafting Agent |
| **Phase** | 4 - Action Agents |
| **Dependencies** | PRD-04, PRD-05, PRD-06 |
| **Dependent PRDs** | PRD-10 |
| **Agent Number** | 7 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

AI email drafting typically produces generic, disconnected responses:

1. **No context** - AI doesn't know your history with the person
2. **Inconsistency** - Drafts may contradict previous commitments
3. **No evidence** - Claims made without backing
4. **Wrong tone** - Generic voice, not your style

The Drafting Agent creates grounded replies that are consistent with your history and backed by evidence.

## Target Users

### Primary: All Users
- Need quick, contextual responses
- Want consistency with past communications
- Require evidence-backed statements

### Secondary: Customer-Facing Roles
- High volume responses needed
- Accuracy is critical
- Brand voice consistency

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Draft acceptance rate | > 60% | Drafts used (with edits) |
| Consistency accuracy | > 95% | No contradictions to history |
| Citation accuracy | 100% | All citations link correctly |
| Tone matching | > 80% | User tone assessment |
| Time savings | > 70% | vs manual drafting |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Context Retrieval
Gather relevant context for drafting.

#### Feature: Thread Context
- **Description**: Get full thread history
- **Inputs**: Thread ID
- **Outputs**: All messages with analysis
- **Behavior**: Fetch thread, include claims, commitments

#### Feature: Relationship Context
- **Description**: Get history with person
- **Inputs**: Contact ID
- **Outputs**: Relationship summary, recent interactions
- **Behavior**: Fetch from PRD-05 relationship agent

#### Feature: Relevant History
- **Description**: Find related past discussions
- **Inputs**: Current thread topics
- **Outputs**: Related threads/decisions
- **Behavior**: Semantic search via PRD-06

#### Feature: Open Commitments
- **Description**: Get pending items with person
- **Inputs**: Contact ID, organization
- **Outputs**: Open commitments involving contact
- **Behavior**: Query PRD-04 commitment ledger

---

### Capability: Grounded Generation
Generate evidence-backed drafts.

#### Feature: Reply Drafting
- **Description**: Generate draft reply
- **Inputs**: Thread, context, user intent
- **Outputs**: Draft with inline citations
- **Behavior**: LLM generation with context injection

#### Feature: Citation Insertion
- **Description**: Add source citations
- **Inputs**: Draft, evidence sources
- **Outputs**: Draft with citation markers
- **Behavior**: Link claims to source messages

#### Feature: Consistency Check
- **Description**: Verify draft doesn't contradict history
- **Inputs**: Draft, historical commitments/statements
- **Outputs**: Consistency score, conflicts if any
- **Behavior**: Compare draft claims to history

#### Feature: Tone Matching
- **Description**: Match user's writing style
- **Inputs**: Draft, user's historical messages
- **Outputs**: Tone-adjusted draft
- **Behavior**: Analyze user style, adjust generation

---

### Capability: Draft Management
Manage draft lifecycle.

#### Feature: Draft Suggestions
- **Description**: Offer multiple draft options
- **Inputs**: Thread, intent variations
- **Outputs**: 2-3 draft alternatives
- **Behavior**: Generate variations (brief, detailed, formal)

#### Feature: Iterative Refinement
- **Description**: Refine draft based on feedback
- **Inputs**: Draft, user feedback
- **Outputs**: Refined draft
- **Behavior**: Apply feedback, regenerate

#### Feature: Follow-up Drafts
- **Description**: Generate follow-up emails
- **Inputs**: Commitment to follow up on
- **Outputs**: Follow-up draft
- **Behavior**: Context-aware nudge generation

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   └── drafting.ts            # Drafting agent
│   ├── generation/
│   │   ├── reply.ts               # Reply generation
│   │   ├── citations.ts           # Citation handling
│   │   └── tone.ts                # Tone matching
│   └── prompts/
│       └── drafting/
│           ├── reply.ts
│           ├── followup.ts
│           └── refinement.ts
packages/api/
└── src/
    └── routers/
        └── drafts.ts
apps/web/
└── src/
    └── components/
        └── email/
            └── draft-composer.tsx
```

## Module Definitions

### Module: packages/ai/src/agents/drafting.ts
- **Exports**:
  - `DraftingAgent`
  - `generateDraft(thread, intent)`
  - `generateFollowup(commitment)`

### Module: packages/api/src/routers/drafts.ts
- **Exports**:
  - `draftsRouter`
  - Procedures: generate, refine, getFollowup

</structural-decomposition>

---

<implementation-roadmap>

## Development Phases

### Phase 8.0: Context Retrieval
**Tasks**:
- [ ] Implement thread context fetching
- [ ] Implement relationship context fetching
- [ ] Implement relevant history search
- [ ] Implement open commitments fetching

### Phase 8.1: Grounded Generation
**Tasks**:
- [ ] Implement reply drafting with LLM
- [ ] Implement citation insertion
- [ ] Implement consistency checking
- [ ] Implement tone matching

### Phase 8.2: Draft Management
**Tasks**:
- [ ] Implement draft variations
- [ ] Implement iterative refinement
- [ ] Implement follow-up generation

### Phase 8.3: UI Integration
**Tasks**:
- [ ] Create draft composer component
- [ ] Implement citation display
- [ ] Implement refinement flow

</implementation-roadmap>

---

<architecture>

## Draft Generation Flow

```
User: "Draft reply agreeing to the meeting"
         │
         ▼
┌─────────────────────────┐
│  Context Retrieval      │
│  • Thread history       │
│  • Relationship data    │
│  • Related decisions    │
│  • Open commitments     │
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  LLM Generation         │
│  • Context-aware prompt │
│  • User tone samples    │
│  • Citation requirements│
└─────────────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Post-Processing        │
│  • Consistency check    │
│  • Citation validation  │
│  • Tone adjustment      │
└─────────────────────────┘
         │
         ▼
    Draft with Citations
```

## Citation Format

```
"As we discussed in our April 12th thread [1], we agreed
to the $50k budget. I can confirm the meeting for next
Tuesday at 2pm as you suggested [2]."

[1] Thread: "Q2 Budget Discussion" - Apr 12, 2024
[2] This thread - Message from John, Jan 5, 2025
```

</architecture>

---

<risks>

## Technical Risks

### Risk: Hallucinated citations
- **Impact**: Critical - trust destroyed
- **Likelihood**: Medium
- **Mitigation**: Validate all citations exist, require quotes

### Risk: Inconsistent drafts
- **Impact**: High - could contradict promises
- **Likelihood**: Medium
- **Mitigation**: Mandatory consistency check

</risks>

---

<task-master-integration>

## Task Extraction Summary

### Phase 8.0 Tasks
1. `drafting-thread-context`
2. `drafting-relationship-context`
3. `drafting-relevant-history`
4. `drafting-open-commitments`

### Phase 8.1 Tasks
5. `drafting-reply-generation`
6. `drafting-citation-insertion`
7. `drafting-consistency-check`
8. `drafting-tone-matching`

### Phase 8.2 Tasks
9. `drafting-variations`
10. `drafting-refinement`
11. `drafting-followup`

### Phase 8.3 Tasks
12. `ui-draft-composer`
13. `ui-citation-display`
14. `ui-refinement-flow`

</task-master-integration>
