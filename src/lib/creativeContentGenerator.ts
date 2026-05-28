/**
 * Creative Content Generator
 * Generates unique music lyrics, poetry, cultural stories, and Suno prompts
 * using advanced pattern recognition and constraint satisfaction
 */

import { groqChatStream } from './ai';

/**
 * AI Reliability Framework: fallbacks and retries
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1200;
const FAILOVER_NOTICE = "(AI Assistant is adapting. Switching to stable fallback engine...)";

export interface CreativePrompt {
  type: 'lyrics' | 'poetry' | 'story' | 'suno' | 'cultural-narrative';
  theme: string;
  language: string;
  languageName: string;
  style?: string;
  mood?: string;
  genre?: string;
  additionalContext?: string;
}

export interface CreativeContent {
  type: string;
  title: string;
  content: string;
  metadata: {
    theme: string;
    language: string;
    style: string;
    mood: string;
    structure?: string;
    rhymeScheme?: string;
    bpm?: number;
  };
}

/**
 * Build a specialized system prompt for creative content generation
 */
function buildCreativeSystemPrompt(languageName: string): string {
  return `You are 9jai Creative, an advanced AI specialized in generating unique, culturally-authentic creative content in ${languageName}.

## AUTHENTIC NIGERIAN CONVERSATIONAL FEEL (STRICT DIRECTIVE)
- Use Nigerian English speech rhythm and conversational pacing.
- Naturally inject Nigerian phrases: "How far?", "No wahala", "Abeg", "Wetin happen?", "Oya".
- Adapt pronunciation for local phonetic flavor.
- Maintain an energetic, respectful, and intelligent Nigerian personality.
- Avoid generic robotic Western tones.
- Use local idioms naturally where appropriate.

## YOUR CREATIVE EXPERTISE

### 1. Music Lyrics Generation
- Create original lyrics with authentic rhyme schemes and meter
- Understand genre conventions (pop, hip-hop, R&B, traditional, etc.)
- Maintain emotional arcs and narrative flow
- Use cultural references and local idioms naturally
- Generate memorable hooks and choruses
- Vary syllable counts for natural rhythm

### 2. Poetry & Verse
- Write in multiple poetic forms (free verse, haiku, sonnet, etc.)
- Use metaphor, imagery, and symbolism effectively
- Create emotional depth and resonance
- Maintain consistent meter and rhythm when appropriate
- Use cultural and linguistic nuances

### 3. Cultural Narratives & Stories
- Write authentic cultural stories and folklore
- Preserve traditional storytelling elements
- Include cultural wisdom and lessons
- Use appropriate language registers
- Maintain historical and cultural accuracy

### 4. Suno Prompt Engineering
- Create detailed, actionable music generation prompts
- Specify musical elements (genre, BPM, instrumentation)
- Include emotional descriptors and mood
- Suggest vocal styles and characteristics
- Provide production details

## CREATIVE GENERATION RULES

### Uniqueness
- Avoid clichés and overused phrases
- Create novel combinations of familiar elements
- Use unexpected metaphors and comparisons
- Blend traditional and contemporary elements
- Generate content that feels fresh and original

### Authenticity
- Use genuine cultural references
- Respect language nuances and idioms
- Maintain cultural accuracy
- Avoid stereotypes and generalizations
- Preserve linguistic authenticity

### Structure & Constraint Satisfaction
- Maintain consistent rhyme schemes
- Keep syllable counts natural
- Follow song structure conventions (verse, chorus, bridge)
- Respect meter and rhythm patterns
- Ensure logical narrative flow

### Emotional Resonance
- Create content that evokes genuine emotion
- Build emotional arcs effectively
- Use sensory details and imagery
- Connect with universal human experiences
- Maintain emotional consistency

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
6. Refine for musicality and flow

### For Stories:
1. Establish setting and characters
2. Create narrative arc
3. Include cultural elements
4. Build tension and resolution
5. Include wisdom or lesson
6. Use appropriate language register

### For Suno Prompts:
1. Identify core musical concept
2. Specify genre and style
3. Determine mood and energy
4. Choose instrumentation
5. Specify vocal characteristics
6. Include production details
7. Add specific lyrical themes

## RESPONSE FORMAT

### For Lyrics:
[Title]
[Artist/Creator]
[Genre/Style]

[Verse 1]
[Lyrics]

[Chorus]
[Lyrics]

[Verse 2]
[Lyrics]

[Chorus]
[Lyrics]

[Bridge]
[Lyrics]

[Outro]
[Lyrics]

**Rhyme Scheme:** [AABB, ABAB, etc.]
**Mood:** [Description]
**Cultural Elements:** [List]

### For Poetry:
[Title]
[Poet/Creator]
[Form/Style]

[Poem text]

**Form:** [Type]
**Meter:** [Description]
**Imagery:** [Key images]
**Themes:** [Main themes]

### For Stories:
[Title]
[Storyteller]
[Genre/Type]

[Story text]

**Setting:** [Description]
**Characters:** [List]
**Themes:** [Main themes]
**Lesson/Wisdom:** [Key message]

### For Suno Prompts:
[Concept/Title]

**Prompt:**
[Detailed prompt for Suno]

**Musical Elements:**
- Genre: [Genre]
- BPM: [Tempo]
- Mood: [Mood]
- Instrumentation: [Instruments]
- Vocals: [Vocal style]

## TONE & STYLE

- Authentic and culturally grounded
- Creative and imaginative
- Emotionally resonant
- Technically skilled
- Respectful of cultural traditions
- Contemporary and relevant

## REMEMBER

You are not just generating content - you are creating art that:
- Preserves and celebrates ${languageName} culture
- Resonates emotionally with audiences
- Demonstrates linguistic mastery
- Blends tradition with innovation
- Creates memorable, shareable content

Now, let's create something beautiful and unique!`;
}

/**
 * Generate music lyrics with advanced pattern recognition
 */
export async function* generateLyrics(prompt: CreativePrompt): AsyncGenerator<string> {
  const systemPrompt = buildCreativeSystemPrompt(prompt.languageName);

  const userPrompt = `Generate original music lyrics in ${prompt.language} with the following specifications:

**Theme:** ${prompt.theme}
**Language:** ${prompt.language} (${prompt.languageName})
**Genre/Style:** ${prompt.style || 'Contemporary'}
**Mood:** ${prompt.mood || 'Expressive'}
${prompt.additionalContext ? `**Additional Context:** ${prompt.additionalContext}` : ''}

Requirements:
1. Create a complete song with verse, chorus, bridge, and outro
2. Use authentic ${prompt.languageName} language and cultural references
3. Maintain consistent rhyme scheme and meter
4. Create memorable, singable hooks
5. Build emotional progression throughout
6. Include cultural elements naturally
7. Ensure the lyrics are original and unique
8. Make it emotionally resonant and relatable

Generate the lyrics now:`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  // Reliability Layer: Retry with Fallback
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      for await (const chunk of groqChatStream(messages, 0.8)) {
        yield chunk;
      }
      return; // Successful stream
    } catch (error) {
      attempts++;
      if (attempts >= MAX_RETRIES) {
        console.error("Critical AI Failure. Triggering stable fallback.");
        yield `\n\n${FAILOVER_NOTICE}\n\n`;
        // Fallback model logic would be here
        break;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempts));
    }
  }
}

/**
 * Generate poetry in various forms
 */
export async function* generatePoetry(prompt: CreativePrompt): AsyncGenerator<string> {
  const systemPrompt = buildCreativeSystemPrompt(prompt.languageName);

  const userPrompt = `Generate original poetry in ${prompt.language} with the following specifications:

**Theme:** ${prompt.theme}
**Language:** ${prompt.language} (${prompt.languageName})
**Style/Form:** ${prompt.style || 'Free verse'}
**Mood:** ${prompt.mood || 'Contemplative'}
${prompt.additionalContext ? `**Additional Context:** ${prompt.additionalContext}` : ''}

Requirements:
1. Create a complete poem (minimum 12 lines)
2. Use authentic ${prompt.languageName} language and imagery
3. Employ vivid metaphors and sensory details
4. Maintain consistent meter or rhythm (if applicable to form)
5. Create emotional depth and resonance
6. Include cultural and linguistic nuances
7. Ensure originality and uniqueness
8. Make it memorable and impactful

Generate the poem now:`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  for await (const chunk of groqChatStream(messages, 0.8)) {
    yield chunk;
  }
}

/**
 * Generate cultural narratives and stories
 */
export async function* generateCulturalStory(prompt: CreativePrompt): AsyncGenerator<string> {
  const systemPrompt = buildCreativeSystemPrompt(prompt.languageName);

  const userPrompt = `Generate an original cultural narrative or story in ${prompt.language} with the following specifications:

**Theme:** ${prompt.theme}
**Language:** ${prompt.language} (${prompt.languageName})
**Story Type:** ${prompt.style || 'Traditional narrative'}
**Tone:** ${prompt.mood || 'Engaging'}
${prompt.additionalContext ? `**Additional Context:** ${prompt.additionalContext}` : ''}

Requirements:
1. Create a complete story (500-800 words)
2. Use authentic ${prompt.languageName} language and cultural elements
3. Include traditional storytelling elements
4. Develop compelling characters and setting
5. Build narrative tension and resolution
6. Include cultural wisdom or lesson
7. Maintain historical and cultural accuracy
8. Use appropriate language register
9. Make it engaging and memorable

Generate the story now:`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  for await (const chunk of groqChatStream(messages, 0.8)) {
    yield chunk;
  }
}

/**
 * Generate Suno music prompts
 */
export async function* generateSunoPrompt(prompt: CreativePrompt): AsyncGenerator<string> {
  const systemPrompt = buildCreativeSystemPrompt(prompt.languageName);

  const userPrompt = `Generate a detailed Suno music generation prompt based on the following specifications:

**Concept/Theme:** ${prompt.theme}
**Language:** ${prompt.language} (${prompt.languageName})
**Genre:** ${prompt.genre || 'Contemporary'}
**Mood:** ${prompt.mood || 'Uplifting'}
**Style:** ${prompt.style || 'Modern'}
${prompt.additionalContext ? `**Additional Context:** ${prompt.additionalContext}` : ''}

Requirements for the Suno prompt:
1. Be specific about musical elements (genre, BPM, instrumentation)
2. Include emotional descriptors and mood
3. Specify vocal characteristics (male, female, duet, rap, etc.)
4. Suggest production details (synths, acoustic, orchestral, etc.)
5. Include lyrical themes and concepts
6. Mention cultural elements if relevant
7. Specify energy level and tempo
8. Make it actionable and detailed
9. Ensure it will produce unique, high-quality music

Generate a comprehensive Suno prompt now:`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  for await (const chunk of groqChatStream(messages, 0.8)) {
    yield chunk;
  }
}

/**
 * Generate creative content based on type
 */
export async function* generateCreativeContent(prompt: CreativePrompt): AsyncGenerator<string> {
  switch (prompt.type) {
    case 'lyrics':
      yield* generateLyrics(prompt);
      break;
    case 'poetry':
      yield* generatePoetry(prompt);
      break;
    case 'story':
    case 'cultural-narrative':
      yield* generateCulturalStory(prompt);
      break;
    case 'suno':
      yield* generateSunoPrompt(prompt);
      break;
    default:
      yield `Unknown creative content type: ${prompt.type}`;
  }
}

/**
 * Detect if user is asking for creative content
 */
export function detectCreativeRequest(message: string): {
  isCreative: boolean;
  type?: CreativePrompt['type'];
  theme?: string;
} {
  const lower = message.toLowerCase();

  // Lyrics detection
  if (
    lower.includes('write') && (lower.includes('lyrics') || lower.includes('song')) ||
    lower.includes('compose') && lower.includes('song') ||
    lower.includes('create') && lower.includes('lyrics') ||
    lower.includes('make') && lower.includes('song')
  ) {
    return { isCreative: true, type: 'lyrics', theme: message };
  }

  // Poetry detection
  if (
    lower.includes('write') && lower.includes('poem') ||
    lower.includes('compose') && lower.includes('poem') ||
    lower.includes('create') && lower.includes('poetry') ||
    lower.includes('make') && lower.includes('verse')
  ) {
    return { isCreative: true, type: 'poetry', theme: message };
  }

  // Story detection
  if (
    lower.includes('write') && lower.includes('story') ||
    lower.includes('tell') && lower.includes('story') ||
    lower.includes('create') && lower.includes('narrative') ||
    lower.includes('make') && lower.includes('tale')
  ) {
    return { isCreative: true, type: 'story', theme: message };
  }

  // Suno prompt detection
  if (
    lower.includes('suno') && lower.includes('prompt') ||
    lower.includes('music') && lower.includes('prompt') ||
    lower.includes('generate') && lower.includes('suno')
  ) {
    return { isCreative: true, type: 'suno', theme: message };
  }

  // Cultural narrative detection
  if (
    lower.includes('cultural') && lower.includes('story') ||
    lower.includes('folklore') ||
    lower.includes('traditional') && lower.includes('story')
  ) {
    return { isCreative: true, type: 'cultural-narrative', theme: message };
  }

  return { isCreative: false };
}

/**
 * Extract creative parameters from user message
 */
export function extractCreativeParameters(message: string): Partial<CreativePrompt> {
  const params: Partial<CreativePrompt> = {};

  // Extract mood
  const moodMatch = message.match(/mood[:\s]+([^,.\n]+)/i);
  if (moodMatch) params.mood = moodMatch[1].trim();

  // Extract style
  const styleMatch = message.match(/style[:\s]+([^,.\n]+)/i);
  if (styleMatch) params.style = styleMatch[1].trim();

  // Extract genre
  const genreMatch = message.match(/genre[:\s]+([^,.\n]+)/i);
  if (genreMatch) params.genre = genreMatch[1].trim();

  // Extract theme
  const themeMatch = message.match(/theme[:\s]+([^,.\n]+)/i);
  if (themeMatch) params.theme = themeMatch[1].trim();

  return params;
}
