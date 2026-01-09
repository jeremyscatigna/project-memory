# PRD-05: Relationship Intelligence Agent

> Agent 4: Contact Dossiers and Relationship Tracking

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-05 |
| **Title** | Relationship Intelligence Agent |
| **Phase** | 2 - Intelligence Extraction |
| **Dependencies** | PRD-00 (Data Model), PRD-03 (Thread Understanding) |
| **Dependent PRDs** | PRD-07, PRD-08, PRD-11 |
| **Agent Number** | 4 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Email contains rich relationship data that's never surfaced:

1. **Who is this person?** - No context when opening an email from someone you haven't talked to in months
2. **Communication patterns** - How often do we interact? How quickly do they respond?
3. **Relationship health** - Is this relationship going well or deteriorating?
4. **Topic connections** - What do I typically discuss with this person?
5. **VIP detection** - Who are the most important people in my network?

The Relationship Intelligence Agent transforms your email history into a live CRM without manual data entry.

## Target Users

### Primary: Sales/BD Professionals
- Need relationship context before calls/meetings
- Want to track interaction patterns
- Need to identify cold relationships

### Secondary: Executives
- Understand network health
- Identify important contacts
- Brief before meetings

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Contact profile completeness | > 80% | Profiles with key fields populated |
| VIP detection accuracy | > 90% | Correctly identified VIPs |
| Responsiveness prediction | ±2 hours | Predicted vs actual response time |
| Relationship score accuracy | > 85% | User validation of scores |
| Context relevance | > 4/5 | User rating of meeting briefs |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Contact Profile Building
Create and maintain contact dossiers.

#### Feature: Identity Resolution
- **Description**: Merge multiple email addresses into single contact
- **Inputs**: Email addresses, display names, signatures
- **Outputs**: Unified contact record
- **Behavior**: Match by domain, name similarity, explicit aliases

#### Feature: Profile Enrichment
- **Description**: Extract profile information from email content
- **Inputs**: Email signatures, thread context
- **Outputs**: Title, company, phone, LinkedIn
- **Behavior**: Parse signatures, extract mentions, infer from context

#### Feature: Avatar Resolution
- **Description**: Find and store contact photos
- **Inputs**: Email address
- **Outputs**: Avatar URL
- **Behavior**: Check Gravatar, social profiles, default to initials

#### Feature: Company Association
- **Description**: Link contacts to companies
- **Inputs**: Email domain, signature content
- **Outputs**: Company record link
- **Behavior**: Extract company from domain/signature, create company if needed

---

### Capability: Communication Analytics
Track interaction patterns.

#### Feature: Interaction Frequency
- **Description**: Calculate communication frequency
- **Inputs**: Thread history with contact
- **Outputs**: Threads/month, messages/month, trend
- **Behavior**: Aggregate over time windows, detect trends

#### Feature: Responsiveness Metrics
- **Description**: Measure response time patterns
- **Inputs**: Thread history with contact
- **Outputs**: Avg response time, response rate
- **Behavior**: Calculate time between messages, track response rate

#### Feature: Communication Direction
- **Description**: Track who initiates conversations
- **Inputs**: Thread history
- **Outputs**: Initiation ratio, direction trend
- **Behavior**: Count who starts threads, track over time

#### Feature: Topic Association
- **Description**: Identify topics discussed with contact
- **Inputs**: Threads with contact, topic taxonomy
- **Outputs**: Topic list with frequency
- **Behavior**: Aggregate topics from shared threads

---

### Capability: Relationship Scoring
Assess relationship health and importance.

#### Feature: Importance Score
- **Description**: Rank contact importance
- **Inputs**: Communication frequency, seniority signals, deal involvement
- **Outputs**: Importance score 0-100
- **Behavior**: Weighted scoring based on interaction patterns

#### Feature: Relationship Health Score
- **Description**: Assess relationship trajectory
- **Inputs**: Recent vs historical interaction, sentiment
- **Outputs**: Health score with trend
- **Behavior**: Compare recent activity to baseline, factor sentiment

#### Feature: VIP Detection
- **Description**: Automatically identify VIP contacts
- **Inputs**: Importance score, explicit signals
- **Outputs**: VIP flag with reason
- **Behavior**: Threshold on importance, detect executive patterns

#### Feature: Risk Flagging
- **Description**: Identify relationships at risk
- **Inputs**: Health score trend, dropped frequency
- **Outputs**: Risk flag with reason
- **Behavior**: Detect declining engagement, flag for attention

---

### Capability: Relationship Context
Provide actionable context for interactions.

#### Feature: Open Loops Summary
- **Description**: Show pending items with contact
- **Inputs**: Commitments involving contact
- **Outputs**: Open loops list
- **Behavior**: Query commitments where contact is debtor/creditor

#### Feature: Recent History Summary
- **Description**: Summarize recent interactions
- **Inputs**: Recent threads with contact
- **Outputs**: 5-item history summary
- **Behavior**: Summarize last 5 meaningful interactions

#### Feature: Meeting Brief Generation
- **Description**: Create pre-meeting context packet
- **Inputs**: Contact ID, meeting details
- **Outputs**: Brief document
- **Behavior**: Compile profile, history, open loops, talking points

#### Feature: Predicted Response Time
- **Description**: Estimate when contact will respond
- **Inputs**: Historical response patterns, current context
- **Outputs**: Predicted response time
- **Behavior**: ML model on historical response times

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   └── relationship.ts          # Relationship agent
│   ├── analyzers/
│   │   ├── communication.ts         # Communication analytics
│   │   ├── scoring.ts               # Relationship scoring
│   │   └── identity.ts              # Identity resolution
│   └── prompts/
│       └── relationship/
│           ├── profile.ts           # Profile enrichment prompts
│           └── brief.ts             # Meeting brief prompts
apps/server/
└── src/
    └── trigger/
        ├── relationship-analysis.ts  # Relationship processing
        └── contact-enrichment.ts     # Profile enrichment
packages/api/
└── src/
    └── routers/
        └── contacts.ts               # Contact API
```

## Module Definitions

### Module: packages/ai/src/agents/relationship.ts
- **Maps to capability**: All Relationship capabilities
- **Responsibility**: Orchestrate relationship analysis
- **Exports**:
  - `RelationshipAgent`
  - `analyzeRelationship(contact)`
  - `generateMeetingBrief(contact)`

### Module: packages/ai/src/analyzers/communication.ts
- **Maps to capability**: Communication Analytics
- **Exports**:
  - `calculateFrequency(contact)`
  - `calculateResponsiveness(contact)`
  - `getTopicAssociation(contact)`

### Module: packages/api/src/routers/contacts.ts
- **Maps to capability**: API access
- **Exports**:
  - `contactsRouter`
  - Procedures: list, get, search, getMeetingBrief

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### From PRD-03
- Thread analysis for topic/sentiment
- Participant data

### Contact Building (Phase 5.0)
- **identity.ts**: Depends on [emailParticipant table]
- **contact enrichment**: Depends on [contact table, email content]

### Analytics (Phase 5.1)
- **communication.ts**: Depends on [emailThread, contact tables]
- **scoring.ts**: Depends on [communication analytics]

### Context (Phase 5.2)
- **relationship.ts**: Depends on [all analyzers]
- **brief generation**: Depends on [PRD-04 commitments]

### Integration (Phase 5.3)
- **relationship-analysis.ts**: Depends on [agent]
- **contacts.ts router**: Depends on [agent, contact table]

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 5.0: Contact Building
**Goal**: Create and enrich contact profiles

**Tasks**:
- [ ] Implement identity resolution (depends on: emailParticipant)
- [ ] Implement profile enrichment (depends on: email content)
- [ ] Implement avatar resolution (depends on: contact table)
- [ ] Implement company association (depends on: contact table)

**Delivers**: Unified contact profiles

---

### Phase 5.1: Communication Analytics
**Goal**: Calculate interaction metrics

**Tasks**:
- [ ] Implement frequency calculation
- [ ] Implement responsiveness metrics
- [ ] Implement direction analysis
- [ ] Implement topic association

**Delivers**: Quantified relationship data

---

### Phase 5.2: Relationship Scoring
**Goal**: Score and flag relationships

**Tasks**:
- [ ] Implement importance scoring
- [ ] Implement health scoring
- [ ] Implement VIP detection
- [ ] Implement risk flagging

**Delivers**: Prioritized contact list

---

### Phase 5.3: Context Generation
**Goal**: Create actionable relationship context

**Tasks**:
- [ ] Implement open loops summary
- [ ] Implement recent history summary
- [ ] Implement meeting brief generation
- [ ] Implement response time prediction

**Delivers**: Meeting-ready contact context

</implementation-roadmap>

---

<test-strategy>

## Critical Test Scenarios

### Identity Resolution
- Multiple email addresses same person → Single contact
- Similar names different people → Separate contacts

### Scoring
- High activity contact → High importance
- Declining activity → Risk flag

### Brief Generation
- Contact with history → Useful brief
- New contact → Minimal brief with available info

</test-strategy>

---

<architecture>

## Scoring Algorithms

### Importance Score (0-100)
```
importance = (
  frequency_score * 0.3 +
  responsiveness_score * 0.2 +
  thread_count_score * 0.2 +
  seniority_signal * 0.15 +
  deal_involvement * 0.15
)
```

### Health Score (0-100)
```
health = (
  recent_frequency / baseline_frequency * 0.4 +
  sentiment_trend * 0.3 +
  response_rate_trend * 0.3
)
```

## Technology Decisions

### Decision: Incremental profile building
- **Rationale**: Avoid processing all emails upfront
- **Trade-offs**: Profiles incomplete initially
- **Alternatives**: Full backfill (slow, expensive)

</architecture>

---

<risks>

## Technical Risks

### Risk: Identity resolution errors
- **Impact**: High - merged wrong people
- **Likelihood**: Medium
- **Mitigation**: Conservative matching, user correction

### Risk: Stale profiles
- **Impact**: Medium - outdated info
- **Likelihood**: High - people change jobs
- **Mitigation**: Re-enrich periodically

</risks>

---

<task-master-integration>

## Task Extraction Summary

### Phase 5.0 Tasks
1. `contact-identity-resolution`
2. `contact-profile-enrichment`
3. `contact-avatar-resolution`
4. `contact-company-association`

### Phase 5.1 Tasks
5. `analytics-frequency`
6. `analytics-responsiveness`
7. `analytics-direction`
8. `analytics-topics`

### Phase 5.2 Tasks
9. `scoring-importance`
10. `scoring-health`
11. `scoring-vip-detection`
12. `scoring-risk-flagging`

### Phase 5.3 Tasks
13. `context-open-loops`
14. `context-recent-history`
15. `context-meeting-brief`
16. `context-response-prediction`

</task-master-integration>
