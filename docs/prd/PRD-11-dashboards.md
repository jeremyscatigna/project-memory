# PRD-11: Dashboards

> Commitment Ledger, Decision Log, Relationship Views

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-11 |
| **Title** | Dashboards |
| **Phase** | 5 - User Experience |
| **Dependencies** | PRD-04, PRD-05, PRD-10 |
| **Dependent PRDs** | None (terminal PRD) |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Email intelligence is only useful if easily accessible:

1. **Commitments scattered** - No single view of all obligations
2. **Decisions forgotten** - No searchable decision history
3. **Relationships invisible** - No dashboard of key contacts

This PRD defines dedicated views for managing extracted intelligence.

## Target Users

### Primary: All MEMORYSTACK Users
- Review daily commitments
- Search decision history
- Manage relationships

### Secondary: Managers
- Team accountability
- Decision documentation
- Stakeholder management

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily active usage | > 50% | Users viewing dashboards daily |
| Commitment completion | +30% | Tracked to completion |
| Decision queries | > 5/week | Searches in decision log |
| Time to find info | -70% | vs searching email |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Commitment Ledger
Track all commitments in one place.

#### Feature: Owed By Me View
- **Description**: Show my outstanding commitments
- **Inputs**: User ID
- **Outputs**: Commitment list with status
- **Behavior**: Filter by debtor=user, group by status/urgency

#### Feature: Owed To Me View
- **Description**: Show others' commitments to me
- **Inputs**: User ID
- **Outputs**: Commitment list
- **Behavior**: Filter by creditor=user, group by overdue status

#### Feature: Commitment Timeline
- **Description**: Show commitments on calendar
- **Inputs**: Date range
- **Outputs**: Calendar view with due dates
- **Behavior**: Display commitments on due dates

#### Feature: Quick Actions
- **Description**: Manage commitments from dashboard
- **Inputs**: Commitment ID, action
- **Outputs**: Updated commitment
- **Behavior**: Mark complete, snooze, dismiss, generate follow-up

#### Feature: Digest Configuration
- **Description**: Configure daily/weekly digests
- **Inputs**: Digest preferences
- **Outputs**: Updated preferences
- **Behavior**: Set frequency, time, included categories

---

### Capability: Decision Log
Searchable decision history.

#### Feature: Decision Timeline
- **Description**: Chronological decision view
- **Inputs**: Date range, filters
- **Outputs**: Decision list with context
- **Behavior**: Show decisions over time, grouped by topic

#### Feature: Decision Search
- **Description**: Search decisions by topic/keyword
- **Inputs**: Search query
- **Outputs**: Matching decisions
- **Behavior**: Semantic + keyword search on decisions

#### Feature: Decision Detail
- **Description**: Full decision context view
- **Inputs**: Decision ID
- **Outputs**: Decision with rationale, alternatives, evidence
- **Behavior**: Show full context, link to source threads

#### Feature: Supersession View
- **Description**: Show decision evolution
- **Inputs**: Decision ID
- **Outputs**: Decision chain
- **Behavior**: Display supersession history

#### Feature: Export
- **Description**: Export decisions for documentation
- **Inputs**: Selection, format
- **Outputs**: Exported document
- **Behavior**: Generate PDF/Markdown of selected decisions

---

### Capability: Relationship Dashboard
Manage and view relationships.

#### Feature: Contact List
- **Description**: All contacts with metrics
- **Inputs**: Filters, sort
- **Outputs**: Contact list with scores
- **Behavior**: Show contacts with importance, health, last interaction

#### Feature: VIP View
- **Description**: High-priority contacts
- **Inputs**: VIP threshold
- **Outputs**: VIP contact list
- **Behavior**: Filter to VIPs, show open loops

#### Feature: At-Risk Relationships
- **Description**: Relationships needing attention
- **Inputs**: Risk threshold
- **Outputs**: At-risk contacts
- **Behavior**: Show declining relationships

#### Feature: Contact Detail
- **Description**: Full contact profile
- **Inputs**: Contact ID
- **Outputs**: Profile, history, open items
- **Behavior**: Display dossier from PRD-05

#### Feature: Meeting Prep
- **Description**: Generate meeting briefs
- **Inputs**: Contact ID, meeting context
- **Outputs**: Meeting brief document
- **Behavior**: Compile relevant context

---

### Capability: Analytics (Future)
Aggregate insights across data.

#### Feature: Commitment Analytics
- **Description**: Commitment completion trends
- **Inputs**: Date range
- **Outputs**: Charts and metrics
- **Behavior**: Show completion rate, overdue trends

#### Feature: Communication Analytics
- **Description**: Communication pattern insights
- **Inputs**: Date range
- **Outputs**: Charts and metrics
- **Behavior**: Show volume, response times, trends

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
apps/web/
└── src/
    ├── routes/
    │   └── email/
    │       ├── commitments.tsx        # Commitment ledger
    │       ├── decisions.tsx          # Decision log
    │       └── contacts.tsx           # Relationship dashboard
    └── components/
        └── dashboards/
            ├── commitment-card.tsx    # Commitment item
            ├── commitment-timeline.tsx
            ├── decision-card.tsx      # Decision item
            ├── decision-timeline.tsx
            ├── contact-card.tsx       # Contact item
            ├── contact-list.tsx
            └── analytics/
                ├── commitment-chart.tsx
                └── communication-chart.tsx
```

## Module Definitions

### Module: apps/web/src/routes/email/commitments.tsx
- **Maps to capability**: Commitment Ledger
- **Exports**: Default route component

### Module: apps/web/src/routes/email/decisions.tsx
- **Maps to capability**: Decision Log
- **Exports**: Default route component

### Module: apps/web/src/routes/email/contacts.tsx
- **Maps to capability**: Relationship Dashboard
- **Exports**: Default route component

</structural-decomposition>

---

<implementation-roadmap>

## Development Phases

### Phase 11.0: Commitment Ledger
**Tasks**:
- [ ] Implement owed by me view
- [ ] Implement owed to me view
- [ ] Implement commitment timeline
- [ ] Implement quick actions
- [ ] Implement digest configuration

### Phase 11.1: Decision Log
**Tasks**:
- [ ] Implement decision timeline
- [ ] Implement decision search
- [ ] Implement decision detail view
- [ ] Implement supersession view
- [ ] Implement export functionality

### Phase 11.2: Relationship Dashboard
**Tasks**:
- [ ] Implement contact list
- [ ] Implement VIP view
- [ ] Implement at-risk view
- [ ] Implement contact detail
- [ ] Implement meeting prep

### Phase 11.3: Analytics (Future)
**Tasks**:
- [ ] Implement commitment analytics
- [ ] Implement communication analytics

</implementation-roadmap>

---

<architecture>

## Dashboard Layouts

### Commitment Ledger
```
┌─────────────────────────────────────────────────────────────────────┐
│  COMMITMENTS                                    [Daily Digest ⚙️]   │
├─────────────────────────────────────────────────────────────────────┤
│  [Owed by Me] [Owed to Me] [All]                                    │
├─────────────────────────────────────────────────────────────────────┤
│  OVERDUE (3)                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔴 Send proposal to Acme Corp      Due: Jan 5  [Follow-up]  │   │
│  │    Thread: Q1 Partnership Discussion                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  DUE THIS WEEK (5)                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🟡 Review budget draft             Due: Jan 12 [Complete]   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Decision Log
```
┌─────────────────────────────────────────────────────────────────────┐
│  DECISIONS                            🔍 Search decisions...        │
├─────────────────────────────────────────────────────────────────────┤
│  Filter: [All Topics ▼] [All Time ▼] [All People ▼]                │
├─────────────────────────────────────────────────────────────────────┤
│  January 2025                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ We will use Stripe for payment processing                   │   │
│  │ Jan 8 • Pricing • John, Sarah                               │   │
│  │ Rationale: Better developer experience, competitive rates   │   │
│  │ [View Thread] [View Alternatives]                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  December 2024                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Postpone Q1 launch to Q2                                    │   │
│  │ Dec 15 • Product • Leadership Team                          │   │
│  │ ⚠️ Superseded by: Launch moved to March 15                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Relationship Dashboard
```
┌─────────────────────────────────────────────────────────────────────┐
│  RELATIONSHIPS                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  [All Contacts] [VIPs] [At Risk] [Recent]                          │
├─────────────────────────────────────────────────────────────────────┤
│  VIP CONTACTS (12)                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 👤 John Smith, VP Sales @ Acme                              │   │
│  │    📊 Score: 95  ⏱️ Last: 2 days ago  📧 12 open loops     │   │
│  │    [View Profile] [Prepare Meeting]                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  NEEDS ATTENTION (3)                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ Sarah Chen - 45 days since last contact                  │   │
│  │    Relationship declining • Previously active weekly        │   │
│  │    [Reconnect]                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

</architecture>

---

<test-strategy>

## Critical Test Scenarios

### Commitment Ledger
- User with 50 commitments → All display correctly
- Mark complete → Status updates, removed from active
- Follow-up action → Draft generated

### Decision Log
- Search "pricing" → Relevant decisions found
- View supersession → Chain displays correctly
- Export → Valid document generated

### Relationship Dashboard
- 100 contacts → Renders efficiently
- VIP filter → Correct contacts shown
- Meeting prep → Useful brief generated

</test-strategy>

---

<task-master-integration>

## Task Extraction Summary

### Phase 11.0 Tasks
1. `dashboard-commitments-owed-by`
2. `dashboard-commitments-owed-to`
3. `dashboard-commitments-timeline`
4. `dashboard-commitments-actions`
5. `dashboard-commitments-digest`

### Phase 11.1 Tasks
6. `dashboard-decisions-timeline`
7. `dashboard-decisions-search`
8. `dashboard-decisions-detail`
9. `dashboard-decisions-supersession`
10. `dashboard-decisions-export`

### Phase 11.2 Tasks
11. `dashboard-contacts-list`
12. `dashboard-contacts-vip`
13. `dashboard-contacts-atrisk`
14. `dashboard-contacts-detail`
15. `dashboard-contacts-meeting-prep`

### Phase 11.3 Tasks (Future)
16. `dashboard-analytics-commitments`
17. `dashboard-analytics-communication`

</task-master-integration>
