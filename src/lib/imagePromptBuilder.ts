/**
 * Image Prompt Builder — Enhances prompts for better AI image generation
 *
 * Key rules:
 * 1. NEVER override user-specified race, ethnicity, nationality, skin color
 * 2. NEVER override user-specified colors for objects (cars, clothes, etc.)
 * 3. Add quality suffixes to improve output without changing subject
 * 4. Add Nigerian/African cultural context when appropriate
 */

// ── Ethnicity/nationality markers that should never be overridden ─────────
const EXPLICIT_ETHNICITY = [
  'white man', 'white woman', 'white person', 'white people',
  'black man', 'black woman', 'black person', 'black people',
  'asian man', 'asian woman', 'asian person',
  'arab man', 'arab woman', 'middle eastern',
  'caucasian', 'european', 'african', 'nigerian', 'ghanaian',
  'indian', 'chinese', 'japanese', 'korean',
  'hispanic', 'latino', 'latina',
  'mixed race', 'biracial',
];

// ── Color markers for objects ─────────────────────────────────────────────
const COLOR_TERMS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
  'black', 'white', 'grey', 'gray', 'brown', 'gold', 'silver',
  'dark', 'light', 'bright', 'pale', 'deep', 'navy', 'maroon',
  'crimson', 'teal', 'cyan', 'magenta', 'lime',
];

// ── Nigerian-specific subject enhancements ────────────────────────────────
const NIGERIAN_CONTEXT_MAP: [RegExp, string][] = [
  [/lagos\s+taxi/i,       'Lagos yellow Danfo bus taxi, Nigeria, West Africa, street photography'],
  [/danfo\s*bus?/i,       'Lagos yellow Danfo minibus, crowded Lagos street, Nigeria'],
  [/yellow.*taxi/i,       'bright yellow Lagos taxi cab, Nigeria street'],
  [/keke\s*napep?/i,      'yellow tricycle Keke-NAPEP, Nigeria street'],
  [/buka\s*(restaurant)?/i, 'traditional Nigerian buka restaurant, local food stall'],
  [/agbada/i,             'traditional Yoruba agbada attire, Nigerian cultural dress'],
  [/aso.*oke/i,           'Yoruba aso-oke traditional fabric, Nigeria'],
  [/ankara/i,             'colorful ankara African print fabric, Nigeria'],
  [/niger.*delta/i,       'Niger Delta Nigeria landscape, mangrove forest'],
  [/oba.*palace/i,        'Benin Kingdom royal palace, Edo state Nigeria'],
  [/naija\s+street/i,     'busy Lagos street Nigeria, West Africa'],
];

/**
 * Enhance a user prompt for better image generation without changing the user's intent.
 */
export function enhanceImagePrompt(rawPrompt: string): string {
  let prompt = rawPrompt.trim();
  const lower = prompt.toLowerCase();

  // ── Step 1: Apply Nigerian context substitutions ─────────────────────
  for (const [pattern, replacement] of NIGERIAN_CONTEXT_MAP) {
    if (pattern.test(lower)) {
      // Replace only the matched part, keep the rest of the prompt
      prompt = prompt.replace(pattern, replacement);
      break;
    }
  }

  // ── Step 2: Detect if user specified explicit ethnicity/skin tone ─────
  const hasEthnicity = EXPLICIT_ETHNICITY.some(e => lower.includes(e));

  // ── Step 3: Detect if user specified explicit object colors ───────────
  const hasExplicitColors = COLOR_TERMS.some(c => {
    // Only count colors that are adjacent to nouns (not just "black background")
    const re = new RegExp(`\\b${c}\\s+(car|taxi|bus|shirt|dress|suit|bike|house|bag|phone|watch|shoe|boot|hat|jacket|coat|tie|belt|ring|necklace|bracelet|logo|flag|wall|door|floor|ceiling|roof)\\b`, 'i');
    return re.test(lower);
  });

  // ── Step 4: Build quality suffix without overriding user descriptors ──
  const qualitySuffix = [
    'highly detailed',
    'sharp focus',
    '4K resolution',
    'professional photography',
    'natural lighting',
  ].join(', ');

  // ── Step 5: Add appropriate style hints ──────────────────────────────
  const isPortrait   = /\b(person|man|woman|boy|girl|face|portrait|selfie|model)\b/i.test(prompt);
  const isLandscape  = /\b(city|street|landscape|skyline|building|sunset|sunrise|beach|forest|park|mountain|river|lake)\b/i.test(prompt);
  const isProduct    = /\b(car|taxi|bus|phone|laptop|food|logo|poster|banner|product)\b/i.test(prompt);

  let styleHint = '';
  if (isPortrait)   styleHint = 'realistic portrait, studio lighting';
  else if (isLandscape) styleHint = 'cinematic wide angle, vivid colors';
  else if (isProduct)   styleHint = 'product photography, clean background';

  // Combine everything
  const parts = [prompt];
  if (styleHint && !lower.includes(styleHint.toLowerCase().split(',')[0])) {
    parts.push(styleHint);
  }
  parts.push(qualitySuffix);

  return parts.join(', ');
}

export function buildEnhancedImageRequest(prompt: string): { prompt: string; apiUrl: string; model: string } {
  const enhanced = enhanceImagePrompt(prompt);
  // Use a unique seed every call to prevent caching/repeated images
  const seed = Math.floor(Math.random() * 1000000) + Date.now() % 100000;
  const encoded = encodeURIComponent(enhanced);
  const apiUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&seed=${seed}&enhance=true&model=flux`;
  return { prompt: enhanced, apiUrl, model: 'pollinations-flux' };
}
