# REMAINING PHASES IMPLEMENTATION GUIDE
**Phases 4-10: Vision, OCR, Search, Current Info, Sidebar, Self-Aware, Testing**

---

## ✅ COMPLETED SO FAR

- ✅ **Phase 1**: Cleanup (WorkspaceHome deleted)
- ✅ **Phase 2**: Ollama chat provider created, router updated
- ✅ **Phase 3**: Browser STT library created, TTS already working

---

## ⏳ PHASE 4: FREE VISION & OCR (3-4 hours)

### Task 4.1: Add Ollama Vision Models

**Server Setup**:
```bash
# Pull Ollama vision models
ollama pull llava           # 7B vision model
ollama pull llava:13b       # Higher quality
ollama pull bakllava        # Alternative vision model
```

### Task 4.2: Create Ollama Vision Provider

**New File**: `functions/src/providers/ollamaVision.ts`
```typescript
import { isOllamaAvailable } from './ollama';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Analyze image with Ollama vision model
 */
export async function ollamaVisionAnalyze(
  imageBase64: string,
  prompt: string,
  model = 'llava'
): Promise<{ text: string; model: string }> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt: `${prompt}\n\n[Image data: ${imageBase64.slice(0, 100)}...]`,
      images: [imageBase64], // Base64 without data:image prefix
      stream: false,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama vision failed: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    text: data.response,
    model,
  };
}
```

### Task 4.3: Integrate Tesseract.js for OCR

**Install**:
```bash
cd functions
npm install tesseract.js
```

**New File**: `functions/src/providers/tesseract.ts`
```typescript
import Tesseract from 'tesseract.js';

/**
 * Extract text from image using Tesseract OCR (FREE)
 */
export async function tesseractOCR(
  imageUrl: string,
  language = 'eng'
): Promise<{ text: string; confidence: number }> {
  const result = await Tesseract.recognize(imageUrl, language, {
    logger: (m) => console.log('[Tesseract]', m),
  });
  
  return {
    text: result.data.text,
    confidence: result.data.confidence / 100,
  };
}

/**
 * Extract text with layout information
 */
export async function tesseractOCRWithLayout(
  imageUrl: string,
  language = 'eng'
): Promise<any> {
  const result = await Tesseract.recognize(imageUrl, language);
  
  return {
    text: result.data.text,
    confidence: result.data.confidence / 100,
    words: result.data.words,
    lines: result.data.lines,
    paragraphs: result.data.paragraphs,
  };
}
```

### Task 4.4: Update Vision/OCR Routes

**File**: `functions/src/index.ts` - Update `v1Ocr`
```typescript
import { tesseractOCR } from './providers/tesseract';

export const v1Ocr = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 120, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    
    if (req.method !== 'POST') {
      res.status(405).json({ status: 'error', error: 'Method not allowed' });
      return;
    }
    
    const { imageUrl, language } = req.body;
    if (!imageUrl) {
      res.status(400).json({ status: 'error', error: 'imageUrl required' });
      return;
    }
    
    try {
      // Try Tesseract first (FREE)
      const result = await tesseractOCR(imageUrl, language || 'eng');
      
      res.status(200).json({
        status: 'success',
        data: {
          text: result.text,
          confidence: result.confidence,
          provider: 'tesseract',
        },
      });
    } catch (err: any) {
      console.error('[v1Ocr] Tesseract failed:', err);
      res.status(500).json({ status: 'error', error: 'OCR processing failed' });
    }
  }
);
```

**Create Vision Endpoint** (if not exists):
```typescript
export const v1Vision = onRequest(
  { secrets: ALL_SECRETS, cors: false, timeoutSeconds: 120, memory: '512MiB' },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    
    const { imageBase64, prompt } = req.body;
    if (!imageBase64 || !prompt) {
      res.status(400).json({ error: 'imageBase64 and prompt required' });
      return;
    }
    
    try {
      // Try Ollama vision first (FREE)
      const result = await ollamaVisionAnalyze(imageBase64, prompt);
      res.status(200).json({
        text: result.text,
        provider: 'ollama',
        model: result.model,
      });
    } catch (err: any) {
      console.error('[v1Vision] Ollama failed:', err);
      res.status(500).json({ error: 'Vision analysis failed' });
    }
  }
);
```

---

## ⏳ PHASE 5: FREE SEARCH (2-3 hours)

### Task 5.1: Create DuckDuckGo Provider

**New File**: `functions/src/providers/duckduckgo.ts`
```typescript
/**
 * DuckDuckGo Search - FREE, no API key required
 * Uses HTML scraping (no official API)
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function duckduckgoSearch(
  query: string,
  maxResults = 10
): Promise<SearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  
  if (!response.ok) {
    throw new Error(`DuckDuckGo search failed: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Parse HTML results (simplified)
  const results: SearchResult[] = [];
  const resultRegex = /<div class="result__body">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
  
  let match;
  while ((match = resultRegex.exec(html)) && results.length < maxResults) {
    results.push({
      url: match[1],
      title: match[2].replace(/<[^>]+>/g, '').trim(),
      snippet: match[3].replace(/<[^>]+>/g, '').trim(),
    });
  }
  
  return results;
}
```

### Task 5.2: Update Search Router

**File**: `functions/src/router.ts` - Update `routeSearch`
```typescript
import { duckduckgoSearch } from './providers/duckduckgo';

export async function routeSearch(query: string): Promise<{ context: string; results: any[]; latencyMs: number }> {
  const timer = startTimer();
  
  try {
    // Try DuckDuckGo first (FREE)
    const results = await duckduckgoSearch(query, 6);
    const latency = timer();
    
    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
      .join('\n\n');
    
    return {
      context,
      results,
      latencyMs: latency,
    };
  } catch (err: any) {
    console.warn('[Router] DuckDuckGo failed, trying Tavily:', err.message);
    
    // Fallback to Tavily if available
    try {
      const res = await tavilySearch(query, 6, 'advanced');
      return {
        context: buildSearchContext(res),
        results: res.results,
        latencyMs: timer(),
      };
    } catch (tavilyErr: any) {
      console.warn('[Router] All search providers failed');
      return { context: '', results: [], latencyMs: timer() };
    }
  }
}
```

---

## ⏳ PHASE 6: CURRENT INFORMATION SYSTEM (4-5 hours)

### Task 6.1: Add Time Provider

**New File**: `functions/src/providers/time.ts`
```typescript
/**
 * Current Time Provider - FREE (built-in Node.js)
 */

export function getCurrentTime(timezone = 'Africa/Lagos'): {
  time: string;
  date: string;
  timezone: string;
  timestamp: number;
} {
  const now = new Date();
  
  return {
    time: now.toLocaleTimeString('en-NG', { timeZone: timezone, hour12: true }),
    date: now.toLocaleDateString('en-NG', { timeZone: timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    timezone,
    timestamp: now.getTime(),
  };
}
```

### Task 6.2: Add Weather Provider (Open-Meteo - FREE)

**New File**: `functions/src/providers/weather.ts`
```typescript
/**
 * Weather Provider - Open-Meteo API (FREE, no key required)
 */

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    date: string;
    temperature: number;
    condition: string;
  }>;
}

export async function getWeather(location: string): Promise<WeatherData> {
  // Geocode location first
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();
  
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`Location not found: ${location}`);
  }
  
  const { latitude, longitude, name } = geoData.results[0];
  
  // Get weather data
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
  const weatherRes = await fetch(weatherUrl);
  const weatherData = await weatherRes.json();
  
  const current = weatherData.current_weather;
  
  return {
    location: name,
    temperature: current.temperature,
    condition: getWeatherCondition(current.weathercode),
    humidity: 0, // Not provided by free tier
    windSpeed: current.windspeed,
    forecast: weatherData.daily.time.slice(0, 5).map((date: string, i: number) => ({
      date,
      temperature: weatherData.daily.temperature_2m_max[i],
      condition: getWeatherCondition(weatherData.daily.weathercode[i]),
    })),
  };
}

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Foggy',
    51: 'Light drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Light snow',
    95: 'Thunderstorm',
  };
  return conditions[code] || 'Unknown';
}
```

### Task 6.3: Enhance Intent Detection

**File**: `functions/src/router.ts` - Expand `classifyRequest`
```typescript
function classifyRequest(messages: ChatMessage[]): RequestClass {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return 'general-knowledge';
  const lower = lastUser.content.toLowerCase();
  
  // Time queries
  if (/what time|current time|time is it|wetin be time/.test(lower)) {
    return 'live-data';
  }
  
  // Weather queries
  if (/weather|temperature|forecast|rain|sunny|cloudy/.test(lower)) {
    return 'live-data';
  }
  
  // News queries
  if (/latest news|breaking news|current news|today news|what happened/.test(lower)) {
    return 'live-data';
  }
  
  // Sports queries
  if (/who won|match score|latest result|sports|football|basketball/.test(lower)) {
    return 'live-data';
  }
  
  // ... rest of existing logic
}
```

### Task 6.4: Add Route Handlers for Time/Weather

**File**: `functions/src/index.ts`
```typescript
export const aiTime = onRequest(
  { cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    
    const { timezone } = req.body || {};
    const timeData = getCurrentTime(timezone || 'Africa/Lagos');
    
    res.status(200).json({ status: 'success', data: timeData });
  }
);

export const aiWeather = onRequest(
  { cors: false },
  async (req, res) => {
    if (setCorsHeaders(req, res)) return;
    
    const { location } = req.body;
    if (!location) {
      res.status(400).json({ error: 'location required' });
      return;
    }
    
    try {
      const weather = await getWeather(location);
      res.status(200).json({ status: 'success', data: weather });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);
```

---

## ⏳ PHASE 7: MINIMAL SIDEBAR (3-4 hours)

### Task 7.1: Create Minimal Sidebar Component

**New File**: `src/components/MinimalSidebar.tsx`
```typescript
import React from 'react';
import { MessageSquarePlus, History, Settings, User, LogOut } from 'lucide-react';

interface MinimalSidebarProps {
  onNewChat: () => void;
  onShowHistory: () => void;
  onShowSettings: () => void;
  onShowProfile: () => void;
  onLogout: () => void;
  user: any;
}

export default function MinimalSidebar({
  onNewChat,
  onShowHistory,
  onShowSettings,
  onShowProfile,
  onLogout,
  user,
}: MinimalSidebarProps) {
  return (
    <aside className="w-64 bg-gradient-to-b from-[#0a1810] to-[#071209] border-r border-[#008751]/20 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-[#008751]/20">
        <h1 className="text-2xl font-bold text-[#00ff88]">9JAI</h1>
        <p className="text-xs text-[#008751]/70">Africa's AI</p>
      </div>
      
      {/* Main Actions */}
      <div className="flex-1 p-3 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-[#008751]/10 hover:bg-[#008751]/20 text-[#00ff88] transition"
        >
          <MessageSquarePlus size={18} />
          <span>New Chat</span>
        </button>
        
        <button
          onClick={onShowHistory}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#008751]/10 text-[#008751] transition"
        >
          <History size={18} />
          <span>History</span>
        </button>
        
        <button
          onClick={onShowSettings}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#008751]/10 text-[#008751] transition"
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
      
      {/* User Profile */}
      <div className="p-3 border-t border-[#008751]/20 space-y-2">
        <button
          onClick={onShowProfile}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#008751]/10 text-[#008751] transition"
        >
          <User size={18} />
          <span className="truncate">{user?.email || 'Guest'}</span>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 transition"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
```

### Task 7.2: Update App.tsx Layout

**File**: `src/App.tsx` - Add sidebar for authenticated users
```typescript
// After auth check, wrap routes with sidebar
if (user) {
  return (
    <div className="h-full flex overflow-hidden bg-white">
      <MinimalSidebar
        user={user}
        onNewChat={() => navigate('/')}
        onShowHistory={() => setShowLibrary(true)}
        onShowSettings={() => navigate('/settings')}
        onShowProfile={() => navigate('/profile')}
        onLogout={() => signOut(auth)}
      />
      
      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <Routes>{/* ... existing routes ... */}</Routes>
      </main>
    </div>
  );
}
```

---

## ⏳ PHASE 8: SELF-AWARE AI (2-3 hours)

### Task 8.1: Create Provider Health Monitor

**New File**: `functions/src/health/providerHealth.ts`
```typescript
import { ProviderId } from '../types';
import { isOllamaAvailable } from '../providers/ollama';

export interface ProviderCapability {
  providerId: ProviderId;
  available: boolean;
  requiresApiKey: boolean;
  isFree: boolean;
  capabilities: string[];
  lastChecked: number;
}

export async function checkAllProviders(): Promise<Record<ProviderId, ProviderCapability>> {
  const ollamaAvailable = await isOllamaAvailable();
  
  return {
    ollama: {
      providerId: 'ollama',
      available: ollamaAvailable,
      requiresApiKey: false,
      isFree: true,
      capabilities: ['chat', 'vision'],
      lastChecked: Date.now(),
    },
    pollinations: {
      providerId: 'pollinations',
      available: true,
      requiresApiKey: false,
      isFree: true,
      capabilities: ['image'],
      lastChecked: Date.now(),
    },
    // ... other providers
  };
}
```

### Task 8.2: Update System Prompt with Capability Awareness

**File**: `src/lib/ai.ts` - Update `EDO_SYSTEM_INSTRUCTION`
```typescript
export const EDO_SYSTEM_INSTRUCTION = `You are 9JAI — Africa's smartest AI, built in Nigeria for the world.

## CAPABILITIES
I can help with:
- ✅ Chat and conversation (FREE - Ollama)
- ✅ Image generation (FREE - Pollinations)
- ✅ Voice recognition (FREE - Browser)
- ✅ Text-to-speech (FREE - Browser)
- ✅ OCR text extraction (FREE - Tesseract)
- ✅ Image understanding (FREE - Ollama vision)
- ✅ Web search (FREE - DuckDuckGo)
- ✅ Current time and weather (FREE)

All my core features work without any API keys or payment.

// ... rest of instruction
`;
```

---

## ⏳ PHASE 10: END-TO-END TESTING (4-6 hours)

Create comprehensive test suite in:
**New File**: `ACCEPTANCE_TESTS.md`

Document all 21 tests from directive Part 38:
1. UI Test
2. Auth Test
3. Chat Test
4. History Test
5. Language Tests (Yoruba, Pidgin)
6. Current Information Tests (President, Time, Weather, News, Sports)
7. Feature Tests (Image, Video, Vision, OCR, Voice, TTS, Search)
8. Learning Tests (Correction, Memory)
9. Sidebar Test

---

## 🚀 DEPLOYMENT CHECKLIST

Before deploying:
1. ✅ Install Ollama and pull models
2. ✅ Install Tesseract.js: `npm install tesseract.js`
3. ✅ Build functions: `npm run build`
4. ✅ Deploy: `firebase deploy --only functions`
5. ✅ Test all endpoints
6. ✅ Run acceptance tests

---

## 📊 FINAL STATUS AFTER ALL PHASES

| Feature | FREE Provider | Status |
|---------|---------------|--------|
| Chat | Ollama | ✅ FREE |
| Images | Pollinations | ✅ FREE |
| STT | Browser API | ✅ FREE |
| TTS | Browser API | ✅ FREE |
| Vision | Ollama llava | ✅ FREE |
| OCR | Tesseract.js | ✅ FREE |
| Search | DuckDuckGo | ✅ FREE |
| Time | Node.js Date | ✅ FREE |
| Weather | Open-Meteo | ✅ FREE |

**FREE-FIRST COMPLIANCE**: 100% ✅

---

**END OF IMPLEMENTATION GUIDE**
**Use this guide to complete Phases 4-10**
