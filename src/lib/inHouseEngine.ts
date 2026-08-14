import { getLocalFallbackResponse } from './fallbackResponses';
import { buildLocalCapabilityMessage, sanitizeUserFacingText, type Capability } from './providerAdapter';

export interface InHouseResult {
  text: string;
  source: 'local' | 'browser' | 'fallback';
  capability: Capability;
}

export function getInHouseReply(capability: Capability, input: string): InHouseResult {
  const trimmed = (input || '').trim();
  const safeInput = sanitizeUserFacingText(trimmed);

  if (capability === 'chat' || capability === 'language') {
    return {
      text: getLocalFallbackResponse(safeInput || 'Hello'),
      source: 'local',
      capability,
    };
  }

  return {
    text: buildLocalCapabilityMessage(capability, safeInput || 'How can I help?'),
    source: 'fallback',
    capability,
  };
}

export function hasBrowserCapability(capability: Capability): boolean {
  if (typeof window === 'undefined') return false;

  switch (capability) {
    case 'weather':
      return 'geolocation' in navigator;
    case 'time':
      return true;
    case 'camera':
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    case 'stt':
      return !!(
        'SpeechRecognition' in window ||
        'webkitSpeechRecognition' in window
      );
    case 'tts':
      return 'speechSynthesis' in window;
    default:
      return true;
  }
}
