# PRD-03: Thread Understanding Agent

> Agent 1: Thread Analysis, Classification, and Claim Extraction

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-03 |
| **Title** | Thread Understanding Agent |
| **Phase** | 2 - Intelligence Extraction |
| **Dependencies** | PRD-00 (Data Model), PRD-02 (Email Sync) |
| **Dependent PRDs** | PRD-04, PRD-05, PRD-06, PRD-07, PRD-08, PRD-09 |
| **Agent Number** | 1 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Raw email threads are unstructured text. To enable higher-level intelligence (commitments, decisions, search), we must first understand each thread:

1. **Classification** - Is this an approval request? Negotiation? Scheduling?
2. **Claim extraction** - What facts, promises, questions are stated?
3. **Brief generation** - What's this thread about in 3 lines?
4. **Open loop detection** - What questions remain unanswered?
5. **Metadata enrichment** - Urgency, sentiment, key entities

The Thread Understanding Agent is the foundation of the intelligence pipeline.

## Target Users

### Primary: Downstream Agents
- Commitment Agent needs detected promises
- Decision Agent needs identified decisions
- Triage Agent needs classification and urgency

### Secondary: End Users
- See thread briefs in inbox
- Understand thread context at a glance

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Classification accuracy | > 90% | Human evaluation on test set |
| Claim extraction recall | > 85% | Claims found / Total claims |
| Brief quality score | > 4/5 | User ratings on usefulness |
| Processing latency | < 5 seconds | Time per thread |
| Open loop detection | > 80% | Detected / Actual unanswered questions |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Thread Classification
Categorize threads by intent and type.

#### Feature: Intent Classification
- **Description**: Determine primary intent of thread
- **Inputs**: Thread messages, participant context
- **Outputs**: Intent category with confidence
- **Behavior**: Classify as approval_request, negotiation, scheduling, information_sharing, question, task_assignment, feedback, complaint, other

#### Feature: Thread Type Detection
- **Description**: Identify thread structure type
- **Inputs**: Thread messages, metadata
- **Outputs**: Type category
- **Behavior**: Detect single_message, back_and_forth, broadcast, chain_reply, forward_chain

#### Feature: Urgency Scoring
- **Description**: Assess thread urgency level
- **Inputs**: Thread content, dates, explicit markers
- **Outputs**: Urgency score (0-1) with reasoning
- **Behavior**: Analyze deadline mentions, urgency language, sender importance

#### Feature: Sentiment Analysis
- **Description**: Track sentiment across thread
- **Inputs**: Thread messages in order
- **Outputs**: Sentiment scores per message, overall trend
- **Behavior**: Score each message, detect sentiment shifts, flag escalations

---

### Capability: Claim Extraction
Extract atomic facts and statements from threads.

#### Feature: Fact Extraction
- **Description**: Extract stated facts and information
- **Inputs**: Message text
- **Outputs**: List of fact claims with evidence
- **Behavior**: Identify factual statements, link to source text

#### Feature: Promise Detection
- **Description**: Identify commitments and promises
- **Inputs**: Message text, sender context
- **Outputs**: Promise claims for Commitment Agent
- **Behavior**: Detect "I will", "We'll send", commitment language

#### Feature: Request Detection
- **Description**: Identify requests and asks
- **Inputs**: Message text
- **Outputs**: Request claims for Commitment Agent
- **Behavior**: Detect "Can you", "Please", request patterns

#### Feature: Question Identification
- **Description**: Extract questions asked
- **Inputs**: Message text
- **Outputs**: Question claims with answer status
- **Behavior**: Detect explicit and implicit questions

#### Feature: Decision Point Detection
- **Description**: Identify decisions and approvals
- **Inputs**: Message text
- **Outputs**: Decision claims for Decision Agent
- **Behavior**: Detect "We decided", "Approved", "Let's go with"

---

### Capability: Brief Generation
Create concise thread summaries.

#### Feature: Thread Summary
- **Description**: Generate 3-line thread brief
- **Inputs**: Full thread context
- **Outputs**: Brief with key points
- **Behavior**: Summarize what, who, what's open in 3 sentences

#### Feature: Key Points Extraction
- **Description**: Extract most important points
- **Inputs**: Thread messages
- **Outputs**: Bullet list of key points
- **Behavior**: Identify critical information, decisions, actions

#### Feature: Timeline Generation
- **Description**: Create thread timeline
- **Inputs**: Thread messages with timestamps
- **Outputs**: Chronological event list
- **Behavior**: Extract key events with dates

---

### Capability: Open Loop Detection
Identify unanswered questions and pending items.

#### Feature: Unanswered Question Detection
- **Description**: Find questions without answers
- **Inputs**: Thread with question claims
- **Outputs**: List of open questions
- **Behavior**: Match questions to subsequent answers, flag unmatched

#### Feature: Pending Action Identification
- **Description**: Find incomplete action items
- **Inputs**: Thread with commitment claims
- **Outputs**: List of pending actions
- **Behavior**: Track promises without completion signals

#### Feature: Waiting-On Analysis
- **Description**: Identify what's blocking thread
- **Inputs**: Thread analysis
- **Outputs**: Waiting-on summary
- **Behavior**: Determine who owes what to move forward

---

### Capability: Evidence Linking
Connect intelligence to source evidence.

#### Feature: Quote Extraction
- **Description**: Extract relevant quotes for claims
- **Inputs**: Claim, source message
- **Outputs**: Quoted text with message reference
- **Behavior**: Select minimal text that supports claim

#### Feature: Confidence Scoring
- **Description**: Assess confidence in extractions
- **Inputs**: Extraction with context
- **Outputs**: Confidence score (0-1)
- **Behavior**: Score based on language clarity, context availability

#### Feature: Multi-Source Linking
- **Description**: Link claims to multiple messages
- **Inputs**: Claim spanning multiple messages
- **Outputs**: Multiple evidence links
- **Behavior**: Track all supporting evidence

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   ├── thread-understanding.ts    # Main agent implementation
│   │   ├── classifiers/
│   │   │   ├── intent.ts              # Intent classification
│   │   │   ├── urgency.ts             # Urgency scoring
│   │   │   └── sentiment.ts           # Sentiment analysis
│   │   ├── extractors/
│   │   │   ├── claims.ts              # Claim extraction
│   │   │   ├── questions.ts           # Question detection
│   │   │   └── entities.ts            # Entity extraction
│   │   └── generators/
│   │       ├── brief.ts               # Brief generation
│   │       └── timeline.ts            # Timeline generation
│   └── prompts/
│       └── thread-understanding/
│           ├── classification.ts       # Classification prompts
│           ├── extraction.ts           # Extraction prompts
│           └── summarization.ts        # Summary prompts
apps/server/
└── src/
    ├── trigger/
    │   └── thread-analysis.ts          # Trigger.dev analysis task
    └── routes/
packages/api/
└── src/
    └── routers/
        └── threads.ts                   # Thread intelligence API
```

## Module Definitions

### Module: packages/ai/src/agents/thread-understanding.ts
- **Maps to capability**: All Thread Understanding capabilities
- **Responsibility**: Orchestrate thread analysis
- **Exports**:
  - `ThreadUnderstandingAgent` - Main agent class
  - `analyzeThread(thread)` - Entry point for analysis

### Module: packages/ai/src/agents/extractors/claims.ts
- **Maps to capability**: Claim Extraction
- **Responsibility**: Extract claims from messages
- **Exports**:
  - `extractClaims(messages)` - Claim extraction
  - `ClaimType` - Claim type enum

### Module: apps/server/src/trigger/thread-analysis.ts
- **Maps to capability**: Processing orchestration
- **Responsibility**: Background analysis jobs
- **Exports**:
  - `analyzeThreadTask` - Single thread analysis
  - `batchAnalyzeThreadsTask` - Batch analysis

### Module: packages/api/src/routers/threads.ts
- **Maps to capability**: API access
- **Responsibility**: Thread intelligence queries
- **Exports**:
  - `threadsRouter` - tRPC router

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### Foundation (from PRD-00, PRD-02)
- `emailThread`, `emailMessage` tables - Source data
- `claim` table - Store extractions
- Email sync events - Trigger analysis

### Agent Core (Phase 3.0)
- **thread-understanding.ts**: Depends on [AI SDK, schema]
- **prompts/***: No dependencies

### Classifiers (Phase 3.1)
- **intent.ts**: Depends on [prompts/classification]
- **urgency.ts**: Depends on [prompts/classification]
- **sentiment.ts**: Depends on [prompts/classification]

### Extractors (Phase 3.2)
- **claims.ts**: Depends on [prompts/extraction]
- **questions.ts**: Depends on [claims.ts]
- **entities.ts**: Depends on [prompts/extraction]

### Generators (Phase 3.3)
- **brief.ts**: Depends on [classifiers, extractors]
- **timeline.ts**: Depends on [extractors]

### Integration (Phase 3.4)
- **thread-analysis.ts**: Depends on [agent, Trigger.dev]
- **threads.ts router**: Depends on [agent]

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 3.0: Agent Foundation
**Goal**: Create agent skeleton and prompt infrastructure

**Entry Criteria**: PRD-02 sync working (threads in Evidence Store)

**Tasks**:
- [ ] Create ThreadUnderstandingAgent class (depends on: AI SDK)
  - Acceptance: Agent instantiates, accepts thread input
  - Test: Initialization tests
- [ ] Define claim types and schemas (depends on: PRD-00 claim table)
  - Acceptance: All claim types defined with Zod schemas
  - Test: Schema validation tests
- [ ] Create prompt templates (depends on: none)
  - Acceptance: Prompts for classification, extraction, summarization
  - Test: Prompt output format tests
- [ ] Implement evidence linking utility (depends on: claim table)
  - Acceptance: Claims link to source messages
  - Test: Link creation and retrieval

**Exit Criteria**: Agent skeleton working

**Delivers**: Foundation for intelligence extraction

---

### Phase 3.1: Classification Pipeline
**Goal**: Implement thread classification

**Entry Criteria**: Phase 3.0 complete

**Tasks**:
- [ ] Implement intent classifier (depends on: prompts)
  - Acceptance: Classifies threads into intent categories
  - Test: Each intent type with examples
- [ ] Implement urgency scorer (depends on: prompts)
  - Acceptance: Scores 0-1 with reasoning
  - Test: Low, medium, high urgency examples
- [ ] Implement sentiment analyzer (depends on: prompts)
  - Acceptance: Per-message sentiment, trend detection
  - Test: Positive, negative, escalating threads
- [ ] Implement thread type detector (depends on: thread analysis)
  - Acceptance: Identifies thread structure
  - Test: All thread types

**Exit Criteria**: Classification pipeline working

**Delivers**: Thread metadata enrichment

---

### Phase 3.2: Extraction Pipeline
**Goal**: Implement claim extraction

**Entry Criteria**: Phase 3.1 complete

**Tasks**:
- [ ] Implement fact extractor (depends on: prompts)
  - Acceptance: Extracts factual statements
  - Test: Various fact types
- [ ] Implement promise detector (depends on: prompts)
  - Acceptance: Detects commitment language
  - Test: Explicit and implicit promises
- [ ] Implement request detector (depends on: prompts)
  - Acceptance: Detects request patterns
  - Test: Direct and indirect requests
- [ ] Implement question identifier (depends on: prompts)
  - Acceptance: Finds all questions
  - Test: Explicit, implicit, rhetorical
- [ ] Implement decision detector (depends on: prompts)
  - Acceptance: Finds decision statements
  - Test: Approvals, rejections, choices

**Exit Criteria**: Full claim extraction working

**Delivers**: Structured claims from threads

---

### Phase 3.3: Generation Pipeline
**Goal**: Implement summaries and open loop detection

**Entry Criteria**: Phase 3.2 complete

**Tasks**:
- [ ] Implement brief generator (depends on: classifiers, extractors)
  - Acceptance: 3-line summary with key points
  - Test: Various thread types
- [ ] Implement timeline generator (depends on: extractors)
  - Acceptance: Chronological event list
  - Test: Simple and complex threads
- [ ] Implement open loop detector (depends on: question identifier)
  - Acceptance: Finds unanswered questions
  - Test: Matched and unmatched questions
- [ ] Implement waiting-on analyzer (depends on: promise detector)
  - Acceptance: Identifies blocking items
  - Test: Clear and ambiguous cases

**Exit Criteria**: Full generation pipeline working

**Delivers**: Thread briefs and open loops

---

### Phase 3.4: Integration
**Goal**: Connect agent to system

**Entry Criteria**: Phase 3.3 complete

**Tasks**:
- [ ] Create Trigger.dev analysis task (depends on: agent)
  - Acceptance: Processes threads from sync events
  - Test: New thread, updated thread
- [ ] Implement batch processing (depends on: analysis task)
  - Acceptance: Efficient batch analysis
  - Test: 100 thread batch
- [ ] Create threads API router (depends on: agent)
  - Acceptance: Query thread intelligence
  - Test: Get brief, get claims, get open loops
- [ ] Implement confidence override API (depends on: router)
  - Acceptance: Users can correct extractions
  - Test: Override and feedback loop

**Exit Criteria**: Agent integrated and accessible

**Delivers**: Production-ready thread understanding

</implementation-roadmap>

---

<test-strategy>

## Test Pyramid

```
        /\
       /E2E\       ← 10% (Full analysis flows)
      /------\
     /Integration\ ← 30% (Agent + DB + LLM mocks)
    /------------\
   /  Unit Tests  \ ← 60% (Classifiers, extractors, parsers)
  /----------------\
```

## Coverage Requirements
- Line coverage: 80% minimum
- Branch coverage: 75% minimum
- Function coverage: 85% minimum

## Critical Test Scenarios

### Classification (classifiers/)
**Happy path**:
- Approval request email → approval_request classification
- Scheduling thread → scheduling classification
- Expected: Correct classification with high confidence

**Edge cases**:
- Mixed intent thread (scheduling + request)
- Thread with no clear intent
- Non-English content
- Expected: Reasonable classification, lower confidence

**Error cases**:
- Empty thread
- Single-word message
- Expected: Handle gracefully, return unknown

### Claim Extraction (extractors/)
**Happy path**:
- "I will send the report by Friday" → Promise claim
- "Can you review this?" → Request claim
- Expected: Correct claim type, evidence linked

**Edge cases**:
- Conditional promises ("I could send...")
- Implicit requests (no question mark)
- Multiple claims in one sentence
- Expected: Appropriate handling

**Error cases**:
- Garbled text
- Image-only message
- Expected: No false positives

### Brief Generation (generators/)
**Happy path**:
- 10-message thread → 3-line brief
- Expected: Captures essence, mentions key actors

**Edge cases**:
- 1-message thread
- 100-message thread
- Thread with no clear topic
- Expected: Appropriate length brief

## Test Generation Guidelines
- Create golden test set with human-labeled threads
- Test with real (anonymized) email examples
- Include non-English and mixed-language tests
- Benchmark LLM consistency across runs

</test-strategy>

---

<architecture>

## System Components

### AI Provider Integration
- Use Vercel AI SDK for LLM calls
- Support multiple providers (Claude, GPT-4)
- Implement fallback chains

### Prompt Engineering
- Structured output with JSON schemas
- Few-shot examples for consistency
- Chain-of-thought for complex analysis

### Processing Pipeline
- Parallel classification and extraction
- Sequential summarization (needs extraction)
- Streaming results where possible

## Agent Architecture

```typescript
class ThreadUnderstandingAgent {
  // Main entry point
  async analyze(thread: EmailThread): Promise<ThreadAnalysis> {
    // 1. Run classifiers in parallel
    const [intent, urgency, sentiment, threadType] = await Promise.all([
      this.classifyIntent(thread),
      this.scoreUrgency(thread),
      this.analyzeSentiment(thread),
      this.detectThreadType(thread),
    ]);

    // 2. Extract claims from each message
    const claims = await this.extractClaims(thread.messages);

    // 3. Detect open loops
    const openLoops = await this.detectOpenLoops(claims);

    // 4. Generate brief (needs all above)
    const brief = await this.generateBrief(thread, {
      intent, urgency, sentiment, claims, openLoops
    });

    // 5. Return complete analysis
    return {
      threadId: thread.id,
      classification: { intent, urgency, sentiment, threadType },
      claims,
      openLoops,
      brief,
      processedAt: new Date(),
    };
  }
}
```

## Prompt Structure

```typescript
// Classification prompt example
const intentClassificationPrompt = `
You are analyzing an email thread to determine its primary intent.

Thread:
{thread_content}

Classify into ONE of these categories:
- approval_request: Seeking approval or sign-off
- negotiation: Back-and-forth on terms/details
- scheduling: Arranging meetings or timelines
- information_sharing: Sharing updates or information
- question: Asking for information
- task_assignment: Assigning work to someone
- feedback: Providing feedback or review
- complaint: Expressing dissatisfaction
- other: Doesn't fit other categories

Respond with JSON:
{
  "intent": "<category>",
  "confidence": <0-1>,
  "reasoning": "<brief explanation>"
}
`;
```

## Technology Decisions

### Decision: Claude as primary LLM
- **Rationale**: Strong reasoning, good at structured output, existing integration
- **Trade-offs**: API cost, latency
- **Alternatives considered**: GPT-4 (similar), open source (lower quality)

### Decision: Parallel classification
- **Rationale**: Faster overall processing, independent analyses
- **Trade-offs**: Higher concurrent API calls
- **Alternatives considered**: Sequential (slower)

### Decision: JSON structured output
- **Rationale**: Reliable parsing, type safety
- **Trade-offs**: Prompt complexity
- **Alternatives considered**: Free text (parsing errors)

</architecture>

---

<risks>

## Technical Risks

### Risk: LLM hallucination in extraction
- **Impact**: High - false claims created
- **Likelihood**: Medium - known LLM weakness
- **Mitigation**: Require quoted evidence, confidence thresholds
- **Fallback**: Human review queue for low confidence

### Risk: Processing cost at scale
- **Impact**: Medium - high API costs
- **Likelihood**: High - many threads to process
- **Mitigation**: Batch processing, caching, model selection
- **Fallback**: Tiered processing (new threads only)

### Risk: Prompt injection via email content
- **Impact**: High - security vulnerability
- **Likelihood**: Low - requires malicious sender
- **Mitigation**: Input sanitization, output validation
- **Fallback**: Manual review of suspicious results

## Dependency Risks

### Risk: LLM provider outage
- **Impact**: High - no analysis possible
- **Likelihood**: Low - reliable providers
- **Mitigation**: Multi-provider fallback
- **Fallback**: Queue for later processing

## Scope Risks

### Risk: Accuracy expectations too high
- **Impact**: Medium - user disappointment
- **Likelihood**: Medium - AI isn't perfect
- **Mitigation**: Set expectations, show confidence
- **Fallback**: Easy correction mechanisms

</risks>

---

<appendix>

## References

- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [Email Classification Research](https://arxiv.org/abs/...)

## Glossary

| Term | Definition |
|------|------------|
| **Claim** | Atomic fact or statement extracted from email |
| **Intent** | Primary purpose of a thread |
| **Open Loop** | Unanswered question or pending item |
| **Brief** | 3-line summary of thread |
| **Evidence Link** | Connection between claim and source message |

## Open Questions

1. **Multi-language support**: Translate before analysis or use multilingual models?
2. **Historical analysis**: Process all existing threads or only new?
3. **Feedback loop**: How to incorporate user corrections into model?

</appendix>

---

<task-master-integration>

## Task Extraction Summary

### Phase 3.0 Tasks
1. `agent-thread-understanding-skeleton` - Create agent class
2. `agent-claim-types` - Define claim types and schemas
3. `agent-prompts-foundation` - Create prompt templates
4. `agent-evidence-linking` - Implement evidence linking

### Phase 3.1 Tasks
5. `classifier-intent` - Implement intent classifier
6. `classifier-urgency` - Implement urgency scorer
7. `classifier-sentiment` - Implement sentiment analyzer
8. `classifier-thread-type` - Implement thread type detector

### Phase 3.2 Tasks
9. `extractor-facts` - Implement fact extractor
10. `extractor-promises` - Implement promise detector
11. `extractor-requests` - Implement request detector
12. `extractor-questions` - Implement question identifier
13. `extractor-decisions` - Implement decision detector

### Phase 3.3 Tasks
14. `generator-brief` - Implement brief generator
15. `generator-timeline` - Implement timeline generator
16. `detector-open-loops` - Implement open loop detector
17. `analyzer-waiting-on` - Implement waiting-on analyzer

### Phase 3.4 Tasks
18. `trigger-thread-analysis` - Create Trigger.dev task
19. `trigger-batch-analysis` - Implement batch processing
20. `api-threads-router` - Create threads API router
21. `api-confidence-override` - Implement confidence override

### Dependencies
```
PRD-02 (Email Sync)
  → agent-thread-understanding-skeleton
    → agent-claim-types, agent-prompts-foundation
      → agent-evidence-linking
        → classifier-intent, classifier-urgency
        → classifier-sentiment, classifier-thread-type
          → extractor-facts → extractor-promises, extractor-requests
            → extractor-questions → extractor-decisions
              → generator-brief, generator-timeline
                → detector-open-loops, analyzer-waiting-on
                  → trigger-thread-analysis → trigger-batch-analysis
                    → api-threads-router → api-confidence-override
```

</task-master-integration>
