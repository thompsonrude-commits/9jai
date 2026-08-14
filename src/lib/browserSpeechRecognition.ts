/**
 * Browser Web Speech Recognition - FREE-FIRST STT
 * No API key required, client-side only
 * 
 * Supported browsers:
 * - Chrome/Edge (full support)
 * - Safari (iOS 14.5+, macOS 12+)
 * - Firefox (not supported)
 */

export interface BrowserRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export interface BrowserRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Check if browser supports Web Speech Recognition
 */
export function isBrowserSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!(( window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

/**
 * Get SpeechRecognition constructor
 */
function getSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

function getSanitizedSpeechError(errorCode?: string): string {
  switch (errorCode) {
    case 'not-allowed':
      return 'Microphone permission is blocked. Please allow microphone access in your browser settings.';
    case 'no-speech':
      return 'No speech was detected. Please try again.';
    case 'audio-capture':
      return 'The microphone is not available right now. Please check your device settings and try again.';
    case 'network':
      return 'Voice input is temporarily unavailable. Please try again in a moment.';
    case 'aborted':
      return 'Voice input was interrupted. Please try again.';
    case 'language-not-supported':
      return 'This language is not available for browser voice input. Please use your selected language or try again in English.';
    default:
      return 'Voice input is unavailable right now. Please try again.';
  }
}

/**
 * Start browser speech recognition
 * Returns a stop function to cancel recognition
 */
export function startBrowserRecognition(
  onResult: (result: BrowserRecognitionResult) => void,
  onError?: (error: Error) => void,
  options: BrowserRecognitionOptions = {}
): () => void {
  const SpeechRecognition = getSpeechRecognition();
  
  if (!SpeechRecognition) {
    const error = new Error('Browser does not support speech recognition. Try Chrome or Edge.');
    onError?.(error);
    return () => {};
  }
  
  const recognition = new SpeechRecognition();
  
  // Configure recognition
  recognition.continuous = options.continuous ?? false;
  recognition.interimResults = options.interimResults ?? true;
  recognition.lang = options.language ?? 'en-NG'; // Nigerian English default
  recognition.maxAlternatives = options.maxAlternatives ?? 1;
  
  // Handle results
  recognition.onresult = (event: any) => {
    const results = event.results;
    const lastResult = results[results.length - 1];
    
    const transcript = lastResult[0].transcript;
    const confidence = lastResult[0].confidence;
    const isFinal = lastResult.isFinal;
    
    onResult({ transcript, confidence, isFinal });
  };
  
  // Handle errors
  recognition.onerror = (event: any) => {
    const message = getSanitizedSpeechError(event.error);
    const error = new Error(message);
    (error as any).code = event.error;
    
    onError?.(error);
  };
  
  // Handle end (recognition stopped)
  recognition.onend = () => {
    // Auto-restart if continuous mode (but not if manually stopped)
    if (options.continuous && recognition._isActive) {
      try {
        recognition.start();
      } catch {
        // Ignore restart errors
      }
    }
  };
  
  // Start recognition
  try {
    recognition._isActive = true;
    recognition.start();
    console.log('[BrowserSTT] Recognition started');
  } catch (err: any) {
    const error = new Error('Voice input could not be started. Please try again.');
    onError?.(error);
  }
  
  // Return stop function
  return () => {
    try {
      recognition._isActive = false;
      recognition.stop();
      console.log('[BrowserSTT] Recognition stopped');
    } catch {
      // Ignore stop errors
    }
  };
}

/**
 * Start recognition and return a Promise (one-shot mode)
 */
export function recognizeSpeech(
  language = 'en-NG',
  timeout = 30000
): Promise<string> {
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout;
    let stopFn: (() => void) | null = null;
    
    // Set timeout
    timeoutId = setTimeout(() => {
      if (stopFn) stopFn();
      reject(new Error('Speech recognition timed out'));
    }, timeout);
    
    stopFn = startBrowserRecognition(
      (result) => {
        if (result.isFinal) {
          clearTimeout(timeoutId);
          if (stopFn) stopFn();
          resolve(result.transcript);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        if (stopFn) stopFn();
        reject(error);
      },
      {
        language,
        continuous: false,
        interimResults: false,
      }
    );
  });
}

/**
 * Get list of supported languages (approximation - browser doesn't expose this)
 */
export function getSupportedLanguages(): Array<{ code: string; name: string }> {
  return [
    { code: 'en-NG', name: 'English (Nigeria)' },
    { code: 'en-US', name: 'English (United States)' },
    { code: 'en-GB', name: 'English (United Kingdom)' },
    { code: 'yo-NG', name: 'Yoruba (Nigeria)' },
    { code: 'ha-NG', name: 'Hausa (Nigeria)' },
    { code: 'ig-NG', name: 'Igbo (Nigeria)' },
    { code: 'sw', name: 'Swahili' },
    { code: 'ar', name: 'Arabic' },
    { code: 'fr', name: 'French' },
    { code: 'es', name: 'Spanish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
  ];
}

/**
 * Check microphone permission status
 */
export async function checkMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return 'prompt';
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately (we just wanted permission)
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}

