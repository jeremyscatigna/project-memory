# PRD-07: Triage & Routing Agent

> Agent 6: Inbox Automation, Action Suggestions, Priority Ranking

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-07 |
| **Title** | Triage & Routing Agent |
| **Phase** | 3 - Intelligence Services |
| **Dependencies** | PRD-03, PRD-04, PRD-05 |
| **Dependent PRDs** | PRD-10 |
| **Agent Number** | 6 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Email triage is time-consuming and cognitively expensive:

1. **Volume overload** - Hundreds of emails with no clear priority
2. **Hidden urgency** - Important emails buried in noise
3. **Action ambiguity** - Unclear what to do with each email
4. **Context switching** - Constant decisions interrupt focus

The Triage Agent transforms inbox management from reactive to proactive, suggesting actions with clear reasoning.

## Target Users

### Primary: Busy Professionals
- 100+ emails/day
- Need quick decisions on each email
- Want to focus on what matters

### Secondary: Executive Assistants
- Triage on behalf of others
- Need to understand priorities
- Delegate appropriately

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Action suggestion accuracy | > 85% | User follows suggestion |
| Priority ranking quality | > 90% | Important emails ranked high |
| Time savings | > 50% | Time to process inbox |
| False urgent rate | < 5% | False positives in urgent |
| User trust | > 4/5 | "Suggestions are helpful" |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Priority Ranking
Rank emails by importance and urgency.

#### Feature: Urgency Assessment
- **Description**: Determine how time-sensitive an email is
- **Inputs**: Thread analysis, deadline mentions, sender
- **Outputs**: Urgency score (0-1)
- **Behavior**: Combine explicit deadlines, language cues, sender importance

#### Feature: Importance Assessment
- **Description**: Determine how important the email is
- **Inputs**: Sender importance, topic, financial impact
- **Outputs**: Importance score (0-1)
- **Behavior**: Weighted scoring based on multiple factors

#### Feature: Priority Matrix
- **Description**: Combine urgency and importance
- **Inputs**: Urgency score, importance score
- **Outputs**: Priority tier (urgent, high, medium, low)
- **Behavior**: 2x2 matrix classification

#### Feature: Dynamic Re-ranking
- **Description**: Update priorities as context changes
- **Inputs**: Time passing, new information
- **Outputs**: Updated priorities
- **Behavior**: Age threads, incorporate new signals

---

### Capability: Action Suggestion
Recommend what to do with each email.

#### Feature: Action Classification
- **Description**: Determine appropriate action
- **Inputs**: Thread analysis, user patterns
- **Outputs**: Suggested action type
- **Behavior**: Classify as respond, archive, delegate, schedule, wait, escalate

#### Feature: Action Reasoning
- **Description**: Explain why action is suggested
- **Inputs**: Action decision factors
- **Outputs**: Human-readable explanation
- **Behavior**: Generate natural language reasoning

#### Feature: Delegation Suggestions
- **Description**: Suggest who should handle email
- **Inputs**: Email content, team structure
- **Outputs**: Suggested delegate with reason
- **Behavior**: Match content to team member expertise

#### Feature: Response Time Suggestion
- **Description**: Suggest when to respond
- **Inputs**: Urgency, sender expectations, calendar
- **Outputs**: Suggested response window
- **Behavior**: Balance urgency with availability

---

### Capability: Batch Processing
Efficient inbox processing.

#### Feature: Smart Grouping
- **Description**: Group related emails for batch action
- **Inputs**: Inbox emails
- **Outputs**: Grouped threads
- **Behavior**: Cluster by sender, topic, action type

#### Feature: Batch Actions
- **Description**: Apply action to group at once
- **Inputs**: Group ID, action type
- **Outputs**: Applied to all in group
- **Behavior**: Execute action for all, track individually

#### Feature: Focus Mode
- **Description**: Show only priority items
- **Inputs**: User focus settings
- **Outputs**: Filtered inbox view
- **Behavior**: Hide low priority, surface urgent

---

### Capability: Learning & Adaptation
Improve suggestions over time.

#### Feature: Action Feedback
- **Description**: Learn from user actions
- **Inputs**: Suggested vs taken action
- **Outputs**: Updated model
- **Behavior**: Track acceptance, adjust weights

#### Feature: Rule Learning
- **Description**: Detect user patterns
- **Inputs**: Historical actions
- **Outputs**: Inferred rules
- **Behavior**: Identify consistent behaviors, codify as rules

#### Feature: Explicit Rules
- **Description**: User-defined rules
- **Inputs**: Rule definition
- **Outputs**: Rule record
- **Behavior**: Allow users to create explicit rules

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   └── triage.ts              # Triage agent
│   ├── scoring/
│   │   ├── priority.ts            # Priority scoring
│   │   └── action.ts              # Action classification
│   └── prompts/
│       └── triage/
│           ├── action.ts
│           └── reasoning.ts
apps/server/
└── src/
    └── trigger/
        └── triage-analysis.ts
packages/api/
└── src/
    └── routers/
        └── triage.ts
```

## Module Definitions

### Module: packages/ai/src/agents/triage.ts
- **Exports**:
  - `TriageAgent`
  - `triageThread(thread)`
  - `batchTriage(threads)`

### Module: packages/api/src/routers/triage.ts
- **Exports**:
  - `triageRouter`
  - Procedures: getSuggestions, applyAction, updateRules

</structural-decomposition>

---

<implementation-roadmap>

## Development Phases

### Phase 7.0: Priority Ranking
**Tasks**:
- [ ] Implement urgency assessment
- [ ] Implement importance assessment
- [ ] Implement priority matrix
- [ ] Implement dynamic re-ranking

### Phase 7.1: Action Suggestions
**Tasks**:
- [ ] Implement action classification
- [ ] Implement action reasoning
- [ ] Implement delegation suggestions
- [ ] Implement response time suggestion

### Phase 7.2: Batch Processing
**Tasks**:
- [ ] Implement smart grouping
- [ ] Implement batch actions
- [ ] Implement focus mode

### Phase 7.3: Learning
**Tasks**:
- [ ] Implement action feedback
- [ ] Implement rule learning
- [ ] Implement explicit rules

</implementation-roadmap>

---

<architecture>

## Priority Matrix

```
              High Importance    Low Importance
High Urgency  │    URGENT     │      HIGH       │
              │   (Do Now)    │  (Do Soon)      │
              ├───────────────┼─────────────────┤
Low Urgency   │     HIGH      │      LOW        │
              │  (Schedule)   │  (Archive?)     │
```

## Action Types

| Action | When | Example |
|--------|------|---------|
| Respond | Need to reply | Question asked |
| Archive | No action needed | FYI only |
| Delegate | Someone else should handle | Wrong recipient |
| Schedule | Need focused time | Complex analysis |
| Wait | Waiting on external | Expecting reply |
| Escalate | Above my authority | Needs manager |

</architecture>

---

<task-master-integration>

## Task Extraction Summary

### Phase 7.0 Tasks
1. `triage-urgency-assessment`
2. `triage-importance-assessment`
3. `triage-priority-matrix`
4. `triage-dynamic-reranking`

### Phase 7.1 Tasks
5. `triage-action-classification`
6. `triage-action-reasoning`
7. `triage-delegation-suggestions`
8. `triage-response-time`

### Phase 7.2 Tasks
9. `triage-smart-grouping`
10. `triage-batch-actions`
11. `triage-focus-mode`

### Phase 7.3 Tasks
12. `triage-action-feedback`
13. `triage-rule-learning`
14. `triage-explicit-rules`

</task-master-integration>
