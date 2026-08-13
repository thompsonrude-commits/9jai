# 9JA AI Live Application Test Plan

**Application URL**: https://9jai.web.app  
**Test Date**: January 2025  
**Purpose**: Systematic verification of all features from UI → API → Functions → Providers → Real Results

---

## TEST METHODOLOGY

### Connection Chain to Verify
```
UI (GeneralAssistant.tsx)
  ↓
Frontend AI Module (src/lib/ai.ts - unifiedChatStream)
  ↓
API Proxy (src/lib/aiProxy.ts - proxyChat)
  ↓
Firebase Hosting Rewrites (firebase.json)
  ↓
Cloud Functions (functions/src/index.ts)
  ↓
Router (functions/src/router.ts)
  ↓
Provider (functions/src/providers/*.ts)
  ↓
External Service / Local Ollama
  ↓
Real Result
```

### Test Execution Steps
1. **Open Browser DevTools** (F12) → Network tab
2. **Load** https://9jai.web.app
3. **Test each feature** from the UI
4. **Monitor Network tab** to see actual API calls
5. **Document**:
   - What request was made (URL, payload)
   - What response came back (status, body)
   - What the UI displayed
   - Whether it worked end-to-end

---

## FEATURE TEST MATRIX

### 1. CHAT (Text AI) - FREE-FIRST with Ollama

**User Action**: Type "Hello, how are you?" in chat
**Expected UI**: Chat message sent → streaming response → response displayed
**Expected API Call**: `POST /api/v1/chat`
**Expected Provider Chain**: 
- PRIMARY: Ollama (localhost:11434) - FREE, no API key
- FALLBACK 1: Groq (if Ollama unavailable)
- FALLBACK 2: OpenRouter
- FALLBACK 3: DeepSeek
- FALLBACK 4: Mistral
- FALLBACK 5: HuggingFace

**Frontend Code**:
- Entry: `src/components/GeneralAssistant.tsx` → `sendMessage()`
- Calls: `unifiedChatStream()` in `src/lib/ai.ts`
- Proxy: `proxyChat()` in `src/lib/aiProxy.ts`
- Endpoint: `/api/v1/chat`

**Backend Code**:
- Function: `aiChat` in `functions/src/index.ts`
- Router: `routeChat()` in `functions/src/router.ts`
- Provider: `ollamaChatWithFallback()` in `functions/src/providers/ollama.ts`

**Test Cases**:
- [ ] Simple greeting: "Hello"
- [ ] Nigerian Pidgin: "How far? Wetin dey happen?"
- [ ] Edo language: "Kọyọ, ọ yẹse?"
- [ ] Code generation: "Write a Python function to reverse a string"
- [ ] Math: "Calculate 127 * 89"

**CRITICAL CHECK**: Is Ollama installed and running on backend?
- Backend needs: `ollama serve` running
- Backend needs: Model pulled: `ollama pull llama3.2`
- If not available: Will fallback to Groq → OpenRouter (paid providers)

**SUCCESS CRITERIA**:
- ✅ User message appears in chat
- ✅ AI response streams word-by-word
- ✅ Response is relevant to question
- ✅ Network shows: POST /api/v1/chat → 200 OK
- ✅ Response body contains: `{ text: "...", provider: "ollama|groq|openrouter", model: "..." }`

---

### 2. IMAGE GENERATION

**User Action**: Type "generate image of Lagos skyline at sunset"
**Expected UI**: 
- Loading animation with progress
- Image appears when ready
- Download buttons (PNG/JPG)

**Expected API Call**: `POST /api/v1/image/generate`
**Expected Provider**: Pollinations AI (FREE, no API key)

**Frontend Code**:
- Detection: `isImageRequest()` in `GeneralAssistant.tsx`
- Extraction: `extractImagePrompt()`
- Build: `buildImageResult()` → `{ type: 'ai', url: '__GENERATE__...' }`
- Component: `ImageBubble` component
- Service: `buildFinalImagePrompt()` in `src/lib/imageService.ts`

**Backend Code**:
- Function: `v1ImageGenerate` in `functions/src/index.ts`
- Router: `routeImage()` in `functions/src/router.ts`
- Provider: `pollinationsWithFallback()` in `functions/src/providers/pollinations.ts`

**Test Cases**:
- [ ] Simple: "generate image of a lion"
- [ ] Logo: "generate logo for TechHub Nigeria"
- [ ] Location: "show me Zuma Rock"
- [ ] Flag: "generate flag of Nigeria"
- [ ] Map: "show map of Abuja"

**SUCCESS CRITERIA**:
- ✅ Request detected as image generation
- ✅ Loading animation plays
- ✅ Image loads and displays
- ✅ Download buttons work
- ✅ Network shows: POST /api/v1/image/generate → 200 OK
- ✅ Response contains: `{ imageUrl: "...", provider: "pollinations-...", model: "..." }`

---

### 3. VIDEO GENERATION

**User Action**: Type "generate video of waves crashing on beach"
**Expected UI**: Video player component with generated video
**Expected API Call**: `POST /api/v1/video/process`
**Expected Provider**: Likely UNAVAILABLE (certified video providers are expensive)

**Frontend Code**:
- Detection: `buildImageResult()` checks for video keywords
- Component: `VideoBubble` → `VideoPlayer`

**Backend Code**:
- Function: `v1VideoProcess` in `functions/src/index.ts`
- Media Engine: `generateMedia()` in `functions/src/media/engine.ts`

**Test Cases**:
- [ ] Simple: "generate video of dancing"

**EXPECTED RESULT**: 
- ❌ ERROR: "Video generation unavailable. No certified video provider is currently available."
- This is CORRECT - video generation requires expensive APIs
- Free providers don't exist for video generation

**SUCCESS CRITERIA**:
- ✅ Request detected as video
- ✅ Error message displayed (not a crash)
- ✅ User understands feature is unavailable
- ✅ Network shows: POST /api/v1/video/process → 503 Service Unavailable

---

### 4. VISION / IMAGE ANALYSIS

**User Action**: Upload an image → Ask "What's in this image?"
**Expected UI**: Image uploaded → Analysis result displayed
**Expected API Call**: `POST /api/v1/vision/analyze`
**Expected Provider**: OpenRouter Vision (paid) OR Ollama Vision (free, local)

**Frontend Code**:
- Upload: `handleFileSelect()` in `GeneralAssistant.tsx`
- Vision: `proxyVision()` in `src/lib/aiProxy.ts`

**Backend Code**:
- Function: `aiVision` in `functions/src/index.ts`
- Provider: `ollamaVisionWithFallback()` in `functions/src/providers/ollamaVision.ts`

**Test Cases**:
- [ ] Upload screenshot → "What do you see?"
- [ ] Upload document → "Extract text from this"

**SUCCESS CRITERIA**:
- ✅ Image uploads successfully
- ✅ Analysis request sent
- ✅ AI describes image content
- ✅ Network shows: POST /api/v1/vision/analyze → 200 OK

---

### 5. VOICE TRANSCRIPTION (Speech-to-Text)

**User Action**: Click microphone → Record voice → Send
**Expected UI**: Recording indicator → Transcribed text appears
**Expected API Call**: `POST /api/v1/speech/transcribe`
**Expected Provider**: Groq Whisper (FREE tier available)

**Frontend Code**:
- Recording: Voice recording logic in `GeneralAssistant.tsx`
- Transcribe: `transcribeWithWhisper()` in `src/lib/ai.ts`
- Proxy: `proxyTranscribe()` in `src/lib/aiProxy.ts`

**Backend Code**:
- Function: `aiTranscribe` in `functions/src/index.ts`
- Router: `routeTranscribe()` in `functions/src/router.ts`
- Provider: `groqTranscribe()` in `functions/src/providers/groq.ts`

**Test Cases**:
- [ ] Record: "Hello, this is a test"
- [ ] Record Nigerian Pidgin: "How far my guy"

**SUCCESS CRITERIA**:
- ✅ Recording starts/stops
- ✅ Audio sent to backend
- ✅ Transcribed text appears
- ✅ Network shows: POST /api/v1/speech/transcribe → 200 OK

---

### 6. WEB SEARCH (Live Data)

**User Action**: Ask "What's the weather in Lagos?"
**Expected Behavior**: AI fetches live weather data and responds
**Expected API**: Search triggered automatically for live data queries
**Expected Provider**: 
- PRIMARY: DuckDuckGo (FREE, no API key)
- FALLBACK: Tavily (paid, if DuckDuckGo fails)

**Frontend Code**:
- Entry: Same as chat → `unifiedChatStream()`

**Backend Code**:
- Detection: `needsWebSearch()` in `functions/src/router.ts`
- Router: `routeSearch()` in `router.ts`
- Provider: `duckduckgoSearchWithRetry()` in `functions/src/providers/duckduckgo.ts`

**Test Cases**:
- [ ] "What time is it in Lagos?"
- [ ] "What's the weather in Abuja?"
- [ ] "What's the latest news in Nigeria?"
- [ ] "What's the dollar to naira rate?"

**SUCCESS CRITERIA**:
- ✅ AI responds with CURRENT data (not stale training data)
- ✅ Response includes actual time/weather/news
- ✅ Backend logs show: DuckDuckGo search triggered
- ✅ No additional API call visible (happens server-side)

---

### 7. TIME API (Built-in - FREE)

**Backend Only**: Time requests handled by `functions/src/providers/time.ts`
**No API Key**: Uses built-in Node.js `Date` and timezone logic

**Test Cases**:
- [ ] "What time is it?"
- [ ] "What time is it in New York?"
- [ ] "Tell me the date"

**SUCCESS CRITERIA**:
- ✅ Accurate current time returned
- ✅ Timezone conversion works
- ✅ Nigerian time (WAT) is default

---

### 8. WEATHER API (Open-Meteo - FREE)

**Backend Only**: Weather requests handled by `functions/src/providers/weather.ts`
**No API Key**: Uses free Open-Meteo API

**Test Cases**:
- [ ] "What's the weather in Lagos?"
- [ ] "Weather forecast for Abuja"
- [ ] "Will it rain today?"

**SUCCESS CRITERIA**:
- ✅ Current weather data retrieved
- ✅ Temperature, condition, wind speed shown
- ✅ 7-day forecast available
- ✅ Geocoding works (city name → coordinates)

---

### 9. TRANSLATION

**User Action**: "Translate 'hello' to Yoruba"
**Expected Behavior**: AI translates using language knowledge
**Expected Provider**: Uses main chat provider (Ollama → Groq → OpenRouter)

**Test Cases**:
- [ ] English → Yoruba
- [ ] English → Igbo
- [ ] English → Hausa
- [ ] English → Edo
- [ ] Nigerian Pidgin → English

**SUCCESS CRITERIA**:
- ✅ Translation provided
- ✅ Correct target language
- ✅ Phonetic guide included (if requested)

---

### 10. OCR (Text from Image)

**User Action**: Upload image with text → Ask to extract text
**Expected API**: `POST /api/v1/ocr`
**Expected Provider**: 
- PRIMARY: Tesseract (FREE, no API key)
- FALLBACK: OpenRouter Vision

**Backend Code**:
- Function: `v1Ocr` in `functions/src/index.ts`
- Provider: `tesseractOCR()` in `functions/src/providers/tesseract.ts`

**Test Cases**:
- [ ] Screenshot of text document
- [ ] Photo of street sign
- [ ] Business card

**SUCCESS CRITERIA**:
- ✅ Text extracted from image
- ✅ Layout preserved (if requested)
- ✅ Confidence score provided

---

## PROVIDER AVAILABILITY CHECK

### FREE Providers (Should Work)
- ✅ **Ollama** - Requires installation: `ollama serve` + `ollama pull llama3.2`
- ✅ **Pollinations** - Public API, no key
- ✅ **Open-Meteo** - Weather API, no key
- ✅ **Time** - Built-in Node.js
- ✅ **DuckDuckGo** - Search API, no key
- ✅ **Tesseract** - OCR library, no key

### Paid Providers (Require API Keys)
- ❓ **Groq** - Free tier available, needs `GROQ_KEY` secret
- ❓ **OpenRouter** - Free tier available, needs `OPENROUTER_KEY` secret
- ❓ **Together AI** - Needs `TOGETHER_KEY` secret
- ❓ **DeepSeek** - Needs `DEEPSEEK_KEY` secret
- ❓ **Mistral** - Needs `MISTRAL_KEY` secret
- ❓ **HuggingFace** - Needs `HF_KEY` secret
- ❓ **Tavily** - Search API, needs `TAVILY_KEY` secret
- ❓ **Google TTS** - Needs `GOOGLE_TTS_KEY` secret

### Check Provider Status
**Backend API**: `GET /api/v1/health`
```bash
curl https://9jai.web.app/api/v1/health
```

Expected response:
```json
{
  "status": "ready",
  "providers": [
    { "id": "ollama", "available": true/false },
    { "id": "groq", "available": true/false },
    { "id": "openrouter", "available": true/false }
  ]
}
```

---

## CRITICAL QUESTIONS TO ANSWER

### 1. Is Ollama Installed on Backend?
- **If YES**: Chat will be FREE (local inference)
- **If NO**: Chat will use paid providers (Groq → OpenRouter)

**How to check**: 
- Test chat and look at `provider` field in response
- `provider: "ollama"` = SUCCESS (FREE)
- `provider: "groq"` or `"openrouter"` = FALLBACK (paid)

### 2. Are Paid API Keys Configured?
- Groq, OpenRouter, etc. need Firebase Secrets
- **Check**: Run health endpoint or test features

### 3. Does Frontend Correctly Route to Backend?
- **Check**: Network tab shows `/api/v1/*` calls
- **Check**: Requests reach Firebase Functions (not 404)
- **Check**: Firebase rewrites in `firebase.json` are working

### 4. Are All Features Actually Connected?
- Image generation → Pollinations
- Chat → Ollama/Groq/OpenRouter
- Weather → Open-Meteo
- Time → Built-in
- Search → DuckDuckGo

---

## TESTING WORKFLOW

### Step 1: Manual UI Testing (User Perspective)
1. Open https://9jai.web.app in browser
2. Open DevTools → Network tab
3. Test each feature listed above
4. Document what works vs what fails

### Step 2: API Testing (Developer Perspective)
```bash
# Test health endpoint
curl https://9jai.web.app/api/v1/health

# Test chat (manual)
curl -X POST https://9jai.web.app/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test image (manual)
curl -X POST https://9jai.web.app/api/v1/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a lion"}'
```

### Step 3: Trace Failures
If something doesn't work:
1. Check Network tab: What was the response code?
2. Check response body: What error message?
3. Check browser console: Any JavaScript errors?
4. Check Firebase Functions logs: Backend errors?

---

## NEXT ACTIONS

1. **RUN LIVE TESTS** - Open the app and test systematically
2. **DOCUMENT RESULTS** - Create `TEST_RESULTS.md` with findings
3. **FIX BROKEN CONNECTIONS** - Address any failures found
4. **VERIFY PROVIDERS** - Check which providers are actually available
5. **IMPLEMENT UI DESIGN** - Only AFTER functionality is verified

---

## SUCCESS DEFINITION

✅ **MINIMUM VIABLE**:
- Chat works (any provider)
- Image generation works (Pollinations)
- No JavaScript errors in console
- No 404s on API calls

✅ **IDEAL STATE**:
- Chat uses FREE Ollama (local, no API key)
- All FREE providers work (Pollinations, Open-Meteo, DuckDuckGo, Time)
- Paid providers are fallbacks only
- Every feature tested end-to-end
- Real results verified from UI

---

**REMEMBER**: The goal is NOT to rebuild. The goal is to TEST what exists and FIX what's broken.
