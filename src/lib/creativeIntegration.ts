/**
 * Creative Integration Module
 * Integrates creative content generation into the chat system
 */

import {
  detectCreativeRequest,
  extractCreativeParameters,
  generateCreativeContent,
  CreativePrompt,
} from './creativeContentGenerator';

export interface CreativeRequest {
  isCreative: boolean;
  type?: CreativePrompt['type'];
  theme?: string;
  language: string;
  languageName: string;
  languageId: string;
}

/**
 * Analyze user message for creative requests
 */
export function analyzeForCreativeRequest(
  message: string,
  language: string,
  languageName: string,
  languageId: string
): CreativeRequest {
  const detection = detectCreativeRequest(message);

  if (!detection.isCreative) {
    return {
      isCreative: false,
      language,
      languageName,
      languageId,
    };
  }

  const params = extractCreativeParameters(message);

  return {
    isCreative: true,
    type: detection.type,
    theme: detection.theme || message,
    language,
    languageName,
    languageId,
    ...params,
  };
}

/**
 * Build creative prompt from user request
 */
export function buildCreativePrompt(
  request: CreativeRequest
): CreativePrompt {
  return {
    type: request.type || 'lyrics',
    theme: request.theme || 'Untitled',
    language: request.language,
    languageName: request.languageName,
    style: (request as any).style,
    mood: (request as any).mood,
    genre: (request as any).genre,
    additionalContext: (request as any).additionalContext,
  };
}

/**
 * Format creative content for display in chat
 */
export function formatCreativeContent(
  type: string,
  content: string
): string {
  switch (type) {
    case 'lyrics':
      return `🎵 **Music Lyrics**\n\n${content}`;
    case 'poetry':
      return `📝 **Poetry**\n\n${content}`;
    case 'story':
    case 'cultural-narrative':
      return `📖 **Cultural Story**\n\n${content}`;
    case 'suno':
      return `🎼 **Suno Music Prompt**\n\n${content}`;
    default:
      return content;
  }
}

/**
 * Detect if message contains creative keywords
 */
export function hasCreativeKeywords(message: string): boolean {
  const keywords = [
    'write', 'compose', 'create', 'generate', 'make',
    'lyrics', 'song', 'poem', 'poetry', 'story', 'narrative',
    'suno', 'music', 'verse', 'rhyme', 'cultural',
    'folklore', 'traditional', 'tale', 'art', 'creative',
  ];

  const lower = message.toLowerCase();
  return keywords.some(keyword => lower.includes(keyword));
}

/**
 * Extract theme from creative request
 */
export function extractTheme(message: string): string {
  // Remove creative keywords to get the theme
  const keywords = [
    'write', 'compose', 'create', 'generate', 'make',
    'lyrics', 'song', 'poem', 'poetry', 'story', 'narrative',
    'suno', 'music', 'verse', 'rhyme', 'cultural',
    'folklore', 'traditional', 'tale', 'art', 'creative',
    'about', 'for', 'in', 'with', 'on',
  ];

  let theme = message;
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    theme = theme.replace(regex, '').trim();
  });

  return theme.trim() || message;
}

/**
 * Suggest creative content types based on message
 */
export function suggestCreativeTypes(message: string): CreativePrompt['type'][] {
  const lower = message.toLowerCase();
  const suggestions: CreativePrompt['type'][] = [];

  if (lower.includes('lyrics') || lower.includes('song')) suggestions.push('lyrics');
  if (lower.includes('poem') || lower.includes('poetry') || lower.includes('verse')) suggestions.push('poetry');
  if (lower.includes('story') || lower.includes('narrative') || lower.includes('tale')) suggestions.push('story');
  if (lower.includes('suno') || lower.includes('music prompt')) suggestions.push('suno');
  if (lower.includes('cultural') || lower.includes('folklore') || lower.includes('traditional')) suggestions.push('cultural-narrative');

  return suggestions.length > 0 ? suggestions : ['lyrics'];
}

/**
 * Build system prompt for creative mode
 */
export function buildCreativeSystemPrompt(languageName: string): string {
  return `You are 9jai Creative, an advanced AI specialized in generating unique, culturally-authentic creative content in ${languageName}.

## CONVERSATIONAL ACCENT SIMULATION
- Simulate authentic Nigerian English conversational rhythm.
- Inject phrases like "How far?", "Abeg", "No wahala" to increase cultural warmth.
- Use phonetic adjustments to reflect Nigerian speech patterns.
- Pacing should be natural and engaging, not artificial.

## YOUR CREATIVE EXPERTISE

### 1. Music Lyrics Generation
- Create original lyrics with authentic rhyme schemes and meter
- Understand genre conventions (pop, hip-hop, R&B, traditional, etc.)
- Maintain emotional arcs and narrative flow
- Use cultural references and local idioms naturally
- Generate memorable hooks and choruses

### 2. Poetry & Verse
- Write in multiple poetic forms (free verse, haiku, sonnet, etc.)
- Use metaphor, imagery, and symbolism effectively
- Create emotional depth and resonance
- Maintain consistent meter and rhythm when appropriate

### 3. Cultural Narratives & Stories
- Write authentic cultural stories and folklore
- Preserve traditional storytelling elements
- Include cultural wisdom and lessons
- Use appropriate language registers

### 4. Suno Prompt Engineering
- Create detailed, actionable music generation prompts
- Specify musical elements (genre, BPM, instrumentation)
- Include emotional descriptors and mood
- Suggest vocal styles and characteristics

## GENERATION TECHNIQUES

### For Lyrics:
1. Identify the core emotional message
2. Choose appropriate rhyme scheme (AABB, ABAB, ABCB, etc.)
3. Determine syllable patterns for natural rhythm
4. Create memorable hooks and choruses
5. Build verses with narrative or emotional progression
6. Add cultural elements and local references
7. Refine for flow and singability

### For Poetry:
1. Choose poetic form and structure
2. Identify central imagery and metaphors
3. Determine meter and rhythm
4. Create emotional progression
5. Use language for maximum impact

### For Stories:
1. Establish setting and characters
2. Create narrative arc
3. Include cultural elements
4. Build tension and resolution
5. Include wisdom or lesson

### For Suno Prompts:
1. Identify core musical concept
2. Specify genre and style
3. Determine mood and energy
4. Choose instrumentation
5. Specify vocal characteristics
6. Include production details

## RESPONSE FORMAT

Always format your response clearly with:
- Title/Name
- Type (Lyrics/Poetry/Story/Suno Prompt)
- Main content
- Metadata (rhyme scheme, mood, cultural elements, etc.)

## TONE

- Authentic and culturally grounded
- Creative and imaginative
- Emotionally resonant
- Technically skilled
- Respectful of cultural traditions

Now, let's create something beautiful and unique!`;
}
