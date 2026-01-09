# PRD-06: Search & Knowledge Engine

> Agent 5: Semantic Search (pgvector) and Personal Knowledge

---

## Document Information

| Field | Value |
|-------|-------|
| **PRD ID** | PRD-06 |
| **Title** | Search & Knowledge Engine |
| **Phase** | 3 - Intelligence Services |
| **Dependencies** | PRD-00 (pgvector), PRD-03, PRD-04 |
| **Dependent PRDs** | PRD-08, PRD-09, PRD-10 |
| **Agent Number** | 5 of 8 |
| **Status** | Draft |
| **Author** | MEMORYSTACK Team |

---

<overview>

## Problem Statement

Traditional email search finds keywords, not meaning:

1. **Keyword limitations** - Can't search "What did we decide about pricing?"
2. **Scattered knowledge** - Insights buried across thousands of threads
3. **No learning** - System doesn't understand patterns over time
4. **Missing connections** - Can't find related discussions automatically

The Search & Knowledge Engine transforms email into a queryable knowledge base with semantic understanding.

## Target Users

### Primary: All Users
- "Ask My Email" queries in natural language
- Find related discussions automatically
- Extract patterns from history

### Secondary: Knowledge Workers
- Research company decisions
- Find precedents
- Build institutional memory

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Search relevance (MRR) | > 0.8 | Mean Reciprocal Rank |
| Query latency | < 3 seconds | Time to results |
| Citation accuracy | > 95% | Correct source links |
| User satisfaction | > 4/5 | Search result ratings |
| Pattern detection | > 80% | Identified patterns validated |

</overview>

---

<functional-decomposition>

## Capability Tree

### Capability: Vector Search Infrastructure
pgvector-powered semantic search.

#### Feature: Embedding Generation
- **Description**: Generate embeddings for all content
- **Inputs**: Message/thread/claim text
- **Outputs**: 1536-dim vector embedding
- **Behavior**: Call OpenAI embedding API, store in pgvector

#### Feature: Incremental Embedding
- **Description**: Generate embeddings as content arrives
- **Inputs**: New message/claim events
- **Outputs**: Embedding records
- **Behavior**: Queue for embedding, batch process

#### Feature: Similarity Search
- **Description**: Find similar content by vector
- **Inputs**: Query embedding, filters, limit
- **Outputs**: Ranked results with scores
- **Behavior**: pgvector cosine similarity, apply filters

#### Feature: Hybrid Search
- **Description**: Combine vector and keyword search
- **Inputs**: Query text, weights
- **Outputs**: Fused results
- **Behavior**: Run both, normalize scores, merge

---

### Capability: Natural Language Queries
Answer questions in natural language.

#### Feature: Query Understanding
- **Description**: Parse natural language queries
- **Inputs**: User query text
- **Outputs**: Structured query intent
- **Behavior**: Classify query type, extract entities, infer filters

#### Feature: Evidence Retrieval
- **Description**: Find relevant evidence for query
- **Inputs**: Parsed query
- **Outputs**: Relevant threads/messages/claims
- **Behavior**: Multi-index search, rank by relevance

#### Feature: Answer Generation
- **Description**: Generate answer from evidence
- **Inputs**: Query, retrieved evidence
- **Outputs**: Answer with citations
- **Behavior**: LLM synthesis, cite sources, include confidence

#### Feature: Follow-up Handling
- **Description**: Handle conversational follow-ups
- **Inputs**: Follow-up query, conversation context
- **Outputs**: Contextual answer
- **Behavior**: Maintain context, resolve references

---

### Capability: Personal Knowledge
Extract patterns and insights.

#### Feature: Pattern Detection
- **Description**: Identify recurring patterns in email
- **Inputs**: Thread history, topic clusters
- **Outputs**: Detected patterns with examples
- **Behavior**: Cluster similar situations, identify commonalities

#### Feature: Insight Generation
- **Description**: Surface proactive insights
- **Inputs**: Recent threads, historical patterns
- **Outputs**: Insight notifications
- **Behavior**: Compare new to historical, flag interesting patterns

#### Feature: Cross-Thread Connections
- **Description**: Find related discussions
- **Inputs**: Thread ID
- **Outputs**: Related threads with relevance
- **Behavior**: Semantic similarity across threads

#### Feature: Topic Summarization
- **Description**: Summarize everything about a topic
- **Inputs**: Topic query
- **Outputs**: Comprehensive summary with timeline
- **Behavior**: Gather all related, synthesize narrative

</functional-decomposition>

---

<structural-decomposition>

## Repository Structure

```
packages/ai/
├── src/
│   ├── agents/
│   │   ├── search.ts              # Search agent
│   │   └── knowledge.ts           # Knowledge agent
│   ├── embeddings/
│   │   ├── generator.ts           # Embedding generation
│   │   └── index.ts               # Vector operations
│   └── prompts/
│       └── search/
│           ├── query-understanding.ts
│           └── answer-generation.ts
apps/server/
└── src/
    └── trigger/
        └── embedding-generation.ts
packages/api/
└── src/
    └── routers/
        └── search.ts
```

## Module Definitions

### Module: packages/ai/src/embeddings/generator.ts
- **Maps to capability**: Vector Search Infrastructure
- **Exports**:
  - `generateEmbedding(text)`
  - `batchGenerateEmbeddings(texts)`

### Module: packages/ai/src/agents/search.ts
- **Maps to capability**: Natural Language Queries
- **Exports**:
  - `SearchAgent`
  - `search(query, options)`
  - `answerQuestion(query)`

### Module: packages/api/src/routers/search.ts
- **Exports**:
  - `searchRouter`
  - Procedures: search, ask, findRelated

</structural-decomposition>

---

<dependency-graph>

## Dependency Chain

### From PRD-00
- pgvector extension and tables
- Embedding schemas

### Embedding Pipeline (Phase 6.0)
- **generator.ts**: Depends on [OpenAI API]
- **embedding-generation.ts**: Depends on [generator, PRD-02 events]

### Search (Phase 6.1)
- **search.ts**: Depends on [embeddings, evidence tables]
- **answer generation**: Depends on [search, LLM]

### Knowledge (Phase 6.2)
- **knowledge.ts**: Depends on [search, PRD-03/04 data]
- **pattern detection**: Depends on [clustering, embeddings]

</dependency-graph>

---

<implementation-roadmap>

## Development Phases

### Phase 6.0: Embedding Infrastructure
**Goal**: Generate and store embeddings

**Tasks**:
- [ ] Implement embedding generation (OpenAI API)
- [ ] Create Trigger.dev embedding task
- [ ] Implement batch processing
- [ ] Create HNSW indexes

**Delivers**: Searchable vector index

---

### Phase 6.1: Search Implementation
**Goal**: Build semantic search

**Tasks**:
- [ ] Implement query understanding
- [ ] Implement similarity search
- [ ] Implement hybrid search
- [ ] Implement answer generation with citations

**Delivers**: "Ask My Email" functionality

---

### Phase 6.2: Knowledge Features
**Goal**: Extract patterns and insights

**Tasks**:
- [ ] Implement pattern detection
- [ ] Implement cross-thread connections
- [ ] Implement topic summarization
- [ ] Implement insight generation

**Delivers**: Proactive knowledge discovery

</implementation-roadmap>

---

<test-strategy>

## Critical Test Scenarios

### Embedding Generation
- New message → Embedding created
- Batch of 100 → All embedded efficiently

### Search
- "What did we decide about pricing?" → Decision records found
- Ambiguous query → Reasonable interpretation

### Answer Generation
- Question with clear answer → Accurate response with citation
- Question with no answer → "I couldn't find information"

</test-strategy>

---

<architecture>

## Vector Search Architecture

```
Query: "What did we decide about Stripe?"
         │
         ▼
    ┌─────────────────┐
    │ Query Embedding │
    └─────────────────┘
         │
         ▼
    ┌─────────────────────────────────────────┐
    │         pgvector Search                  │
    │  ┌───────────┐  ┌───────────┐           │
    │  │ Messages  │  │ Decisions │  ...      │
    │  │ Embeddings│  │ Embeddings│           │
    │  └───────────┘  └───────────┘           │
    └─────────────────────────────────────────┘
         │
         ▼
    ┌─────────────────┐
    │  Rank & Filter  │
    └─────────────────┘
         │
         ▼
    ┌─────────────────┐
    │ Answer with     │
    │ Citations       │
    └─────────────────┘
```

## Technology Decisions

### Decision: pgvector over external vector DB
- **Rationale**: Single database, transactional consistency
- **Trade-offs**: Scale ceiling (millions, not billions)
- **Alternatives**: Pinecone (separate infra)

### Decision: OpenAI embeddings
- **Rationale**: High quality, battle-tested
- **Trade-offs**: API cost, latency
- **Alternatives**: Open source (lower quality)

</architecture>

---

<risks>

## Technical Risks

### Risk: Embedding cost at scale
- **Impact**: Medium - high API bills
- **Likelihood**: High
- **Mitigation**: Batch processing, caching, model selection

### Risk: Search quality issues
- **Impact**: High - core feature
- **Likelihood**: Medium
- **Mitigation**: Hybrid search, relevance tuning

</risks>

---

<task-master-integration>

## Task Extraction Summary

### Phase 6.0 Tasks
1. `embedding-generator` - Embedding generation
2. `embedding-trigger-task` - Trigger.dev task
3. `embedding-batch-processing` - Batch support
4. `embedding-hnsw-indexes` - Index creation

### Phase 6.1 Tasks
5. `search-query-understanding` - Query parsing
6. `search-similarity` - Vector similarity
7. `search-hybrid` - Hybrid search
8. `search-answer-generation` - LLM answers

### Phase 6.2 Tasks
9. `knowledge-pattern-detection`
10. `knowledge-cross-thread`
11. `knowledge-topic-summary`
12. `knowledge-insights`

</task-master-integration>
