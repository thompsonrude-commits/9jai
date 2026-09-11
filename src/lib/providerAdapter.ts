export type Capability =
  | 'chat'
  | 'language'
  | 'vision'
  | 'ocr'
  | 'search'
  | 'research'
  | 'weather'
  | 'time'
  | 'stt'
  | 'tts'
  | 'camera'
  | 'image'
  | 'document'
  | 'music'
  | 'visual';

export type EngineRoute = 'browser' | 'local' | 'external' | 'fallback';

const BLOCKED_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
]);

export function sanitizeUserFacingText(input: string): string {
  return (input || '')
    .replace(/<\s*think[^>]*>.*?<\s*\/\s*think\s*>/gis, '')
    .replace(/<\s*think[^>]*\/?>/gis, '')
    .replace(/\b(?:Access Token|Authorization|Bearer|x-api-key|api[_-]?key|secret|token)\b[^\n\r]*/gi, '[redacted]')
    .replace(/https?:\/\/[^\s]+/gi, '[external link redacted]')
    .replace(/\b(?:HTTP\s*403|401|404|408|429|500|502|503|504)\b/gi, 'service unavailable')
    .replace(/\b(?:stack trace|traceback|TypeError|ReferenceError|SyntaxError)\b/gi, 'internal error')
    .trim();
}

export function isBlockedProviderEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    return BLOCKED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function getEngineRouteOrder(capability: Capability): EngineRoute[] {
  const base: EngineRoute[] = ['local', 'browser', 'external', 'fallback'];

  switch (capability) {
    case 'weather':
      return ['browser', 'local', 'external', 'fallback'];
    case 'time':
      return ['browser', 'local', 'external', 'fallback'];
    case 'camera':
      return ['browser', 'local', 'external', 'fallback'];
    case 'stt':
      return ['browser', 'local', 'external', 'fallback'];
    case 'tts':
      return ['browser', 'local', 'external', 'fallback'];
    case 'vision':
    case 'ocr':
    case 'document':
      return ['local', 'browser', 'external', 'fallback'];
    case 'search':
    case 'research':
      return ['local', 'browser', 'external', 'fallback'];
    case 'image':
    case 'visual':
      return ['local', 'browser', 'external', 'fallback'];
    case 'music':
      return ['local', 'browser', 'external', 'fallback'];
    default:
      return base;
  }
}

export interface ClassifiedIntent {
  capability: Capability;
  confidence: number;
  targetLanguage?: string;
  normalizedPrompt: string;
  secondaryCapabilities?: Capability[];
}

function buildSecondaryCapabilities(primary: Capability, detected: Capability[]): Capability[] {
  return Array.from(new Set(detected.filter((item) => item !== primary)));
}

export function classifyUserIntent(input: string): ClassifiedIntent {
  const text = (input || '').trim();
  const normalized = text.replace(/\s+/g, ' ').trim();
  const lower = normalized.toLowerCase();

  if (!normalized) {
    return { capability: 'chat', confidence: 0.1, normalizedPrompt: '' };
  }

  const detected: Capability[] = [];
  const translationMatch = /(translate|translation|translat(e|ion)|into\s+(?:edo|yoruba|igbo|hausa|pidgin|english))/i.exec(lower);
  if (translationMatch) {
    detected.push('language');
  }
  const imageMatch = /(generate|create|make|draw|paint|design|render|illustrate|logo|poster|banner|picture|image|photo|artwork|visual|diagram|chart|graph|infographic)/i.exec(lower);
  if (imageMatch) {
    detected.push('image');
  }
  const musicMatch = /(song|music|beat|lyrics|instrumental|afrobeats|afrobeat|amapiano|highlife|gospel|hip[- ]?hop|r&b|reggae|dancehall|compose|melody|track|mix|master|vocal)/i.exec(lower);
  if (musicMatch) {
    detected.push('music');
  }
  // Only trigger search for EXPLICIT search requests — not "latest" alone which appears in many factual questions
  const searchMatch = /(search( the web| for| this)?|latest news|breaking news|what's new today|find information online|look up on the web|browse the web|web search|news today)/i.exec(lower);
  if (searchMatch) {
    detected.push('search');
  }
  const documentMatch = /(pdf|docx?|excel|sheet|spreadsheet|csv|xlsx|pptx?|document|report|table|extract|analyz(e|ing) this (pdf|document|spreadsheet)|clean this spreadsheet|summarize.*(pdf|document|sheet))/i.exec(lower);
  if (documentMatch) {
    detected.push('document');
  }
  const ocrMatch = /(ocr|scan|read this image|extract text|caption|image text|document image|analyze image|describe this image|what is in this picture)/i.exec(lower);
  if (ocrMatch) {
    detected.push('ocr');
  }
  const voiceMatch = /(speak|voice|read aloud|narration|text to speech|tts|audio|transcrib(e|ing)|voiceover|record)/i.exec(lower);
  if (voiceMatch) {
    detected.push('tts');
  }
  const visionMatch = /(analyz(e|ing) this image|describe the image|image understanding|vision|visual question|what is in the image|object recognition|scene analysis)/i.exec(lower);
  if (visionMatch) {
    detected.push('vision');
  }
  const weatherMatch = /(weather|temperature|forecast|rain|sunny|humidity)/i.exec(lower);
  if (weatherMatch) {
    detected.push('weather');
  }

  const priority: Capability[] = ['language', 'image', 'music', 'search', 'document', 'ocr', 'tts', 'vision', 'weather', 'chat'];
  const primary = priority.find((capability) => detected.includes(capability)) ?? 'chat';

  const baseResult: ClassifiedIntent = {
    capability: primary,
    confidence: primary === 'chat' ? 0.6 : 0.9,
    normalizedPrompt: normalized,
    secondaryCapabilities: buildSecondaryCapabilities(primary, detected),
  };

  if (primary === 'language') {
    const languageMatch = lower.match(/(?:into|to)\s+(edo|yoruba|igbo|hausa|pidgin|english|nigerian pidgin)/i);
    return { ...baseResult, targetLanguage: languageMatch ? languageMatch[1].toLowerCase() : undefined, confidence: 0.92 };
  }

  if (primary === 'image') {
    return { ...baseResult, confidence: 0.94 };
  }

  if (primary === 'music') {
    return { ...baseResult, confidence: 0.91 };
  }

  if (primary === 'search') {
    return { ...baseResult, confidence: 0.9 };
  }

  if (primary === 'document') {
    return { ...baseResult, confidence: 0.88 };
  }

  if (primary === 'ocr') {
    return { ...baseResult, confidence: 0.87 };
  }

  if (primary === 'tts') {
    return { ...baseResult, confidence: 0.8 };
  }

  if (primary === 'vision') {
    return { ...baseResult, confidence: 0.86 };
  }

  if (primary === 'weather') {
    return { ...baseResult, confidence: 0.74 };
  }

  return baseResult;
}

export function buildLocalCapabilityMessage(capability: Capability, userInput: string): string {
  const text = (userInput || '').trim();

  switch (capability) {
    case 'weather':
      return 'I cannot access live weather right now, but I can still help with the local weather question once your browser location or a trusted weather source becomes available.';
    case 'time':
      return 'I do not have a live clock source right now, but your device time remains available in the browser when it is ready.';
    case 'search':
    case 'research':
      return 'Live web access is unavailable right now, so I cannot verify current search results. I can still help with local knowledge and explain what I know clearly.';
    case 'vision':
    case 'ocr':
    case 'document':
      return 'Visual analysis is temporarily unavailable. I can still help you describe the image conceptually, but I cannot verify the exact visual details without a working local or remote vision engine.';
    case 'camera':
      return 'Camera access is unavailable right now. Please allow camera permission in your browser and try again.';
    case 'stt':
      return 'Voice input is unavailable right now because microphone access is not available or the browser does not support it.';
    case 'tts':
      return 'Voice playback is unavailable right now. The text response is still available.';
    case 'music':
      return 'The music engine is not fully live in this runtime, but I can still help plan the song structure, genre, lyrics, and production direction.';
    case 'image':
    case 'visual':
      return 'I cannot generate a new visual right now, but I can still explain the concept in text and, when possible, use a local procedural diagram.';
    default:
      return text
        ? `I’m using the local in-house fallback for: “${text}”. The external provider is unavailable, but I can still help.`
        : 'I’m using the local in-house fallback. I can still help while the network provider is unavailable.';
  }
}

export function isExternalProviderAllowed(url: string): boolean {
  return !isBlockedProviderEndpoint(url);
}
