# PRD-10: Inbox & Thread Views

> User Interface: Inbox Briefs, Thread Detail, Command Bar

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-10 |
| **Title** | Inbox & Thread Views |
| **Phase** | 5 - User Experience |
| **Dependencies** | All Agent PRDs (PRD-03 through PRD-09) |
| **Dependent PRDs** | PRD-11 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Traditional email clients show messages, not intelligence:

1. **No context at a glance** - Must open each email to understand it
2. **No suggested actions** - User decides everything manually
3. **No memory access** - Can't query historical knowledge
4. **Scattered intelligence** - Insights not surfaced where needed

This PRD defines the core UI that surfaces intelligence where users need it.

## Target Users

### Primary: All MEMORYSTACK Users
- Need efficient inbox processing
- Want intelligence surfaced automatically
- Require quick access to knowledge

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to process inbox | -50% | vs traditional client |
| Clicks per thread | -30% | Reduced navigation |
| Query usage | > 3/day | Command bar queries |
| Intelligence engagement | > 70% | Views of intelligence panels |
| User satisfaction | > 4.5/5 | NPS-style rating |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Inbox View
Smart inbox with briefs and suggestions.

#### Feature: Thread Brief Cards
- **Description**: Show 3-line brief for each thread
- **Inputs**: Thread list with analysis
- **Outputs**: Card view with brief, metadata, actions
- **Behavior**: Display brief, urgency badge, suggested action

#### Feature: Priority Sorting
- **Description**: Sort inbox by priority
- **Inputs**: Threads with triage analysis
- **Outputs**: Priority-sorted thread list
- **Behavior**: Urgent first, then high, medium, low

#### Feature: Smart Filters
- **Description**: Filter by intelligence dimensions
- **Inputs**: Filter criteria (has commitments, needs response, etc.)
- **Outputs**: Filtered thread list
- **Behavior**: Query filters against intelligence data

#### Feature: Batch Actions
- **Description**: Apply actions to multiple threads
- **Inputs**: Selected threads, action type
- **Outputs**: Applied action confirmation
- **Behavior**: Execute action for all selected

---

### Capability: Thread Detail View
Full thread with intelligence overlay.

#### Feature: Conversation Panel
- **Description**: Show original email thread
- **Inputs**: Thread ID
- **Outputs**: Chronological message list
- **Behavior**: Display messages with headers, body, attachments

#### Feature: Intelligence Panel
- **Description**: Show extracted intelligence
- **Inputs**: Thread analysis
- **Outputs**: Claims, commitments, decisions sidebar
- **Behavior**: Display with evidence links, confidence

#### Feature: Memory Panel
- **Description**: Show related historical context
- **Inputs**: Thread topics, participants
- **Outputs**: Related threads, decisions, history
- **Behavior**: Semantic search, relationship context

#### Feature: Draft Panel
- **Description**: Compose replies with AI assistance
- **Inputs**: User intent, thread context
- **Outputs**: Draft composer with suggestions
- **Behavior**: Show drafts from PRD-08, allow editing

---

### Capability: Command Bar
Natural language query interface.

#### Feature: Global Search
- **Description**: Search across all email
- **Inputs**: Search query
- **Outputs**: Search results
- **Behavior**: Hybrid keyword + semantic search

#### Feature: Ask Questions
- **Description**: Natural language Q&A
- **Inputs**: Natural language question
- **Outputs**: Answer with citations
- **Behavior**: Route to PRD-06 search engine

#### Feature: Quick Actions
- **Description**: Execute actions via command
- **Inputs**: Action command
- **Outputs**: Action executed
- **Behavior**: Parse command, execute (archive, snooze, etc.)

#### Feature: Navigation
- **Description**: Navigate to specific views
- **Inputs**: Navigation command
- **Outputs**: View change
- **Behavior**: "Go to commitments", "Show decisions about X"

---

### Capability: Real-Time Updates
Keep UI current with changes.

#### Feature: New Email Notification
- **Description**: Alert on new emails
- **Inputs**: Sync events
- **Outputs**: UI notification, inbox update
- **Behavior**: Toast notification, prepend to list

#### Feature: Intelligence Updates
- **Description**: Update intelligence as processed
- **Inputs**: Analysis completion events
- **Outputs**: Updated intelligence panels
- **Behavior**: Progressive loading of intelligence

#### Feature: Optimistic Updates
- **Description**: Immediate UI response to actions
- **Inputs**: User action
- **Outputs**: Immediate UI update
- **Behavior**: Update UI instantly, reconcile with server

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
apps/web/
└── src/
    ├── routes/
    │   └── email/
    │       ├── index.tsx              # Inbox view
    │       ├── thread.$threadId.tsx   # Thread detail
    │       └── search.tsx             # Search results
    ├── components/
    │   └── email/
    │       ├── thread-brief.tsx       # Brief card
    │       ├── thread-list.tsx        # Inbox list
    │       ├── conversation.tsx       # Message list
    │       ├── intelligence-panel.tsx # Intelligence sidebar
    │       ├── memory-panel.tsx       # Context panel
    │       ├── command-bar.tsx        # Command interface
    │       └── draft-composer.tsx     # Reply composer
    └── hooks/
        └── email/
            ├── useInbox.ts            # Inbox data hook
            ├── useThread.ts           # Thread data hook
            └── useSearch.ts           # Search hook
```

## Module Definitions

### Module: apps/web/src/routes/email/index.tsx
- **Maps to capability**: Inbox View
- **Exports**: Default route component

### Module: apps/web/src/routes/email/thread.$threadId.tsx
- **Maps to capability**: Thread Detail View
- **Exports**: Default route component

### Module: apps/web/src/components/email/command-bar.tsx
- **Maps to capability**: Command Bar
- **Exports**: CommandBar component

</structural-decomposition>

---

<implementation-roadmap>

## Development Phases

### Phase 10.0: Inbox View
**Tasks**:
- [ ] Implement thread brief card component
- [ ] Implement inbox list with priority sorting
- [ ] Implement smart filters
- [ ] Implement batch actions

### Phase 10.1: Thread Detail
**Tasks**:
- [ ] Implement conversation panel
- [ ] Implement intelligence panel
- [ ] Implement memory panel
- [ ] Implement draft panel integration

### Phase 10.2: Command Bar
**Tasks**:
- [ ] Implement global search
- [ ] Implement ask questions flow
- [ ] Implement quick actions
- [ ] Implement navigation commands

### Phase 10.3: Real-Time
**Tasks**:
- [ ] Implement new email notifications
- [ ] Implement intelligence updates
- [ ] Implement optimistic updates

</implementation-roadmap>

---

<architecture>

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⌘K Command Bar: "What did we decide about pricing?"               │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────┐ ┌─────────────────────────────────────────┐ │
│ │                     │ │                                         │ │
│ │   INBOX             │ │   THREAD DETAIL                         │ │
│ │                     │ │                                         │ │
│ │ [!] Thread Brief    │ │   From: John Smith                      │ │
│ │     3-line summary  │ │   Re: Q2 Budget                         │ │
│ │     → Respond       │ │                                         │ │
│ │                     │ │   [Message Content]                     │ │
│ │ [ ] Thread Brief    │ │                                         │ │
│ │     3-line summary  │ │   ┌─────────────────────────────────┐   │ │
│ │     → Archive       │ │   │ INTELLIGENCE PANEL              │   │ │
│ │                     │ │   │ • Commitments (2)               │   │ │
│ │ [ ] Thread Brief    │ │   │ • Decisions (1)                 │   │ │
│ │     ...             │ │   │ • Open Questions (1)            │   │ │
│ │                     │ │   └─────────────────────────────────┘   │ │
│ │                     │ │   ┌─────────────────────────────────┐   │ │
│ │                     │ │   │ MEMORY PANEL                    │   │ │
│ │                     │ │   │ Related: Budget Q1, Pricing     │   │ │
│ │                     │ │   └─────────────────────────────────┘   │ │
│ └─────────────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
<EmailLayout>
  <CommandBar />
  <SplitPane>
    <InboxPanel>
      <ThreadList>
        <ThreadBrief />
        <ThreadBrief />
      </ThreadList>
    </InboxPanel>
    <DetailPanel>
      <ConversationView />
      <IntelligencePanel />
      <MemoryPanel />
      <DraftComposer />
    </DetailPanel>
  </SplitPane>
</EmailLayout>
```

</architecture>

---

<test-strategy>

## Critical Test Scenarios

### Inbox View
- 100 threads → Renders within 500ms
- Priority sort → Urgent items first
- Filter by commitments → Only matching threads

### Thread Detail
- Open thread → All panels load
- Intelligence panel → Shows correct data
- Memory panel → Related items accurate

### Command Bar
- Search query → Relevant results
- Ask question → Answer with citations
- Quick action → Executes correctly

</test-strategy>

---

<task-master-integration>

## Task Extraction Summary

### Phase 10.0 Tasks
1. `ui-thread-brief-card`
2. `ui-inbox-list`
3. `ui-smart-filters`
4. `ui-batch-actions`

### Phase 10.1 Tasks
5. `ui-conversation-panel`
6. `ui-intelligence-panel`
7. `ui-memory-panel`
8. `ui-draft-panel`

### Phase 10.2 Tasks
9. `ui-command-bar-search`
10. `ui-command-bar-ask`
11. `ui-command-bar-actions`
12. `ui-command-bar-navigation`

### Phase 10.3 Tasks
13. `ui-new-email-notifications`
14. `ui-intelligence-updates`
15. `ui-optimistic-updates`

</task-master-integration>
