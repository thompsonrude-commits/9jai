/**
 * Self-Aware AI System Prompts
 * 
 * Generates dynamic system prompts based on available capabilities
 * Makes AI aware of what it can and cannot do
 */

import { getSystemCapabilities, getCapabilityExplanation } from './providerHealth';

export interface SelfAwareContext {
  capabilities: string;
  limitations: string;
  suggestions: string;
}

/**
 * Build self-aware system prompt addition
 */
export async function buildSelfAwarePrompt(): Promise<string> {
  const capabilities = await getSystemCapabilities();
  const explanation = await getCapabilityExplanation();
  
  let prompt = '\n\n# MY CURRENT CAPABILITIES\n';
  prompt += explanation;
  
  // Add specific guidance based on what's available
  if (!capabilities.vision) {
    prompt += '\nI cannot analyze images right now. Vision AI is unavailable.';
  }
  
  if (!capabilities.ocr) {
    prompt += '\nI cannot read text from images right now. OCR is unavailable.';
  }
  
  if (!capabilities.search) {
    prompt += '\nI cannot search the web right now. Search is unavailable.';
  }
  
  if (!capabilities.chat) {
    prompt += '\nMy chat capabilities are limited. Main chat AI is unavailable.';
  }
  
  // Add what IS available
  prompt += '\n\n# WHAT I CAN DO RIGHT NOW:\n';
  const available: string[] = [];
  
  if (capabilities.chat) available.push('- Have conversations and answer questions');
  if (capabilities.vision) available.push('- Analyze and describe images');
  if (capabilities.ocr) available.push('- Read text from images and documents');
  if (capabilities.search) available.push('- Search the web for current information');
  if (capabilities.time) available.push('- Tell you the current time in any timezone');
  if (capabilities.weather) available.push('- Get weather forecasts for any location');
  if (capabilities.imageGeneration) available.push('- Generate images from descriptions');
  if (capabilities.textToSpeech) available.push('- Read text aloud (text-to-speech)');
  if (capabilities.speechToText) available.push('- Listen to your voice (speech recognition)');
  if (capabilities.translation) available.push('- Translate between languages');
  
  if (available.length > 0) {
    prompt += available.join('\n');
  } else {
    prompt += '- Basic conversation (limited mode)';
  }
  
  prompt += '\n\nIf a user asks for something I cannot do, I will politely explain that the feature is currently unavailable and suggest alternatives.';
  
  return prompt;
}

/**
 * Build capability-specific response
 */
export async function buildCapabilityResponse(
  requestedFeature: 'vision' | 'ocr' | 'search' | 'weather' | 'time' | 'image' | 'chat'
): Promise<string> {
  const capabilities = await getSystemCapabilities();
  
  const featureMap: Record<string, keyof typeof capabilities> = {
    vision: 'vision',
    ocr: 'ocr',
    search: 'search',
    weather: 'weather',
    time: 'time',
    image: 'imageGeneration',
    chat: 'chat',
  };
  
  const capabilityKey = featureMap[requestedFeature];
  const isAvailable = capabilities[capabilityKey];
  
  if (isAvailable) {
    return ''; // Feature is available, no special message needed
  }
  
  // Feature not available - provide helpful message
  const messages: Record<string, string> = {
    vision: 'I cannot analyze images right now because the vision AI system is unavailable. This feature requires Ollama with the llava model. Please ask the administrator to install it.',
    ocr: 'I cannot read text from images right now because the OCR system is unavailable. This feature requires Tesseract.js. Please try again later.',
    search: 'I cannot search the web right now because the search system is unavailable. I can still answer questions from my training data.',
    weather: 'I cannot get weather information right now because the weather service is unavailable. Please try again later.',
    time: 'I cannot get the current time right now. This is unusual since time should always be available.',
    image: 'I cannot generate images right now because the image generation system is unavailable. Please try again later.',
    chat: 'My conversation capabilities are limited right now because the main AI system is unavailable. Responses may be basic.',
  };
  
  return messages[requestedFeature] || 'This feature is currently unavailable.';
}

/**
 * Detect if user is asking for unavailable feature
 */
export async function detectUnavailableFeatureRequest(
  userMessage: string
): Promise<{ feature: string; message: string } | null> {
  const capabilities = await getSystemCapabilities();
  const lower = userMessage.toLowerCase();
  
  // Check for vision requests
  if ((lower.includes('image') || lower.includes('picture') || lower.includes('photo')) && 
      (lower.includes('analyze') || lower.includes('see') || lower.includes('look at') || lower.includes('what'))) {
    if (!capabilities.vision) {
      return {
        feature: 'vision',
        message: await buildCapabilityResponse('vision'),
      };
    }
  }
  
  // Check for OCR requests
  if ((lower.includes('read') || lower.includes('extract')) && 
      (lower.includes('text') || lower.includes('image') || lower.includes('document'))) {
    if (!capabilities.ocr) {
      return {
        feature: 'ocr',
        message: await buildCapabilityResponse('ocr'),
      };
    }
  }
  
  // Check for search requests
  if (lower.includes('search') || lower.includes('find on') || lower.includes('look up') || 
      lower.includes('latest') || lower.includes('current') || lower.includes('news')) {
    if (!capabilities.search) {
      return {
        feature: 'search',
        message: await buildCapabilityResponse('search'),
      };
    }
  }
  
  // Check for weather requests
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast')) {
    if (!capabilities.weather) {
      return {
        feature: 'weather',
        message: await buildCapabilityResponse('weather'),
      };
    }
  }
  
  // Check for time requests
  if (lower.includes('time') || lower.includes('what time') || lower.includes('current time')) {
    if (!capabilities.time) {
      return {
        feature: 'time',
        message: await buildCapabilityResponse('time'),
      };
    }
  }
  
  // Check for image generation requests
  if ((lower.includes('generate') || lower.includes('create') || lower.includes('make')) && 
      (lower.includes('image') || lower.includes('picture') || lower.includes('photo') || lower.includes('art'))) {
    if (!capabilities.imageGeneration) {
      return {
        feature: 'image',
        message: await buildCapabilityResponse('image'),
      };
    }
  }
  
  return null; // No unavailable feature detected
}

/**
 * Get system status message for AI
 */
export async function getSystemStatusMessage(): Promise<string> {
  const capabilities = await getSystemCapabilities();
  
  const total = Object.keys(capabilities).length;
  const available = Object.values(capabilities).filter(Boolean).length;
  const percentage = Math.round((available / total) * 100);
  
  let status = `System Status: ${available}/${total} features available (${percentage}%).\n`;
  
  if (percentage === 100) {
    status += 'All systems operational. ✅';
  } else if (percentage >= 75) {
    status += 'Most systems operational. Some features may be limited. 🟡';
  } else if (percentage >= 50) {
    status += 'Running in reduced capability mode. Several features unavailable. 🟠';
  } else {
    status += 'Running in minimal mode. Many features unavailable. 🔴';
  }
  
  return status;
}

/**
 * Build help message based on capabilities
 */
export async function buildHelpMessage(): Promise<string> {
  const capabilities = await getSystemCapabilities();
  
  let help = '# What I Can Help You With\n\n';
  
  if (capabilities.chat) {
    help += '💬 **Chat & Conversation**\n';
    help += '- Ask me anything in English or Nigerian languages\n';
    help += '- Get explanations and information\n';
    help += '- Have natural conversations\n\n';
  }
  
  if (capabilities.imageGeneration) {
    help += '🎨 **Image Generation**\n';
    help += '- Create images from text descriptions\n';
    help += '- Generate art, illustrations, designs\n\n';
  }
  
  if (capabilities.vision) {
    help += '👁️ **Vision & Image Analysis**\n';
    help += '- Analyze and describe images\n';
    help += '- Identify objects and scenes\n';
    help += '- Extract information from pictures\n\n';
  }
  
  if (capabilities.ocr) {
    help += '📄 **OCR & Text Recognition**\n';
    help += '- Read text from images\n';
    help += '- Extract text from documents\n';
    help += '- Support for Nigerian languages\n\n';
  }
  
  if (capabilities.search) {
    help += '🔍 **Web Search**\n';
    help += '- Find current information online\n';
    help += '- Get latest news and updates\n';
    help += '- Research topics\n\n';
  }
  
  if (capabilities.weather) {
    help += '🌤️ **Weather**\n';
    help += '- Get current weather for any location\n';
    help += '- 7-day forecasts\n';
    help += '- Temperature, conditions, and more\n\n';
  }
  
  if (capabilities.time) {
    help += '🕐 **Time & Date**\n';
    help += '- Current time in any timezone\n';
    help += '- Nigerian and African cities\n';
    help += '- Date information\n\n';
  }
  
  if (capabilities.textToSpeech) {
    help += '🔊 **Text-to-Speech**\n';
    help += '- Listen to responses\n';
    help += '- Nigerian voice personalities\n\n';
  }
  
  if (capabilities.speechToText) {
    help += '🎤 **Speech Recognition**\n';
    help += '- Talk instead of typing\n';
    help += '- Voice commands\n\n';
  }
  
  if (capabilities.translation) {
    help += '🌍 **Translation**\n';
    help += '- Translate between languages\n';
    help += '- Nigerian languages supported\n\n';
  }
  
  help += '\n**Note**: Features shown above are currently available. Some features may be temporarily unavailable.';
  
  return help;
}
