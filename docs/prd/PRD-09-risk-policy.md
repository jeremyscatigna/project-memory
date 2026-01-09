# PRD-09: Risk & Policy Agent

> Agent 8: Contradiction Detection, Fraud Signals, Policy Enforcement

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-09 |
| **Title** | Risk & Policy Agent |
| **Phase** | 4 - Action Agents |
| **Dependencies** | PRD-04, PRD-06 |
| **Dependent PRDs** | PRD-10 |
| **Agent Number** | 8 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

High-stakes email users face significant risks:

1. **Contradictions** - Promising something that conflicts with prior commitments
2. **Sensitive data leaks** - Accidentally sharing confidential information
3. **Fraud/impersonation** - Invoice fraud, executive impersonation
4. **Policy violations** - Breaking company or legal policies
5. **Reputation damage** - Saying something inconsistent with past statements

The Risk Agent provides a safety net, catching potential problems before they cause damage.

## Target Users

### Primary: Executives & High-Stakes Roles
- High cost of mistakes
- Complex commitments to track
- Frequent targets of fraud

### Secondary: Compliance Teams
- Policy enforcement
- Audit trails
- Risk monitoring

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Contradiction detection rate | > 90% | Detected / Actual contradictions |
| False positive rate | < 10% | False alarms / Total alerts |
| Fraud detection rate | > 80% | Detected / Known fraud attempts |
| Alert response time | < 24h | Time to user action |
| User trust | > 4/5 | "Alerts are helpful" |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Contradiction Detection
Find conflicts with historical statements.

#### Feature: Commitment Conflict Check
- **Description**: Detect contradictions with past commitments
- **Inputs**: Draft/message, commitment ledger
- **Outputs**: Conflicting commitments if any
- **Behavior**: Compare draft claims to existing commitments

#### Feature: Statement Consistency Check
- **Description**: Detect contradictions with past statements
- **Inputs**: Draft/message, historical claims
- **Outputs**: Contradictory statements if any
- **Behavior**: Semantic comparison to past claims

#### Feature: Decision Reversal Detection
- **Description**: Flag when reversing previous decisions
- **Inputs**: Message content, decision history
- **Outputs**: Related decisions that would be contradicted
- **Behavior**: Compare to decision records

#### Feature: Conflict Resolution Suggestions
- **Description**: Suggest how to address conflicts
- **Inputs**: Detected conflict
- **Outputs**: Resolution options
- **Behavior**: Offer acknowledge, explain, retract options

---

### Capability: Sensitive Data Detection
Prevent information leaks.

#### Feature: PII Detection
- **Description**: Detect personally identifiable information
- **Inputs**: Message content
- **Outputs**: PII types found with locations
- **Behavior**: Regex + ML detection for SSN, credit cards, etc.

#### Feature: Confidential Content Detection
- **Description**: Detect confidential business information
- **Inputs**: Message content, confidentiality markers
- **Outputs**: Confidential items found
- **Behavior**: Keyword matching, classification

#### Feature: Recipient Validation
- **Description**: Warn about external recipients for sensitive content
- **Inputs**: Message, recipient list
- **Outputs**: External recipient warnings
- **Behavior**: Check domain, warn about sensitive + external

---

### Capability: Fraud Detection
Identify potential fraud attempts.

#### Feature: Impersonation Detection
- **Description**: Detect executive impersonation
- **Inputs**: Incoming message, known senders
- **Outputs**: Impersonation risk score
- **Behavior**: Check sender against known addresses, flag lookalikes

#### Feature: Invoice Fraud Detection
- **Description**: Detect fraudulent payment requests
- **Inputs**: Message with payment request
- **Outputs**: Fraud risk score with reasons
- **Behavior**: Check bank detail changes, urgency patterns

#### Feature: Phishing Detection
- **Description**: Detect phishing attempts
- **Inputs**: Message with links
- **Outputs**: Phishing risk score
- **Behavior**: URL analysis, sender verification

---

### Capability: Policy Enforcement
Enforce organization policies.

#### Feature: Policy Rule Matching
- **Description**: Check messages against policy rules
- **Inputs**: Message, policy ruleset
- **Outputs**: Violated rules if any
- **Behavior**: Pattern matching against defined rules

#### Feature: Approval Workflow Triggers
- **Description**: Trigger approvals for policy-defined actions
- **Inputs**: Message matching approval rule
- **Outputs**: Approval request
- **Behavior**: Route to approver, block until approved

#### Feature: Audit Logging
- **Description**: Log policy-relevant events
- **Inputs**: Policy event
- **Outputs**: Audit record
- **Behavior**: Record all checks and outcomes

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   └── risk.ts                # Risk agent
│   ├── detectors/
│   │   ├── contradiction.ts       # Contradiction detection
│   │   ├── sensitive.ts           # Sensitive data detection
│   │   ├── fraud.ts               # Fraud detection
│   │   └── policy.ts              # Policy enforcement
│   └── prompts/
│       └── risk/
│           ├── contradiction.ts
│           └── resolution.ts
apps/server/
└── src/
    └── trigger/
        └── risk-analysis.ts
packages/api/
└── src/
    └── routers/
        └── risk.ts
```

## Module Definitions

### Module: packages/ai/src/agents/risk.ts
- **Exports**:
  - `RiskAgent`
  - `analyzeRisk(message)`
  - `checkDraft(draft)`

### Module: packages/api/src/routers/risk.ts
- **Exports**:
  - `riskRouter`
  - Procedures: checkMessage, checkDraft, dismissAlert, getAlerts

</structural-decomposition>

---

<implementation-roadmap>

## Development Phases

### Phase 9.0: Contradiction Detection
**Tasks**:
- [ ] Implement commitment conflict check
- [ ] Implement statement consistency check
- [ ] Implement decision reversal detection
- [ ] Implement resolution suggestions

### Phase 9.1: Sensitive Data Detection
**Tasks**:
- [ ] Implement PII detection
- [ ] Implement confidential content detection
- [ ] Implement recipient validation

### Phase 9.2: Fraud Detection
**Tasks**:
- [ ] Implement impersonation detection
- [ ] Implement invoice fraud detection
- [ ] Implement phishing detection

### Phase 9.3: Policy Enforcement
**Tasks**:
- [ ] Implement policy rule matching
- [ ] Implement approval workflows
- [ ] Implement audit logging

</implementation-roadmap>

---

<architecture>

## Risk Analysis Flow

```
Outgoing Draft or Incoming Message
         │
         ▼
┌─────────────────────────────────┐
│       RISK ANALYSIS             │
├─────────────────────────────────┤
│ □ Contradiction Check           │
│ □ Sensitive Data Check          │
│ □ Fraud Pattern Check           │
│ □ Policy Rule Check             │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│       RISK SCORE                │
│  Low (0-30) | Med (31-70) | High│
└─────────────────────────────────┘
         │
         ├─ Low ──────▶ Proceed
         │
         ├─ Medium ───▶ Warning Banner
         │
         └─ High ─────▶ Block + Require Acknowledge
```

## Alert Types

| Type | Severity | Action |
|------|----------|--------|
| Minor contradiction | Low | Informational |
| Commitment conflict | Medium | Warning |
| PII in external email | Medium | Warning + confirm |
| Executive impersonation | High | Block + verify |
| Invoice fraud signals | High | Block + escalate |

</architecture>

---

<risks>

## Technical Risks

### Risk: Too many false positives
- **Impact**: High - users ignore all alerts
- **Likelihood**: Medium
- **Mitigation**: Tunable thresholds, feedback loop

### Risk: Missing real threats
- **Impact**: Critical - security failure
- **Likelihood**: Medium
- **Mitigation**: Defense in depth, multiple detectors

</risks>

---

<task-master-integration>

## Task Extraction Summary

### Phase 9.0 Tasks
1. `risk-commitment-conflict`
2. `risk-statement-consistency`
3. `risk-decision-reversal`
4. `risk-resolution-suggestions`

### Phase 9.1 Tasks
5. `risk-pii-detection`
6. `risk-confidential-detection`
7. `risk-recipient-validation`

### Phase 9.2 Tasks
8. `risk-impersonation-detection`
9. `risk-invoice-fraud`
10. `risk-phishing-detection`

### Phase 9.3 Tasks
11. `risk-policy-rules`
12. `risk-approval-workflows`
13. `risk-audit-logging`

</task-master-integration>
