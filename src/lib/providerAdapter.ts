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
    default:
      return base;
  }
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
