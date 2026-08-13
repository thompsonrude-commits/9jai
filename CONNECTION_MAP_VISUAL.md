# 9JAI CONNECTION MAP - VISUAL REFERENCE
**Quick reference for all data flow paths**

## 🟢 WORKING PATH (FREE)

```
┌─────────────────────────────────────────────────────────────┐
│                     IMAGE GENERATION                         │
│                     ✅ FULLY WORKING                         │
└─────────────────────────────────────────────────────────────┘

USER: "generate image of Lagos skyline"
  │
  ├─> GeneralAssistant.tsx (detects image request)
  │
  ├─> generateImage() in imageService.ts
  │     │
  │     ├─> callImageBackend()
  │     │
  │     └─> POST /api/v1/image/generate
  │
  ├─> Firebase Function: aiImage
  │
  ├─> routeImage() → generateMedia()
  │
  ├─> 🟢 POLLINATIONS (FREE, no API key)
  │     ↓
  │   https://image.pollinations.ai/prompt/{prompt}
  │
  └─> ✅ Image URL returned to UI
        Browser renders instantly
```

---

## 🔴 BROKEN PATHS (REQUIRE API KEYS)

### CHAT FLOW

```
┌─────────────────────────────────────────────────────────────┐
│                        CHAT / TEXT                           │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: "Wetin be weather for Lagos?"
  │
  ├─> GeneralAssistant.tsx (user types)
  │
  ├─> unifiedChatStream() in ai.ts
  │     │
  │     └─> _proxyChat() in aiProxy.ts
  │
  ├─> POST /api/v1/chat
  │
  ├─> Firebase Function: aiChat
  │
  ├─> routeChat() in router.ts
  │
  ├─> 🔴 PROVIDER CHAIN (ALL REQUIRE KEYS):
  │     1. Groq (GROQ_KEY) ❌
  │     2. OpenRouter (OPENROUTER_KEY) ❌
  │     3. DeepSeek (DEEPSEEK_KEY) ❌
  │     4. Mistral (MISTRAL_KEY) ❌
  │     5. HuggingFace (HF_KEY) ❌
  │
  └─> ❌ "Network busy" fallback message

FREE-FIRST FIX: → Replace with Ollama (local, FREE)
```

---

### VOICE INPUT (SPEECH-TO-TEXT)

```
┌─────────────────────────────────────────────────────────────┐
│                   SPEECH-TO-TEXT (STT)                       │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: [Records voice message]
  │
  ├─> GeneralAssistant.tsx (microphone button)
  │
  ├─> transcribeWithWhisper() in ai.ts
  │     │
  │     └─> proxyTranscribe() in aiProxy.ts
  │
  ├─> POST /api/v1/transcribe
  │
  ├─> Firebase Function: aiTranscribe
  │
  ├─> routeTranscribe() → groqTranscribe()
  │
  ├─> 🔴 Groq Whisper API (GROQ_KEY) ❌
  │
  └─> ❌ Empty string returned

FREE-FIRST FIX: → whisper.cpp or browser Web Speech API
```

---

### VOICE OUTPUT (TEXT-TO-SPEECH)

```
┌─────────────────────────────────────────────────────────────┐
│                   TEXT-TO-SPEECH (TTS)                       │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: [Clicks speaker icon on message]
  │
  ├─> GeneralAssistant.tsx (speaker button)
  │
  ├─> speakText() or speakNigerian()
  │     │
  │     └─> voiceEngine.ts / nigerianVoice.ts
  │
  ├─> 🔴 Google Cloud TTS (GOOGLE_TTS_KEY) ❌
  │
  └─> ❌ Silent / no audio

FREE-FIRST FIX: → Piper TTS (local) or browser Web Speech API
```

---

### IMAGE UNDERSTANDING (VISION)

```
┌─────────────────────────────────────────────────────────────┐
│                    VISION / IMAGE ANALYSIS                   │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: [Uploads image] "What's in this picture?"
  │
  ├─> GeneralAssistant.tsx (image upload)
  │
  ├─> proxyVision() in aiProxy.ts
  │
  ├─> POST /api/v1/vision (assumed)
  │
  ├─> Firebase Function (uses OpenRouter vision)
  │
  ├─> 🔴 OpenRouter Vision API (OPENROUTER_KEY) ❌
  │
  └─> ❌ Error / no response

FREE-FIRST FIX: → Ollama vision models (llava, bakllava)
```

---

### OCR (TEXT EXTRACTION)

```
┌─────────────────────────────────────────────────────────────┐
│                    OCR (READ IMAGE TEXT)                     │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: [Clicks "OCR - Read Image"]
  │
  ├─> GeneralAssistant.tsx (OCR button)
  │
  ├─> detectTextInImage() in ocr.ts
  │
  ├─> POST /api/v1/ocr
  │
  ├─> Firebase Function: v1Ocr
  │
  ├─> performOcrExtraction() → OpenRouter vision
  │
  ├─> 🔴 OpenRouter Vision API (OPENROUTER_KEY) ❌
  │
  └─> ❌ Placeholder text only

FREE-FIRST FIX: → Tesseract.js or PaddleOCR
```

---

### WEB SEARCH

```
┌─────────────────────────────────────────────────────────────┐
│                        WEB SEARCH                            │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: "Latest news in Nigeria"
  │
  ├─> GeneralAssistant.tsx (triggers needsWebSearch)
  │
  ├─> routeChat() → tavilySearch()
  │
  ├─> 🔴 Tavily Search API (TAVILY_KEY) ❌
  │
  └─> ❌ No search results, basic chat response only

FREE-FIRST FIX: → SearXNG (self-hosted) or DuckDuckGo API
```

---

### VIDEO GENERATION

```
┌─────────────────────────────────────────────────────────────┐
│                     VIDEO GENERATION                         │
│                     ❌ REQUIRES API KEY                      │
└─────────────────────────────────────────────────────────────┘

USER: "Generate video of dancing"
  │
  ├─> GeneralAssistant.tsx (detects video keyword)
  │
  ├─> VideoBubble → VideoPlayer.tsx
  │
  ├─> POST /api/v1/video (assumed)
  │
  ├─> Firebase Function: aiVideo
  │
  ├─> generateMedia({ kind: 'text-to-video' })
  │
  ├─> 🔴 HuggingFace Inference API (HF_KEY) ❌
  │
  └─> ❌ Error message displayed

FREE-FIRST FIX: → Remove feature or make optional
```

---

## 🏗️ CORE ARCHITECTURE (NOT CONNECTED)

```
┌───────────────────────────────────────────────────────────────┐
│         DESIGNED BUT NEVER CONNECTED TO ACTIVE PATH           │
└───────────────────────────────────────────────────────────────┘

core/
├── orchestrator/
│   └── AIOrchestrator.ts ❌ NOT USED
│         ↓
├── services/
│   └── AIService.ts ❌ NOT USED
│         ↓
├── engines/
│   ├── language/LanguageEngine.ts ❌ THROWS ERROR
│   ├── speech/SpeechEngine.ts ❌ PLACEHOLDER
│   ├── vision/VisionEngine.ts ❌ NOT CONNECTED
│   ├── image/ImageEngine.ts ❌ NOT CONNECTED
│   └── ... (all other engines) ❌ NOT CONNECTED
│         ↓
└── inference/
    ├── InferenceEngine.ts ❌ NO PROVIDERS
    └── InferenceRouter.ts ❌ NOT USED

WHY NOT USED:
- Firebase Functions bypass core architecture
- No adapters created for FREE providers
- Bridge between functions/ and core/ never built
```

---

## 📊 SUMMARY SCORE

```
┌─────────────────────────────────────────────────────────┐
│  FEATURE SCORECARD                                      │
├─────────────────────────────────────────────────────────┤
│  ✅ Image Generation:      WORKING (Pollinations FREE)  │
│  ❌ Chat:                  BROKEN (requires API keys)   │
│  ❌ Speech-to-Text:        BROKEN (requires API keys)   │
│  ❌ Text-to-Speech:        BROKEN (requires API keys)   │
│  ❌ Vision:                BROKEN (requires API keys)   │
│  ❌ OCR:                   BROKEN (requires API keys)   │
│  ❌ Search:                BROKEN (requires API keys)   │
│  ❌ Video:                 BROKEN (requires API keys)   │
├─────────────────────────────────────────────────────────┤
│  FREE-FIRST COMPLIANCE:    12.5% (1 out of 8)          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 FREE-FIRST MIGRATION TARGETS

### PRIORITY 1: CHAT (Essential)
- **Current**: Groq/OpenRouter (PAID)
- **Target**: Ollama with llama3.2 (FREE, local)
- **Impact**: Restores core functionality

### PRIORITY 2: SPEECH
- **Current**: Groq Whisper + Google TTS (PAID)
- **Target**: whisper.cpp + Piper TTS (FREE, local)
- **Impact**: Enables voice interaction

### PRIORITY 3: VISION & OCR
- **Current**: OpenRouter vision (PAID)
- **Target**: Ollama llava + Tesseract.js (FREE)
- **Impact**: Image understanding restored

### PRIORITY 4: SEARCH
- **Current**: Tavily (PAID)
- **Target**: SearXNG or DuckDuckGo (FREE)
- **Impact**: Real-time data access

### PRIORITY 5: VIDEO (Optional)
- **Current**: HuggingFace (requires key)
- **Target**: Remove or make optional
- **Impact**: Low priority feature

---

**END OF VISUAL MAP**
**Use this as quick reference for implementation**
