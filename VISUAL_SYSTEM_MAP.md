# 9JA AI Visual System Map

Quick visual guide to understand the entire system at a glance.

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  https://9jai.web.app                                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  GeneralAssistant.tsx (Main UI Component)              │    │
│  │  • Handles user input                                   │    │
│  │  • Detects feature type (chat/image/video/voice)       │    │
│  │  • Displays results                                     │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                         │
│  ┌─────────────────────▼──────────────────────────────────┐    │
│  │  src/lib/ai.ts (AI Integration)                        │    │
│  │  • unifiedChatStream()                                  │    │
│  │  • transcribeWithWhisper()                             │    │
│  │  • translateAndSpeak()                                  │    │
│  └─────────────────────┬──────────────────────────────────┘    │
│                        │                                         │
│  ┌─────────────────────▼──────────────────────────────────┐    │
│  │  src/lib/aiProxy.ts (API Client)                       │    │
│  │  • proxyChat()        → POST /api/v1/chat              │    │
│  │  • proxyImage()       → POST /api/v1/image/generate    │    │
│  │  • proxyVideo()       → POST /api/v1/video/process     │    │
│  │  • proxyVision()      → POST /api/v1/vision/analyze    │    │
│  │  • proxyTranscribe()  → POST /api/v1/speech/transcribe │    │
│  │  • proxySearch()      → POST /api/v1/search            │    │
│  └─────────────────────┬──────────────────────────────────┘    │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         │ HTTPS Request
                         │
┌────────────────────────▼──────────────────────────────────────┐
│                  FIREBASE HOSTING                              │
│  https://9jai.web.app                                         │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  firebase.json (Rewrites Configuration)              │    │
│  │  /api/v1/chat          → aiChat function             │    │
│  │  /api/v1/stream        → aiStream function           │    │
│  │  /api/v1/image/*       → v1ImageGenerate function    │    │
│  │  /api/v1/video/*       → v1VideoProcess function     │    │
│  │  /api/v1/vision/*      → aiVision function           │    │
│  │  /api/v1/speech/*      → aiTranscribe function       │    │
│  │  /api/v1/search        → aiSearch function           │    │
│  │  /api/v1/ocr           → v1Ocr function              │    │
│  │  /api/v1/documents/*   → v1Document function         │    │
│  │  /api/v1/plugins/*     → v1PluginRegistry function   │    │
│  │  /api/v1/connectors/*  → v1ConnectorRegistry         │    │
│  │  /api/v1/health        → aiHealth function           │    │
│  └────────────────────────┬─────────────────────────────┘    │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              │ Function Call
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│              FIREBASE CLOUD FUNCTIONS (us-central1)            │
│  23 Functions Deployed                                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  functions/src/index.ts (Function Handlers)          │     │
│  │  • aiChat()           - Non-streaming chat           │     │
│  │  • aiStream()         - Streaming chat (SSE)         │     │
│  │  • v1ImageGenerate()  - Image generation             │     │
│  │  • v1VideoProcess()   - Video (unavailable)          │     │
│  │  • aiVision()         - Image analysis               │     │
│  │  • aiTranscribe()     - Speech-to-text               │     │
│  │  • aiSearch()         - Web search                   │     │
│  │  • v1Ocr()            - OCR text extraction          │     │
│  │  • aiHealth()         - Provider status              │     │
│  └────────────────────────┬─────────────────────────────┘     │
│                            │                                    │
│  ┌────────────────────────▼─────────────────────────────┐     │
│  │  functions/src/router.ts (Intelligent Routing)       │     │
│  │  • routeChat()        - Provider chain selection     │     │
│  │  • routeImage()       - Image provider routing       │     │
│  │  • routeTranscribe()  - Transcription routing        │     │
│  │  • routeSearch()      - Search provider routing      │     │
│  │  • Failover logic     - Auto-retry on failure        │     │
│  │  • Health monitoring  - Track provider status        │     │
│  └────────────────────────┬─────────────────────────────┘     │
└─────────────────────────────┼──────────────────────────────────┘
                              │
                              │ Provider Selection
                              │
┌─────────────────────────────▼──────────────────────────────────┐
│                    PROVIDER LAYER                               │
│  functions/src/providers/*.ts                                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  🆓 FREE PROVIDERS (No API Key Required)            │      │
│  │                                                       │      │
│  │  ollama.ts         → Ollama (Local AI)              │      │
│  │    • Chat: llama3.2, llama3.1, gemma2               │      │
│  │    • Vision: llama3.2-vision                         │      │
│  │    • Requires: ollama serve + model pulled           │      │
│  │    • Cost: $0 (local inference)                      │      │
│  │                                                       │      │
│  │  pollinations.ts   → Pollinations AI                │      │
│  │    • Image generation (multiple models)              │      │
│  │    • Cost: $0 (public API)                          │      │
│  │                                                       │      │
│  │  weather.ts        → Open-Meteo API                 │      │
│  │    • Weather data, forecasts, geocoding             │      │
│  │    • Cost: $0 (free weather API)                    │      │
│  │                                                       │      │
│  │  time.ts           → Node.js Built-in               │      │
│  │    • Current time, timezone conversion               │      │
│  │    • Cost: $0 (built-in)                            │      │
│  │                                                       │      │
│  │  duckduckgo.ts     → DuckDuckGo Search              │      │
│  │    • Web search, no API key                          │      │
│  │    • Cost: $0 (free search)                         │      │
│  │                                                       │      │
│  │  tesseract.ts      → Tesseract OCR                  │      │
│  │    • Text extraction from images                     │      │
│  │    • Cost: $0 (open source library)                 │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  💳 PAID PROVIDERS (API Key Required)               │      │
│  │                                                       │      │
│  │  groq.ts           → Groq API                        │      │
│  │    • Chat: llama-3.3-70b, llama-3.1-8b              │      │
│  │    • Transcription: Whisper                          │      │
│  │    • Cost: Free tier available                       │      │
│  │    • Secret: GROQ_KEY                                │      │
│  │                                                       │      │
│  │  openrouter.ts     → OpenRouter API                 │      │
│  │    • Chat: 200+ models                               │      │
│  │    • Vision: GPT-4V, Claude-3-Vision                │      │
│  │    • Cost: Free tier + paid models                   │      │
│  │    • Secret: OPENROUTER_KEY                          │      │
│  │                                                       │      │
│  │  together.ts       → Together AI                    │      │
│  │    • Chat: Open source models                        │      │
│  │    • Image: Stable Diffusion variants                │      │
│  │    • Cost: Paid                                      │      │
│  │    • Secret: TOGETHER_KEY                            │      │
│  │                                                       │      │
│  │  deepseek.ts       → DeepSeek API                   │      │
│  │    • Chat: DeepSeek-V3 (reasoning)                  │      │
│  │    • Cost: Paid                                      │      │
│  │    • Secret: DEEPSEEK_KEY                            │      │
│  │                                                       │      │
│  │  mistral.ts        → Mistral AI                     │      │
│  │    • Chat: Mistral models                            │      │
│  │    • Cost: Paid                                      │      │
│  │    • Secret: MISTRAL_KEY                             │      │
│  │                                                       │      │
│  │  huggingface.ts    → Hugging Face                   │      │
│  │    • Chat: Various open models                       │      │
│  │    • Cost: Free tier available                       │      │
│  │    • Secret: HF_KEY                                  │      │
│  │                                                       │      │
│  │  tavily.ts         → Tavily Search                  │      │
│  │    • Advanced web search                             │      │
│  │    • Cost: Paid                                      │      │
│  │    • Secret: TAVILY_KEY                              │      │
│  └──────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FEATURE FLOWS

### Chat Flow
```
User types message
  ↓
GeneralAssistant.tsx → sendMessage()
  ↓
unifiedChatStream(messages)
  ↓
proxyChat({ messages })
  ↓
POST /api/v1/chat
  ↓
aiChat function
  ↓
routeChat()
  ↓
Provider Chain:
  1️⃣ Ollama (FREE, local) ✅
  2️⃣ Groq (fallback)
  3️⃣ OpenRouter (fallback)
  4️⃣ DeepSeek (fallback)
  5️⃣ Mistral (fallback)
  6️⃣ HuggingFace (fallback)
  ↓
Response: { text, provider, model }
  ↓
Display to user
```

### Image Generation Flow
```
User types "generate image of..."
  ↓
isImageRequest() → TRUE
  ↓
extractImagePrompt()
  ↓
ImageBubble component
  ↓
proxyImage(prompt)
  ↓
POST /api/v1/image/generate
  ↓
v1ImageGenerate function
  ↓
routeImage()
  ↓
pollinationsWithFallback() ✅ (FREE)
  ↓
Response: { imageBase64, provider }
  ↓
Display image
```

### Voice Transcription Flow
```
User records audio
  ↓
Voice recording stops
  ↓
transcribeWithWhisper(audioBlob)
  ↓
proxyTranscribe(audioBlob)
  ↓
POST /api/v1/speech/transcribe
  ↓
aiTranscribe function
  ↓
routeTranscribe()
  ↓
groqTranscribe() (Whisper)
  ↓
Response: { text }
  ↓
Display transcribed text
```

### Weather Query Flow
```
User asks "What's the weather in Lagos?"
  ↓
Backend detects weather request
  ↓
routeSearch() triggered
  ↓
duckduckgoSearchWithRetry() ✅ (FREE)
  ↓
Search results → Context
  ↓
Context injected into chat
  ↓
AI responds with current weather
```

---

## 🆓 FREE-FIRST PRIORITY CHAIN

### Chat
```
Priority 1: Ollama        (FREE, local, no key)  ← BEST
Priority 2: Groq          (free tier, needs key)
Priority 3: OpenRouter    (free tier, needs key)
Priority 4: DeepSeek      (paid, needs key)
Priority 5: Mistral       (paid, needs key)
Priority 6: HuggingFace   (free tier, needs key)
```

### Image
```
Only Option: Pollinations (FREE, no key)  ← ALWAYS WORKS
```

### Search
```
Priority 1: DuckDuckGo    (FREE, no key)  ← BEST
Priority 2: Tavily        (paid, needs key)
```

### Weather
```
Only Option: Open-Meteo   (FREE, no key)  ← ALWAYS WORKS
```

### Time
```
Only Option: Node.js      (FREE, built-in) ← ALWAYS WORKS
```

### OCR
```
Priority 1: Tesseract     (FREE, no key)   ← BEST
Priority 2: OpenRouter    (paid, needs key)
```

### Transcription
```
Only Option: Groq Whisper (free tier, needs key)
```

---

## 🎯 CRITICAL CHECKPOINTS

### Checkpoint 1: Is Ollama Installed?
```
YES → Chat is 100% FREE (local inference)
NO  → Chat uses paid providers (Groq → OpenRouter)
```

**How to check**:
1. Test chat feature
2. Look at response: `provider: "ollama"` = SUCCESS
3. Or check: `curl http://localhost:11434/api/tags` (from backend)

---

### Checkpoint 2: Which API Keys Are Configured?
```
GROQ_KEY        → Enables: Chat fallback, Transcription
OPENROUTER_KEY  → Enables: Chat fallback, Vision
TOGETHER_KEY    → Enables: Chat fallback, Image fallback
DEEPSEEK_KEY    → Enables: Chat fallback (reasoning)
MISTRAL_KEY     → Enables: Chat fallback
HF_KEY          → Enables: Chat fallback (last resort)
TAVILY_KEY      → Enables: Search fallback
```

**How to check**:
```bash
curl https://9jai.web.app/api/v1/health | jq '.providers'
```

---

### Checkpoint 3: Are Firebase Rewrites Working?
```
WORKING:   /api/v1/* → 200 OK (function responds)
BROKEN:    /api/v1/* → 404 Not Found (rewrite failed)
```

**How to check**: Network tab shows response codes

---

### Checkpoint 4: Is Frontend Calling Correct Endpoints?
```
CORRECT:   POST /api/v1/chat (v1 endpoints)
INCORRECT: POST /api/ai/chat (old endpoints still work but v1 is primary)
```

**How to check**: Network tab shows request URLs

---

## 📊 TESTING PRIORITY

### Priority 1: Core Features (Must Work)
1. ✅ **Chat** - If this doesn't work, app is unusable
2. ✅ **Image** - Second most important feature

### Priority 2: Enhanced Features (Should Work)
3. ✅ **Search** (Weather/Time queries)
4. ✅ **Translation**

### Priority 3: Advanced Features (Nice to Have)
5. ✅ **Voice Transcription**
6. ✅ **Vision** (Image Analysis)
7. ✅ **OCR**

### Priority 4: Expected Unavailable
8. ❌ **Video** - Should show error (no free providers)

---

## 🎨 DEPLOYMENT STATUS

```
FRONTEND:  ✅ Deployed to https://9jai.web.app
BACKEND:   ✅ 23 Functions deployed to us-central1
DATABASE:  ✅ Firestore configured
STORAGE:   ✅ Firebase Storage configured
REWRITES:  ❓ Need to verify working
PROVIDERS: ❓ Need to verify availability
```

---

## 🚦 SYSTEM STATUS INDICATORS

### Green Light (Ready for UI) ✅
- All core features work
- FREE providers operational
- No critical errors
- User can chat and generate images

### Yellow Light (Mostly Ready) 🟡
- Core features work
- Some paid fallbacks needed (Ollama missing)
- Minor issues present
- Acceptable for production

### Red Light (Not Ready) ❌
- Core features broken
- Major connection issues
- Systematic problems
- Must fix before UI work

---

## 📍 YOU ARE HERE

```
Phase 1: Build & Deploy        ✅ COMPLETE
Phase 2: Code Analysis          ✅ COMPLETE
Phase 3: Test Preparation       ✅ COMPLETE
Phase 4: Live Testing           ← YOU ARE HERE
Phase 5: Fix Issues             ⬜ Pending results
Phase 6: UI Implementation      ⬜ After verification
Phase 7: Final Deployment       ⬜ Last step
```

---

## 🎯 NEXT ACTION

**Test the live application**: https://9jai.web.app

Use `LIVE_APPLICATION_TEST_PLAN.md` as your guide.

Document findings in `TEST_RESULTS_TEMPLATE.md`.

Report back with results.

Then we decide: Fix issues OR Implement UI.

---

**Visual guide complete. Ready for testing! 🚀**
