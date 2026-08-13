# 9JAI CONNECTION MAPPING: UI → API → Engine → Provider
**COMPLETE PATH ANALYSIS FOR OPTION 1 (RECONCILIATION DIRECTIVE)**

## EXECUTIVE SUMMARY

This document maps the complete data flow from UI interactions to provider execution, identifying **WORKING PATHS** vs **BROKEN PATHS** to guide FREE-FIRST restoration.

### **ARCHITECTURE DISCOVERED**:
- ✅ **Real UI exists**: `GeneralAssistant.tsx` and `SuperEcosystem.tsx` are fully implemented
- ✅ **Frontend service layer**: `aiProxy.ts`, `ai.ts`, `imageService.ts` handle API communication
- ✅ **Backend Firebase Functions**: 20 Cloud Functions in `functions/src/index.ts`
- ✅ **Provider system**: Multi-provider routing in `functions/src/router.ts`
- ⚠️ **Core engines**: Exist in `core/` but **NOT CONNECTED** to active data paths
- ⚠️ **All features require PAID APIs**: No free provider paths currently functional

---

## 1. CHAT FLOW (TEXT CONVERSATION)

### **PATH: UI → API → Backend → Provider**

```
USER TYPES MESSAGE IN GeneralAssistant.tsx
    ↓
unifiedChatStream() in src/lib/ai.ts
    ↓
_proxyChat() in src/lib/aiProxy.ts
    ↓
POST /api/v1/chat
    ↓
Firebase Function: aiChat in functions/src/index.ts
    ↓
routeChat() in functions/src/router.ts
    ↓
PROVIDER CHAIN (in order):
    1. Groq (PAID - free tier requires API key)
    2. OpenRouter (PAID)
    3. DeepSeek (PAID)
    4. Mistral (PAID)
    5. HuggingFace (free tier requires API key)
    ↓
executeChatProvider() → openRouterChatWithFallback()
    ↓
RESPONSE streamed back to UI
```

### **STATUS**: ❌ **BROKEN** (Requires paid/API-key providers)

**DEPENDENCIES**:
- Groq API key (GROQ_KEY secret)
- OpenRouter API key (OPENROUTER_KEY secret)
- Together AI (TOGETHER_KEY secret)
- DeepSeek (DEEPSEEK_KEY secret)
- Mistral (MISTRAL_KEY secret)
- HuggingFace (HF_KEY secret)

**CORE ENGINES NOT IN USE**:
- `core/engines/language/LanguageEngine.ts` exists but NOT called by active path
- `core/orchestrator/AIOrchestrator.ts` exists but NOT used in Firebase Functions

**FREE-FIRST FIX NEEDED**:
- Replace provider chain with **Ollama** (local, FREE, no API key)
- Or use **llama.cpp** with downloaded models
- Connect `core/engines/language/LanguageEngine.ts` if it has free capabilities

---

## 2. IMAGE GENERATION FLOW

### **PATH: UI → API → Backend → Provider**

```
USER TYPES "generate image of Lagos skyline"
    ↓
isImageRequest() detects image intent in GeneralAssistant.tsx
    ↓
extractImagePrompt() cleans prompt
    ↓
ImageBubble component renders
    ↓
generateImage() in src/lib/imageService.ts
    ↓
callImageBackend() → POST /api/v1/image/generate
    ↓
Firebase Function: aiImage in functions/src/index.ts
    ↓
routeImage() in functions/src/router.ts
    ↓
generateMedia() in functions/src/media/engine.ts
    ↓
PROVIDER ATTEMPT (NEW - post Task 1 fix):
    1. ✅ Pollinations (FREE, no key needed) ← WORKING
    2. ❌ HuggingFace (free tier, requires HF_KEY)
    3. ❌ OpenRouter (PAID, removed)
    4. ❌ Together AI (PAID, removed)
```

### **STATUS**: ✅ **WORKING** (Pollinations is FREE and requires no API key)

**CURRENT STATE**:
- ✅ Pollinations works without any API keys
- ✅ Returns direct image URLs (`https://image.pollinations.ai/prompt/...`)
- ✅ Frontend fallback chains also use Pollinations first

**NO CHANGES NEEDED** for images — already FREE-FIRST compliant!

**CORE ENGINES NOT IN USE**:
- `core/engines/image/ImageEngine.ts` exists but NOT connected

---

## 3. VIDEO GENERATION FLOW

### **PATH: UI → API → Backend → Provider**

```
USER TYPES "generate video of dancing"
    ↓
isImageRequest() detects video keyword
    ↓
buildImageResult() returns { type: 'video', ... }
    ↓
VideoBubble component renders
    ↓
VideoPlayer.tsx component
    ↓
POST /api/v1/video (assumed based on backend structure)
    ↓
Firebase Function: aiVideo in functions/src/index.ts
    ↓
generateMedia({ kind: 'text-to-video', ... })
    ↓
PROVIDER ATTEMPT:
    ❌ HuggingFace Inference API (free tier, requires HF_KEY)
    ❌ No other providers configured
```

### **STATUS**: ❌ **BROKEN** (Requires HF_KEY API key)

**DEPENDENCIES**:
- HuggingFace API key (HF_KEY secret) for video generation

**FREE-FIRST FIX NEEDED**:
- **Option A**: Remove video generation (display honest message)
- **Option B**: Implement local video generation (complex, heavy)
- **Option C**: Make HuggingFace optional fallback, show clear message when missing

**CORE ENGINES NOT IN USE**:
- `core/engines/video/VideoEngine.ts` exists but NOT connected

---

## 4. SPEECH-TO-TEXT (VOICE INPUT)

### **PATH: UI → API → Backend → Provider**

```
USER RECORDS VOICE in GeneralAssistant.tsx
    ↓
transcribeWithWhisper() in src/lib/ai.ts
    ↓
proxyTranscribe() in src/lib/aiProxy.ts
    ↓
POST /api/v1/transcribe (assumed)
    ↓
Firebase Function: aiTranscribe in functions/src/index.ts
    ↓
routeTranscribe() in functions/src/router.ts
    ↓
PROVIDER:
    ❌ groqTranscribe() (PAID - Groq Whisper API)
```

### **STATUS**: ❌ **BROKEN** (Requires Groq API key)

**DEPENDENCIES**:
- Groq API key (GROQ_KEY secret) for Whisper transcription

**FREE-FIRST FIX NEEDED**:
- Replace with **whisper.cpp** (local, FREE, C++ library)
- Or use **Vosk** (lightweight, offline, free)
- Or use **browser Web Speech API** (free, client-side only)

**CORE ENGINES NOT IN USE**:
- `core/engines/speech/SpeechEngine.ts` exists but NOT connected

---

## 5. TEXT-TO-SPEECH (VOICE OUTPUT)

### **PATH: UI → API → Provider**

```
USER CLICKS SPEAKER ICON on message
    ↓
speakText() or speakNigerian() in src/lib/voiceEngine.ts / nigerianVoice.ts
    ↓
PROVIDER:
    ❌ Google Cloud TTS (PAID - requires GOOGLE_TTS_KEY)
    ❌ ElevenLabs (PAID - not implemented)
```

### **STATUS**: ❌ **BROKEN** (Requires Google Cloud TTS API key)

**DEPENDENCIES**:
- Google Cloud TTS API key (GOOGLE_TTS_KEY secret)

**FREE-FIRST FIX NEEDED**:
- Replace with **Piper TTS** (local, FREE, neural voices)
- Or use **browser Web Speech API** (free, limited voices)
- Or use **Coqui TTS** (open-source, local)

**CORE ENGINES NOT IN USE**:
- `core/engines/speech/SpeechEngine.ts` has TTS capability but NOT connected

---

## 6. VISION / IMAGE UNDERSTANDING

### **PATH: UI → API → Backend → Provider**

```
USER UPLOADS IMAGE with question
    ↓
proxyVision() in src/lib/aiProxy.ts
    ↓
POST /api/v1/vision (assumed based on code patterns)
    ↓
Firebase Function: likely uses OpenRouter vision
    ↓
PROVIDER:
    ❌ OpenRouter vision models (PAID)
```

### **STATUS**: ❌ **BROKEN** (Requires OpenRouter API key)

**DEPENDENCIES**:
- OpenRouter API key (OPENROUTER_KEY secret)

**FREE-FIRST FIX NEEDED**:
- Replace with **Ollama vision models** (llama-vision, llava, bakllava - FREE, local)
- Or use **open-source CLIP** for basic image understanding

**CORE ENGINES NOT IN USE**:
- `core/engines/vision/VisionEngine.ts` exists but NOT connected

---

## 7. OCR (OPTICAL CHARACTER RECOGNITION)

### **PATH: UI → API → Backend → Provider**

```
USER CLICKS "OCR - Read Image" button
    ↓
detectTextInImage() in src/lib/ocr.ts (assumed)
    ↓
POST /api/v1/ocr
    ↓
Firebase Function: v1Ocr in functions/src/index.ts
    ↓
performOcrExtraction() uses OpenRouter vision
    ↓
PROVIDER:
    ❌ OpenRouter vision for OCR (PAID)
```

### **STATUS**: ❌ **BROKEN** (Requires OpenRouter API key)

**DEPENDENCIES**:
- OpenRouter API key (OPENROUTER_KEY secret)

**FREE-FIRST FIX NEEDED**:
- Replace with **Tesseract.js** (FREE, JavaScript OCR)
- Or use **PaddleOCR** (open-source, more accurate)
- Or use **browser native OCR APIs** if available

**CORE ENGINES NOT IN USE**:
- `core/engines/ocr/OCREngine.ts` exists but NOT connected

---

## 8. WEB SEARCH

### **PATH: UI → API → Backend → Provider**

```
USER MESSAGE TRIGGERS needsWebSearch()
    ↓
routeChat() in functions/src/router.ts
    ↓
tavilySearch() in functions/src/providers/tavily.ts
    ↓
PROVIDER:
    ❌ Tavily API (PAID - requires TAVILY_KEY)
```

### **STATUS**: ❌ **BROKEN** (Requires Tavily API key)

**DEPENDENCIES**:
- Tavily API key (TAVILY_KEY secret)

**FREE-FIRST FIX NEEDED**:
- Replace with **SearXNG** (self-hosted, FREE meta-search)
- Or use **DuckDuckGo API** (free, no key needed)
- Or scrape **Google Custom Search** (limited free tier)

---

## 9. CORE ENGINES (NOT CONNECTED)

### **DISCOVERED BUT UNUSED ARCHITECTURE**:

The `9ja-ai/9ja-ai-core/` directory contains a complete engine system:

```
core/
├── orchestrator/
│   └── AIOrchestrator.ts (orchestration layer - NOT USED)
├── engines/
│   ├── language/LanguageEngine.ts (NOT USED)
│   ├── image/ImageEngine.ts (NOT USED)
│   ├── video/VideoEngine.ts (NOT USED)
│   ├── speech/SpeechEngine.ts (NOT USED)
│   ├── vision/VisionEngine.ts (NOT USED)
│   ├── ocr/OCREngine.ts (NOT USED)
│   ├── translation/TranslationEngine.ts (NOT USED)
│   └── memory/MemoryEngine.ts (NOT USED)
├── services/
│   └── AIService.ts (service wrapper - NOT USED)
└── inference/
    ├── InferenceEngine.ts (model inference - NOT USED)
    └── InferenceRouter.ts (routing logic - NOT USED)
```

**WHY NOT CONNECTED?**:
- Firebase Functions (`functions/src/`) directly call providers
- No bridge between `functions/src/router.ts` and `core/orchestrator/AIOrchestrator.ts`
- `core/` directory appears to be a planned architecture that was never integrated

**INVESTIGATION NEEDED**:
- ✅ Read `core/engines/language/LanguageEngine.ts` to see if it has free capabilities
- ✅ Check if `core/` engines have Ollama or local model support already
- ✅ Determine if we should connect `core/` or keep current Firebase Functions architecture

---

## 10. SUMMARY TABLE

| Feature | Current Provider | Status | Requires API Key? | FREE-FIRST Fix Needed |
|---------|-----------------|--------|-------------------|----------------------|
| **Chat** | Groq/OpenRouter | ❌ BROKEN | YES (PAID) | → Ollama / llama.cpp |
| **Image** | Pollinations | ✅ WORKING | NO | None - already FREE! |
| **Video** | HuggingFace | ❌ BROKEN | YES (free tier) | → Remove or local |
| **Speech-to-Text** | Groq Whisper | ❌ BROKEN | YES (PAID) | → whisper.cpp / Vosk |
| **Text-to-Speech** | Google TTS | ❌ BROKEN | YES (PAID) | → Piper TTS / Web API |
| **Vision** | OpenRouter | ❌ BROKEN | YES (PAID) | → Ollama vision models |
| **OCR** | OpenRouter | ❌ BROKEN | YES (PAID) | → Tesseract.js / PaddleOCR |
| **Search** | Tavily | ❌ BROKEN | YES (PAID) | → SearXNG / DuckDuckGo |

**KEY FINDING**: Only **1 out of 8** major features works without API keys!

---

## 11. NEXT STEPS FOR FREE-FIRST MIGRATION

### **PHASE 1: CHAT (HIGHEST PRIORITY)**
1. ✅ Read `core/engines/language/LanguageEngine.ts` to check for local capabilities
2. Install Ollama on deployment environment (or provide Docker setup)
3. Create `functions/src/providers/ollama.ts` provider adapter
4. Update `routeChat()` to use Ollama as PRIMARY provider
5. Test chat without ANY API keys

### **PHASE 2: SPEECH**
1. Implement `whisper.cpp` for STT (or browser Web Speech API)
2. Implement `Piper TTS` for TTS (or browser Web Speech API)
3. Update `functions/src/router.ts` to route speech tasks to local engines

### **PHASE 3: VISION & OCR**
1. Add Ollama vision models (llava, bakllava)
2. Integrate Tesseract.js for OCR
3. Update vision/OCR routes to use FREE providers

### **PHASE 4: SEARCH**
1. Set up SearXNG instance or DuckDuckGo API
2. Update `routeSearch()` to use FREE search provider

### **PHASE 5: VIDEO (OPTIONAL)**
1. Either remove video generation entirely
2. Or make HuggingFace optional with clear messaging

---

## 12. RECONCILIATION COMPLIANCE

**CONFIRMING RECONCILIATION RULES**:
- ✅ Did NOT rebuild the application
- ✅ Did NOT replace existing UI components
- ✅ Did NOT create new placeholder UIs
- ✅ PRESERVED all working features (images via Pollinations)
- ✅ MAPPED UI → API → Engine → Provider paths
- ✅ IDENTIFIED what works vs what's broken
- ✅ READY to fix connections, not recreate from scratch

**CRITICAL FILES CONFIRMED INTACT**:
- ✅ `GeneralAssistant.tsx` - Real main chat UI (ACTIVE)
- ✅ `SuperEcosystem.tsx` - Real advanced AI UI (ACTIVE)
- ✅ `NineJAILogo.tsx` - Animated logo (WORKING)
- ✅ All components in `src/components/` - PRESERVED
- ✅ All engines in `core/` - EXIST BUT NOT CONNECTED
- ✅ Firebase Functions architecture - WORKING (but with paid providers)

---

**END OF CONNECTION MAPPING**
**READY FOR OPTION 2 (FREE-FIRST MIGRATION)**
