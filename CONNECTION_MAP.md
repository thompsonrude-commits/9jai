# 9JA AI Connection Map - Quick Reference

This document maps EXACTLY how each feature flows from UI → Backend → Provider.

---

## 🎯 CHAT (Text AI)

```
USER TYPES MESSAGE
  ↓
GeneralAssistant.tsx → sendMessage()
  ↓
src/lib/ai.ts → unifiedChatStream(messages)
  ↓
src/lib/aiProxy.ts → proxyChat({ messages })
  ↓
HTTP: POST /api/v1/chat
  ↓
firebase.json: /api/v1/chat → aiChat function
  ↓
functions/src/index.ts → aiChat()
  ↓
functions/src/router.ts → routeChat()
  ↓
Provider chain:
  1. functions/src/providers/ollama.ts → ollamaChatWithFallback() [FREE]
  2. functions/src/providers/groq.ts → groqChatWithFallback()
  3. functions/src/providers/openrouter.ts → openRouterChatWithFallback()
  4. functions/src/providers/deepseek.ts → deepseekChat()
  5. functions/src/providers/mistral.ts → mistralChat()
  6. functions/src/providers/huggingface.ts → hfChat()
  ↓
RESPONSE: { text, provider, model, latencyMs }
  ↓
Frontend receives → Displays streaming text
```

**CRITICAL**: Ollama is PRIMARY (FREE). If not installed → falls back to paid providers.

---

## 🎨 IMAGE GENERATION

```
USER TYPES "generate image of..."
  ↓
GeneralAssistant.tsx → isImageRequest() → TRUE
  ↓
extractImagePrompt() → Gets clean prompt
  ↓
buildImageResult() → Returns { type: 'ai', url: '__GENERATE__...' }
  ↓
ImageBubble component renders
  ↓
src/lib/aiProxy.ts → proxyImage(prompt)
  ↓
HTTP: POST /api/v1/image/generate
  ↓
firebase.json: /api/v1/image/generate → v1ImageGenerate function
  ↓
functions/src/index.ts → v1ImageGenerate()
  ↓
functions/src/router.ts → routeImage()
  ↓
functions/src/media/engine.ts → generateMedia({ kind: 'image' })
  ↓
functions/src/providers/pollinations.ts → pollinationsWithFallback() [FREE]
  ↓
RESPONSE: { imageBase64, provider, model, latencyMs }
  ↓
Frontend receives → Displays image
```

**PROVIDER**: Pollinations AI (FREE, no API key)

---

## 🎥 VIDEO GENERATION

```
USER TYPES "generate video of..."
  ↓
GeneralAssistant.tsx → buildImageResult() → Detects video keywords
  ↓
Returns { type: 'video', url: '__VIDEO__...' }
  ↓
VideoBubble → VideoPlayer component
  ↓
src/lib/aiProxy.ts → proxyVideo(prompt)
  ↓
HTTP: POST /api/v1/video/process
  ↓
firebase.json: /api/v1/video/process → v1VideoProcess function
  ↓
functions/src/index.ts → v1VideoProcess()
  ↓
functions/src/media/engine.ts → generateMedia({ kind: 'video' })
  ↓
❌ NO FREE VIDEO PROVIDERS AVAILABLE
  ↓
RESPONSE: 503 Error "Video generation unavailable"
```

**STATUS**: ❌ UNAVAILABLE (no free video providers exist)

---

## 👁️ VISION (Image Analysis)

```
USER UPLOADS IMAGE → Asks question
  ↓
GeneralAssistant.tsx → handleFileSelect()
  ↓
Image stored in pendingFiles[]
  ↓
sendMessage() → Detects image in pendingFiles
  ↓
src/lib/aiProxy.ts → proxyVision(imageBase64, prompt)
  ↓
HTTP: POST /api/v1/vision/analyze
  ↓
firebase.json: /api/v1/vision/analyze → aiVision function
  ↓
functions/src/index.ts → aiVision()
  ↓
functions/src/providers/ollamaVision.ts → ollamaVisionWithFallback() [FREE]
  OR
functions/src/providers/openrouter.ts → openRouterVisionChat() [PAID]
  ↓
RESPONSE: { text, model }
  ↓
Frontend receives → Displays analysis
```

**PROVIDERS**: Ollama Vision (FREE if installed) → OpenRouter Vision (paid fallback)

---

## 🎤 VOICE TRANSCRIPTION (Speech-to-Text)

```
USER RECORDS AUDIO → Sends
  ↓
GeneralAssistant.tsx → Voice recording logic
  ↓
src/lib/ai.ts → transcribeWithWhisper(audioBlob, language)
  ↓
src/lib/aiProxy.ts → proxyTranscribe(audioBlob, language)
  ↓
HTTP: POST /api/v1/speech/transcribe
  ↓
firebase.json: /api/v1/speech/transcribe → aiTranscribe function
  ↓
functions/src/index.ts → aiTranscribe()
  ↓
functions/src/router.ts → routeTranscribe()
  ↓
functions/src/providers/groq.ts → groqTranscribe() [FREE tier]
  ↓
RESPONSE: { text, provider, latencyMs }
  ↓
Frontend receives → Displays transcribed text
```

**PROVIDER**: Groq Whisper (FREE tier available)

---

## 🔍 WEB SEARCH (Live Data)

```
USER ASKS "What's the weather in Lagos?"
  ↓
GeneralAssistant.tsx → sendMessage()
  ↓
Backend receives chat request
  ↓
functions/src/router.ts → routeChat()
  ↓
needsWebSearch(messages) → TRUE (detects live data request)
  ↓
functions/src/router.ts → routeSearch(query)
  ↓
Provider chain:
  1. functions/src/providers/duckduckgo.ts → duckduckgoSearchWithRetry() [FREE]
  2. functions/src/providers/tavily.ts → tavilySearch() [PAID fallback]
  ↓
Search results → buildSearchContext()
  ↓
Context injected into chat messages
  ↓
Chat provider responds with live data
  ↓
Frontend receives → Displays answer with current info
```

**PROVIDERS**: DuckDuckGo (FREE, no API key) → Tavily (paid fallback)

---

## ⏰ TIME API

```
USER ASKS "What time is it?"
  ↓
Backend chat receives request
  ↓
System prompt includes: getCurrentTime()
  ↓
functions/src/providers/time.ts → getCurrentTime(timezone)
  ↓
Uses Node.js built-in Date + Intl.DateTimeFormat
  ↓
RESPONSE: { time, date, timezone, dayOfWeek }
  ↓
Formatted into natural language response
```

**PROVIDER**: Built-in Node.js (FREE, no API key)

---

## 🌤️ WEATHER API

```
USER ASKS "What's the weather in Lagos?"
  ↓
Backend detects weather request
  ↓
functions/src/providers/weather.ts → getWeatherWithRetry(location)
  ↓
Step 1: Geocode location
  → https://geocoding-api.open-meteo.com/v1/search
  ↓
Step 2: Get weather data
  → https://api.open-meteo.com/v1/forecast
  ↓
RESPONSE: { temperature, condition, forecast[], windSpeed }
  ↓
Formatted into natural language
```

**PROVIDER**: Open-Meteo (FREE, no API key)

---

## 🔤 OCR (Text from Image)

```
USER UPLOADS IMAGE → Asks to extract text
  ↓
HTTP: POST /api/v1/ocr
  ↓
firebase.json: /api/v1/ocr → v1Ocr function
  ↓
functions/src/index.ts → v1Ocr()
  ↓
Provider chain:
  1. functions/src/providers/tesseract.ts → tesseractOCR() [FREE]
  2. functions/src/providers/openrouter.ts → openRouterVisionChat() [PAID fallback]
  ↓
RESPONSE: { text, confidence, provider }
```

**PROVIDERS**: Tesseract (FREE, no API key) → OpenRouter Vision (paid fallback)

---

## 📄 DOCUMENT MANAGEMENT

```
HTTP: POST /api/v1/documents
  ↓
firebase.json: /api/v1/documents → v1Document function
  ↓
functions/src/index.ts → v1Document()
  ↓
In-memory documentStore Map
  ↓
CRUD operations: Create, Read, Update, Delete
```

**STATUS**: ✅ Working (in-memory storage)

---

## 🔌 PLUGINS & CONNECTORS

```
HTTP: POST /api/v1/plugins/register
  ↓
firebase.json: /api/v1/plugins/** → v1PluginRegistry function
  ↓
functions/src/index.ts → v1PluginRegistry()
  ↓
In-memory pluginRegistry Map

HTTP: POST /api/v1/connectors/register
  ↓
firebase.json: /api/v1/connectors/** → v1ConnectorRegistry function
  ↓
functions/src/index.ts → v1ConnectorRegistry()
  ↓
In-memory connectorRegistry Map
```

**STATUS**: ✅ Working (in-memory storage)

---

## 🏥 HEALTH CHECK

```
HTTP: GET /api/v1/health
  ↓
firebase.json: /api/v1/health → aiHealth function
  ↓
functions/src/index.ts → aiHealth()
  ↓
Checks all provider availability
  ↓
RESPONSE: { status, providers[], cache }
```

**USE**: To verify which providers are actually available

---

## 🔑 KEY ENDPOINTS

| Feature | Method | Endpoint | Function | Provider |
|---------|--------|----------|----------|----------|
| Chat | POST | /api/v1/chat | aiChat | Ollama → Groq → OpenRouter |
| Stream | POST | /api/v1/stream | aiStream | Same as chat |
| Image | POST | /api/v1/image/generate | v1ImageGenerate | Pollinations |
| Video | POST | /api/v1/video/process | v1VideoProcess | ❌ None |
| Vision | POST | /api/v1/vision/analyze | aiVision | Ollama → OpenRouter |
| Transcribe | POST | /api/v1/speech/transcribe | aiTranscribe | Groq Whisper |
| Search | POST | /api/v1/search | aiSearch | DuckDuckGo → Tavily |
| OCR | POST | /api/v1/ocr | v1Ocr | Tesseract → OpenRouter |
| Documents | POST/GET | /api/v1/documents | v1Document | In-memory |
| Plugins | POST/GET | /api/v1/plugins | v1PluginRegistry | In-memory |
| Connectors | POST/GET | /api/v1/connectors | v1ConnectorRegistry | In-memory |
| Health | GET | /api/v1/health | aiHealth | N/A |

---

## 🆓 FREE-FIRST PROVIDER STATUS

| Provider | Type | API Key Required | Cost | Status |
|----------|------|------------------|------|--------|
| **Ollama** | Chat | ❌ No | FREE | ✅ If installed locally |
| **Pollinations** | Image | ❌ No | FREE | ✅ Always works |
| **Open-Meteo** | Weather | ❌ No | FREE | ✅ Always works |
| **Time** | Time | ❌ No | FREE | ✅ Built-in |
| **DuckDuckGo** | Search | ❌ No | FREE | ✅ Always works |
| **Tesseract** | OCR | ❌ No | FREE | ✅ Always works |
| Groq | Chat/Transcribe | ✅ Yes | FREE tier | ❓ If key configured |
| OpenRouter | Chat/Vision | ✅ Yes | Paid/Free tier | ❓ If key configured |
| Together AI | Chat | ✅ Yes | Paid | ❓ If key configured |
| DeepSeek | Chat | ✅ Yes | Paid | ❓ If key configured |
| Mistral | Chat | ✅ Yes | Paid | ❓ If key configured |
| HuggingFace | Chat | ✅ Yes | Free tier | ❓ If key configured |
| Tavily | Search | ✅ Yes | Paid | ❓ If key configured |

---

## 🚨 CRITICAL DEPENDENCIES

### For 100% FREE Operation (No API Keys):
1. **Ollama must be installed and running**:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama serve
   ollama pull llama3.2
   ```
2. **Environment variable** (if Ollama is on different host):
   ```
   OLLAMA_URL=http://localhost:11434
   ```

### For Fallback Operation (With API Keys):
3. **Firebase Secrets** (for paid providers):
   ```bash
   firebase functions:secrets:set GROQ_KEY
   firebase functions:secrets:set OPENROUTER_KEY
   firebase functions:secrets:set TAVILY_KEY
   # etc.
   ```

---

## ✅ VERIFICATION CHECKLIST

To verify everything is connected:

1. **Frontend builds**: `npm run build` → Success
2. **Functions deploy**: `firebase deploy --only functions` → Success
3. **Hosting deploys**: `firebase deploy --only hosting` → Success
4. **Health check**: `curl https://9jai.web.app/api/v1/health` → Returns provider status
5. **Chat works**: Test from UI → Message → Response
6. **Image works**: Test from UI → "generate image of lion" → Image appears
7. **No 404s**: Network tab shows all `/api/v1/*` requests → 200 OK (or intentional errors)
8. **Provider used**: Response includes `provider` field showing which service handled it

---

**LAST UPDATED**: Context Transfer Session (Systematic Testing Phase)
