# 9JA AI Core Platform Architecture

## Overview

The 9JA AI platform is built on a robust, scalable architecture that provides intelligent routing, automatic failover, semantic knowledge retrieval, and persistent memory across all AI features.

## Architecture Layers

### 1. **Provider Registry** (`src/lib/platform/providerRegistry.ts`)

Multi-provider health tracking and intelligent routing system.

**Features:**
- ✅ Real-time health monitoring for all AI providers
- ✅ Automatic failover when providers go offline
- ✅ Priority-based provider selection
- ✅ Latency tracking and performance metrics
- ✅ Support for multiple capabilities (chat, vision, speech, image, search)

**Supported Providers:**
1. **Firebase Proxy** (Priority 0 - highest)
   - All capabilities via secure Cloud Functions
   - No API keys exposed to client
2. **Groq** (Priority 1)
   - Chat, Speech (Whisper)
   - Fast inference
3. **OpenRouter** (Priority 2)
   - Chat, Vision
   - Free tier available
4. **Together AI** (Priority 3)
   - Chat, Image, Vision
5. **DeepSeek** (Priority 4)
   - Chat

**Health States:**
- `healthy` — Provider is operational (0-1 failures)
- `degraded` — Provider experiencing issues (2-4 failures)
- `offline` — Provider unavailable (5+ failures)

**Auto-Recovery:**
- Degraded providers auto-recover after 5 minutes of no failures
- Offline providers auto-recover after 10 minutes
- Health checks run every 2 minutes

**Usage:**
```typescript
import { providerRegistry } from '@/lib/platform';

// Select best provider for a capability
const provider = providerRegistry.selectProvider('chat');

// Record success
providerRegistry.recordSuccess('groq', 150); // 150ms latency

// Record failure
providerRegistry.recordFailure('groq', 'Connection timeout');

// Get diagnostics
const diagnostics = providerRegistry.getDiagnostics('chat');
console.log(diagnostics.offlineMode); // true if < 20% providers healthy
```

---

### 2. **Recovery Service** (`src/lib/platform/recoveryService.ts`)

Request queue management and automatic retry logic.

**Features:**
- ✅ Failed request queueing
- ✅ Automatic retry with exponential backoff
- ✅ Priority-based request processing
- ✅ Persistent queue (survives page reload)
- ✅ Queue overflow protection
- ✅ Background queue processor

**Queue Management:**
- Max queue size: 100 requests
- Max retries per request: 3
- Retry delay: 30 seconds
- Batch processing: 5 requests at a time
- Auto-cleanup: Drops requests older than 24 hours

**Priority Levels:**
- `high` — Processed first
- `normal` — Standard processing
- `low` — Processed last

**Usage:**
```typescript
import { recoveryService } from '@/lib/platform';

// Enqueue a failed request
recoveryService.enqueueRequest({
  id: 'req_123',
  messages: [{ role: 'user', content: 'Hello' }],
  capability: 'chat',
  createdAt: Date.now(),
  priority: 'normal',
});

// Get queue status
const status = recoveryService.getQueueStatus();
console.log(`Queue length: ${status.queueLength}`);
console.log(`Total retries: ${status.totalRetries}`);

// Manually retry all queued requests
await recoveryService.retryAll();

// Clear the queue
recoveryService.clearQueue();
```

---

### 3. **Knowledge Engine** (`src/lib/platform/knowledgeEngine.ts`)

Semantic search and contextual knowledge retrieval system.

**Features:**
- ✅ Lightweight TF-IDF-based embeddings (no external dependencies)
- ✅ Semantic similarity search
- ✅ Multi-language support (Nigerian languages + English)
- ✅ Dual storage: localStorage + Firestore
- ✅ Automatic vocabulary building
- ✅ Category-based filtering

**Knowledge Types:**
- `vocab` — Vocabulary entries
- `grammar` — Grammar rules
- `cultural` — Cultural context
- `conversation` — Conversation history
- `document` — Extracted document content

**Embedding Process:**
1. Text tokenization and normalization
2. TF-IDF vector generation (64 dimensions)
3. Vector normalization
4. Cosine similarity for matching

**Usage:**
```typescript
import { knowledgeEngine } from '@/lib/platform';

// Initialize (called automatically on platform init)
await knowledgeEngine.initialize();

// Add knowledge entry
await knowledgeEngine.addEntry(
  'Koyọ means hello in Edo language',
  {
    type: 'vocab',
    language: 'edo',
    category: 'greetings',
    confidence: 0.95,
    timestamp: Date.now(),
  },
  userId // optional, for personal knowledge
);

// Semantic search
const results = await knowledgeEngine.search('how to say hello in Edo', {
  type: 'vocab',
  language: 'edo',
  topK: 5,
  minSimilarity: 0.5,
});

results.forEach(r => {
  console.log(`${r.entry.content} (similarity: ${r.similarity})`);
});

// Get stats
const stats = knowledgeEngine.getStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`By type:`, stats.byType);
console.log(`By language:`, stats.byLanguage);
```

---

### 4. **Memory System** (`src/lib/memorySystem.ts`)

Long-term user memory and personalization.

**Features:**
- ✅ User preference tracking
- ✅ Conversation summaries
- ✅ Learning progress
- ✅ Feedback history
- ✅ Fact extraction from conversations
- ✅ Topic detection

**Memory Types:**
- **Preferences** — Language, response style, interests
- **Facts** — Personal information learned from conversations
- **Summaries** — Condensed conversation history
- **Progress** — Language learning advancement
- **Feedback** — Ratings and corrections

**Usage:**
```typescript
import { loadUserMemory, updateMemoryFact, buildMemoryContext } from '@/lib/memorySystem';

// Load user memory
const memory = await loadUserMemory(userId);

// Add a fact
await updateMemoryFact(userId, {
  fact: 'User is learning Yoruba',
  confidence: 0.9,
  source: 'explicit',
  category: 'language',
});

// Build context for AI
const context = buildMemoryContext(memory);
// Inject this into system prompts for personalized responses
```

---

## Integration Flow

### Chat Request Flow

```
User Input
    ↓
[SuperEcosystem Component]
    ↓
[unifiedChatStream]
    ↓
[proxyChat] → Firebase Cloud Function → Provider API
    ↓
Success? → [Provider Registry: recordSuccess]
    ↓
Failure? → [Provider Registry: recordFailure]
           [Recovery Service: enqueueRequest]
           [Select Next Provider & Retry]
    ↓
Response → [Memory System: extractFacts]
         → [Knowledge Engine: addEntry]
         → [User Display]
```

### Knowledge Retrieval Flow

```
User Query
    ↓
[Knowledge Engine: search]
    ↓
[Generate Query Embedding]
    ↓
[Calculate Similarity to All Entries]
    ↓
[Rank by Similarity]
    ↓
[Filter by Type/Language/Threshold]
    ↓
Return Top K Results
    ↓
[Inject into AI Context]
```

---

## Platform Diagnostics

View real-time platform status with the `PlatformStatus` component:

```typescript
import { PlatformStatus } from '@/components/PlatformStatus';

// Add to any page
<PlatformStatus />
```

Shows:
- Provider health (healthy/degraded/offline)
- Average latency per provider
- Success/failure counts
- Recovery queue status
- Knowledge engine statistics

---

## Firestore Collections

### `global_knowledge`
Public knowledge base accessible to all users.
```typescript
{
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: 'vocab' | 'grammar' | 'cultural' | 'conversation' | 'document';
    language: string;
    confidence: number;
    timestamp: number;
  };
}
```

### `user_knowledge`
Personal knowledge entries per user.
```typescript
{
  id: string;
  content: string;
  embedding: number[];
  metadata: { ... };
  userId: string;
}
```

### `user_memory`
Long-term user memory and preferences.
```typescript
{
  userId: string;
  preferences: { ... };
  facts: MemoryFact[];
  conversationSummaries: ConversationSummary[];
  learningProgress: Record<string, LearningProgress>;
  feedbackHistory: FeedbackEntry[];
}
```

---

## Performance Considerations

### Client-Side
- **Knowledge Engine**: Lightweight TF-IDF, ~64KB per 1000 entries
- **Provider Registry**: ~2KB memory footprint
- **Recovery Queue**: Persisted in localStorage, auto-cleanup
- **Memory Cache**: 5-minute TTL, localStorage fallback

### Server-Side (Firestore)
- **Knowledge entries**: Indexed by `type` and `language`
- **User memory**: Single document per user
- **Chat sessions**: Partitioned by user
- **Auto-cleanup**: Scheduled Cloud Function for old data

---

## Future Enhancements

### Planned Features
- [ ] **Vector Database Integration** — Pinecone/Weaviate for scale
- [ ] **Distributed Model Runtime** — Self-hosted model inference
- [ ] **Advanced RAG** — Retrieval-Augmented Generation
- [ ] **Multi-modal Embeddings** — Image + text embeddings
- [ ] **Knowledge Graph** — Entity relationships
- [ ] **Federated Learning** — Cross-user learning without PII exposure
- [ ] **Edge Inference** — WebGPU for client-side models

---

## Development

### Run locally
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Deploy
```bash
# Deploy Firestore rules
npx firebase deploy --only firestore:rules

# Deploy app
npx firebase deploy --only hosting
```

---

## Testing

### Manual Testing Checklist
- [ ] Provider failover (disable network to simulate offline)
- [ ] Recovery queue (submit requests while offline, reconnect)
- [ ] Knowledge search (add entries, search semantically)
- [ ] Memory persistence (refresh page, check memory retained)
- [ ] Platform diagnostics (view status panel)

### Automated Tests (TODO)
- Unit tests for embeddings, similarity
- Integration tests for provider registry
- E2E tests for chat flow

---

## Documentation

- **Architecture**: `PLATFORM.md` (this file)
- **API Reference**: See JSDoc comments in source files
- **User Guide**: `README.md`
- **Deployment**: `DEPLOYMENT.md`

---

Built with ❤️ in Nigeria 🇳🇬
