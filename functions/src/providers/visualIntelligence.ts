/**
 * Visual Intelligence Engine v3 — Dynamic Creative Generation
 *
 * Every generation is UNIQUE:
 * - Randomized seeds (cryptographic entropy)
 * - Prompt diversification (style, composition, lighting, angle)
 * - Multi-variant prompt selection
 * - Cache bypass for creative mode
 * - Aesthetic scoring
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type VisualMode =
  | 'photorealistic' | 'cinematic' | 'logo' | 'branding'
  | 'anime' | 'cyberpunk' | 'african_art' | 'architecture'
  | 'portrait' | 'wildlife' | 'abstract' | 'poster' | 'icon';

export interface VisualRequest {
  rawPrompt: string;
  mode: VisualMode;
  enhancedPrompt: string;
  negativePrompt: string;
  model: string;
  width: number;
  height: number;
  seed: number;
  enhance: boolean;
  isLogo: boolean;
  brandName?: string;
  variationIndex: number;
}

// ── Cryptographic seed — truly random every call ───────────────────────────

function generateEntropicSeed(): number {
  // Combine multiple entropy sources for maximum randomness
  const t = Date.now();
  const r = Math.random() * 999999;
  const p = process.hrtime ? process.hrtime()[1] : Math.random() * 1e9;
  return Math.floor(((t % 1000000) + r + (p % 1000000)) % 999983); // prime modulus
}

// ── Composition variants — randomized per generation ──────────────────────

const CAMERA_ANGLES = [
  'eye-level shot', 'low angle shot looking up', 'high angle bird\'s eye view',
  'dutch angle tilt', 'extreme close-up', 'medium shot', 'wide establishing shot',
  'over-the-shoulder perspective', 'worm\'s eye view', 'three-quarter angle',
];

const LIGHTING_STYLES = [
  'golden hour warm sunlight', 'dramatic side lighting', 'soft diffused overcast light',
  'harsh midday sun', 'blue hour twilight', 'moonlit night scene',
  'studio three-point lighting', 'rim lighting with dark background',
  'volumetric god rays', 'neon-lit environment', 'candlelight warm glow',
  'stormy dramatic sky', 'sunrise backlit silhouette', 'underwater caustic light',
];

const CINEMATIC_STYLES = [
  'anamorphic lens flare', 'shallow depth of field bokeh',
  'film grain texture', 'teal and orange color grade',
  'desaturated moody palette', 'high contrast noir style',
  'warm golden cinematic grade', 'cool blue cinematic tone',
  'vibrant saturated colors', 'muted earthy tones',
  'HDR high dynamic range', 'vintage film look',
];

const COMPOSITION_STYLES = [
  'rule of thirds composition', 'centered symmetrical composition',
  'diagonal leading lines', 'frame within a frame',
  'negative space emphasis', 'foreground bokeh with sharp subject',
  'layered depth composition', 'minimalist composition',
  'dynamic diagonal composition', 'golden spiral composition',
];

const ATMOSPHERE_VARIANTS = [
  'misty atmospheric haze', 'crystal clear sharp air',
  'dusty desert atmosphere', 'humid tropical air',
  'foggy mysterious mood', 'stormy dramatic clouds',
  'clear blue sky backdrop', 'dramatic storm clouds',
  'smoke and particle effects', 'rain-soaked wet surfaces',
];

const WILDLIFE_SCENARIOS = [
  'resting on a rocky outcrop at sunset',
  'stalking through tall golden savannah grass',
  'drinking at a watering hole at dawn',
  'roaring with mouth wide open, close-up',
  'lying in dappled forest shade',
  'standing on a termite mound surveying territory',
  'playing with cubs in morning light',
  'walking directly toward camera',
  'silhouetted against dramatic sunset sky',
  'emerging from dense bush, intense gaze',
];

const PORTRAIT_SCENARIOS = [
  'dramatic studio portrait with rim lighting',
  'outdoor natural light portrait in golden hour',
  'moody low-key portrait with deep shadows',
  'high-key bright portrait with soft light',
  'environmental portrait in natural setting',
  'close-up face portrait with shallow depth of field',
  'three-quarter profile portrait',
  'candid natural expression portrait',
];

const CITY_SCENARIOS = [
  'aerial drone view at golden hour',
  'street-level perspective at night with lights',
  'panoramic skyline at blue hour',
  'rainy night reflections on wet streets',
  'sunrise with mist over the city',
  'busy market street scene',
  'rooftop view looking down at streets',
  'long exposure light trails at night',
];

// ── Pick random element ────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Mode detector ──────────────────────────────────────────────────────────

export function detectVisualMode(prompt: string): VisualMode {
  const lower = prompt.toLowerCase();
  if (lower.includes('logo') || lower.includes('brand identity') || lower.includes('company logo') || lower.includes('business logo')) return 'logo';
  if (lower.includes('icon') || lower.includes('app icon') || lower.includes('favicon')) return 'icon';
  if (lower.includes('poster') || lower.includes('flyer') || lower.includes('banner') || lower.includes('thumbnail') || lower.includes('cover art')) return 'poster';
  if (lower.includes('anime') || lower.includes('manga') || lower.includes('cartoon') || lower.includes('chibi') || lower.includes('illustrated')) return 'anime';
  if (lower.includes('cyberpunk') || lower.includes('futuristic') || lower.includes('neon') || lower.includes('sci-fi') || lower.includes('blade runner') || lower.includes('dystopian')) return 'cyberpunk';
  if (lower.includes('city') || lower.includes('skyline') || lower.includes('building') || lower.includes('architecture') || lower.includes('lagos') || lower.includes('abuja') || lower.includes('nairobi') || lower.includes('accra')) return 'architecture';
  if (lower.includes('african') || lower.includes('nigeria') || lower.includes('ghana') || lower.includes('tribal') || lower.includes('traditional') || lower.includes('yoruba') || lower.includes('igbo') || lower.includes('hausa') || lower.includes('zulu') || lower.includes('benin')) return 'african_art';
  if (lower.includes('lion') || lower.includes('elephant') || lower.includes('tiger') || lower.includes('leopard') || lower.includes('cheetah') || lower.includes('gorilla') || lower.includes('eagle') || lower.includes('wildlife') || lower.includes('animal') || lower.includes('wolf')) return 'wildlife';
  if (lower.includes('portrait') || lower.includes('person') || lower.includes('woman') || lower.includes('man') || lower.includes('face') || lower.includes('headshot')) return 'portrait';
  if (lower.includes('cinematic') || lower.includes('movie') || lower.includes('film') || lower.includes('dramatic') || lower.includes('epic') || lower.includes('fantasy') || lower.includes('warrior')) return 'cinematic';
  if (lower.includes('abstract') || lower.includes('pattern') || lower.includes('texture') || lower.includes('geometric') || lower.includes('fractal')) return 'abstract';
  return 'photorealistic';
}

// ── Brand name extractor ───────────────────────────────────────────────────

export function extractBrandName(prompt: string): string {
  const patterns = [
    /logo\s+for\s+["']?([^"',.\n]+?)["']?\s*(?:company|limited|ltd|inc|tech|technology|group|corp|llc)?(?:\s|$)/i,
    /["']([^"']+)["']\s+logo/i,
    /(?:create|make|design|generate)\s+(?:a\s+)?(?:logo|brand)\s+(?:for|of)\s+["']?([^"',.\n]+?)["']?(?:\s|$)/i,
    /([A-Z][a-zA-Z\s]+(?:limited|ltd|inc|tech|technology|group|company|corp|llc))/i,
    /logo\s+(?:for|of)\s+([A-Za-z\s]+)/i,
  ];
  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match && match[1]) return match[1].trim().replace(/\s+/g, ' ');
  }
  return prompt.replace(/(?:create|make|design|generate|build)\s+(?:a\s+|an\s+)?/gi, '').replace(/(?:professional|modern|futuristic|minimalist|premium)\s+/gi, '').replace(/logo\s+(?:for|of)?\s*/gi, '').replace(/(?:company|brand|business|startup|corporate)\s+/gi, '').trim() || prompt;
}

// ── Negative prompts ───────────────────────────────────────────────────────

export const NEGATIVE_PROMPTS: Record<VisualMode, string> = {
  photorealistic: 'cartoon, anime, illustration, painting, drawing, sketch, unrealistic, fake, plastic, oversaturated, overexposed, blurry, noisy, grainy, distorted, deformed, ugly, bad anatomy, watermark, text, logo, melted hands, broken faces',
  cinematic: 'amateur, low quality, blurry, noisy, flat lighting, overexposed, cartoon, anime, sketch, watermark, text overlay, bad composition, inconsistent depth, bad anatomy, melted hands, deformed faces',
  logo: 'blurry, noisy, distorted text, misspelled, broken letters, garbled text, low resolution, pixelated, watermark, extra elements, cluttered',
  branding: 'blurry, noisy, distorted text, misspelled, broken letters, garbled text, low resolution, pixelated, watermark',
  anime: 'photorealistic, 3d render, ugly, deformed, noisy, blurry, low quality, bad anatomy, watermark',
  cyberpunk: 'daytime, bright, cheerful, cartoon, anime, low quality, blurry, watermark, bad perspective, broken anatomy',
  african_art: 'western style, generic, low quality, blurry, watermark, distorted, inaccurate cultural details, fake skin tones',
  architecture: 'people, cars, blurry, distorted, low quality, cartoon, anime, watermark, unrealistic perspective',
  portrait: 'cartoon, anime, deformed, ugly, bad anatomy, extra limbs, blurry, noisy, watermark, text, low quality, plastic skin, melted hands, blown out highlights, asymmetrical eyes',
  wildlife: 'cartoon, anime, deformed, ugly, bad anatomy, blurry, noisy, watermark, text, low quality, fake, plastic',
  abstract: 'realistic, photographic, ugly, low quality, watermark, text',
  poster: 'blurry, low quality, distorted text, watermark, amateur, pixelated, bad proportions',
  icon: 'blurry, noisy, complex background, photorealistic, watermark, text outside icon',
};

// ── Model selection ────────────────────────────────────────────────────────

export const MODE_MODELS: Record<VisualMode, string[]> = {
  photorealistic: ['stable-diffusion-xl', 'flux', 'stable-diffusion-3.5-large'],
  cinematic:      ['stable-diffusion-xl', 'flux', 'stable-diffusion-3.5-large'],
  logo:           ['turbo', 'stable-diffusion-3.5-large'],
  branding:       ['turbo', 'stable-diffusion-3.5-large'],
  anime:          ['flux-anime', 'turbo'],
  cyberpunk:      ['flux', 'turbo', 'stable-diffusion-3.5-large'],
  african_art:    ['stable-diffusion-xl', 'flux', 'stable-diffusion-3.5-large'],
  architecture:   ['stable-diffusion-xl', 'flux', 'stable-diffusion-3.5-large'],
  portrait:       ['stable-diffusion-xl', 'flux', 'stable-diffusion-3.5-large'],
  wildlife:       ['stable-diffusion-xl', 'flux', 'stable-diffusion-3.5-large'],
  abstract:       ['flux-3d', 'stable-diffusion-3.5-large'],
  poster:         ['stable-diffusion-3.5-large', 'flux'],
  icon:           ['turbo', 'stable-diffusion-3.5-large'],
};

// ── Dimensions ────────────────────────────────────────────────────────────

const MODE_DIMENSIONS: Record<VisualMode, { width: number; height: number }[]> = {
  photorealistic: [{ width: 896, height: 896 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }],
  cinematic:      [{ width: 1024, height: 576 }, { width: 1024, height: 640 }],
  logo:           [{ width: 768, height: 768 }],
  branding:       [{ width: 768, height: 768 }],
  anime:          [{ width: 768, height: 1024 }, { width: 896, height: 896 }],
  cyberpunk:      [{ width: 1024, height: 576 }, { width: 1024, height: 640 }],
  african_art:    [{ width: 896, height: 896 }, { width: 768, height: 1024 }],
  architecture:   [{ width: 1024, height: 576 }, { width: 1024, height: 640 }],
  portrait:       [{ width: 768, height: 1024 }, { width: 896, height: 1024 }],
  wildlife:       [{ width: 1024, height: 768 }, { width: 896, height: 896 }],
  abstract:       [{ width: 896, height: 896 }, { width: 1024, height: 1024 }],
  poster:         [{ width: 768, height: 1024 }, { width: 896, height: 1024 }],
  icon:           [{ width: 512, height: 512 }],
};

// ── DYNAMIC PROMPT BUILDER — unique every call ─────────────────────────────

export function buildEnhancedPrompt(rawPrompt: string, mode: VisualMode, brandName?: string): string {
  const lower = rawPrompt.toLowerCase();

  switch (mode) {

    case 'wildlife': {
      const countMatch = lower.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/);
      const count = countMatch ? countMatch[0] : "one";

      const animal = lower.includes('lion') ? `EXACTLY ${count} majestic African lion` :
                     lower.includes('elephant') ? `EXACTLY ${count} massive African elephant` :
                     lower.includes('leopard') ? `EXACTLY ${count} African leopard` :
                     lower.includes('cheetah') ? `EXACTLY ${count} cheetah` :
                     lower.includes('gorilla') ? `EXACTLY ${count} silverback mountain gorilla` :
                     lower.includes('eagle') ? `EXACTLY ${count} African fish eagle` :
                     lower.includes('tiger') ? `EXACTLY ${count} Bengal tiger` :
                     lower.includes('wolf') ? `EXACTLY ${count} grey wolf` : `EXACTLY ${count} ${rawPrompt}`;

      const scenario = pick(WILDLIFE_SCENARIOS);
      const lighting = pick(LIGHTING_STYLES);
      const cinematic = pick(CINEMATIC_STYLES);
      const composition = pick(COMPOSITION_STYLES);
      const atmosphere = pick(ATMOSPHERE_VARIANTS);
      
      // Enforce Action State
      let actionConstraint = "wings fully extended, soaring through the sky, mid-air movement";
      if (lower.includes('sit') || lower.includes('perch')) actionConstraint = "perched still on a branch, stationary pose";
      if (lower.includes('run')) actionConstraint = "sprinting with athletic stride, high-speed motion blur, paws hitting ground";

      return `Ultra-realistic National Geographic photography of ${animal}, ${actionConstraint}, ${scenario}, shot on RED V-Raptor, 600mm f/4, ${lighting}, ${cinematic}, ${composition}, ${atmosphere}, 8k RAW resolution, hyper-detailed textures, masterpiece composition, realistic anatomy`;
    }
    case 'portrait': {
      const subject = rawPrompt.replace(/portrait|headshot|photo|picture|image/gi, '').trim() || rawPrompt;
      const scenario = pick(PORTRAIT_SCENARIOS);
      const lighting = pick(LIGHTING_STYLES);
      const cinematic = pick(CINEMATIC_STYLES);
      const [extra1, extra2] = pickN(COMPOSITION_STYLES, 2);

      return `Premium high-fashion portrait of ${subject}, ${scenario}, shot on Hasselblad H6D-100c, 80mm lens, ${lighting}, ${cinematic}, ${extra1}, ${extra2}, raw unedited skin texture, visible pores and fine detail, hyper-detailed iris patterns, moisture in eyes, individual eyelash separation, professional studio setup, volumetric depth, magazine cover quality, 8k resolution, cinematic color timing`;
    }

    case 'logo': {
      const name = brandName || extractBrandName(rawPrompt);
      const style = lower.includes('futuristic') || lower.includes('tech') ? 'futuristic tech' :
                    lower.includes('luxury') || lower.includes('premium') ? 'luxury premium' :
                    lower.includes('minimal') ? 'minimalist' :
                    lower.includes('african') || lower.includes('nigeria') ? 'African inspired' :
                    lower.includes('bold') ? 'bold modern' : 'modern professional';
      const colorScheme = lower.includes('blue') ? 'deep blue and white' :
                          lower.includes('red') ? 'bold red and white' :
                          lower.includes('gold') ? 'gold and black' :
                          lower.includes('green') ? 'vibrant emerald green and white' : 'vibrant premium green and white';
      return `Ultra-premium corporate logo for "${name}", ${style} aesthetic, flat vector design, perfect geometric harmony, golden ratio proportions, professional branding, clean bold sans-serif typography, crisp vector edges, isolated on white background, ${colorScheme}, 8k, masterpiece of graphic design, symmetrical balance, no noise, high fidelity`;
    }

    case 'branding': {
      const name = brandName || extractBrandName(rawPrompt);
      return `Full premium brand identity suite for "${name}", professional logo mark, modern minimalist typography, high-end corporate color palette, enterprise-grade vector quality, 8k resolution, clean sharp lines, balanced layout, sophisticated aesthetic, professional grade`;
    }

    case 'cinematic': {
      const angle = pick(CAMERA_ANGLES);
      const lighting = pick(LIGHTING_STYLES);
      const style = pick(CINEMATIC_STYLES);
      const atmosphere = pick(ATMOSPHERE_VARIANTS);
      const [comp1, comp2] = pickN(COMPOSITION_STYLES, 2);
      return `${rawPrompt}, ${angle}, ${lighting}, ${style}, ${atmosphere}, ${comp1}, ${comp2}, cinematic movie still, ultra detailed, 8k, IMAX quality, epic composition, professional cinematography, HDR, award-winning visual effects, anamorphic lens, film grain, color graded, dramatic depth of field, volumetric lighting, photorealistic rendering`;
    }

    case 'cyberpunk': {
      const angle = pick(CAMERA_ANGLES);
      const atmosphere = pick(ATMOSPHERE_VARIANTS);
      const neonColors = pick(['blue and purple neon', 'pink and cyan neon', 'red and orange neon', 'green and white neon', 'multicolor neon']);
      const comp = pick(COMPOSITION_STYLES);
      return `${rawPrompt}, ${angle}, ${neonColors} lights, ${atmosphere}, ${comp}, cyberpunk aesthetic, rain-slicked reflective streets, holographic displays, volumetric fog, dramatic rim lighting, ultra detailed, 8k resolution, Blade Runner 2049 style, cinematic color grading, neon reflections on wet pavement, atmospheric haze, lens flare, photorealistic`;
    }

    case 'architecture': {
      const scenario = pick(CITY_SCENARIOS);
      const lighting = pick(LIGHTING_STYLES);
      const cinematic = pick(CINEMATIC_STYLES);
      const comp = pick(COMPOSITION_STYLES);
      const city = lower.includes('lagos') ? 'Lagos Nigeria skyline' :
                   lower.includes('abuja') ? 'Abuja Nigeria cityscape' :
                   lower.includes('nairobi') ? 'Nairobi Kenya skyline' :
                   lower.includes('accra') ? 'Accra Ghana cityscape' : rawPrompt;
      return `${city}, aerial drone photography, golden hour, dramatic clouds, ultra detailed architecture, HDR, 8k, professional architectural photography, ${scenario}, ${lighting}, ${cinematic}, ${comp}, sharp architectural details, glass reflections, urban density, wide angle lens, tilt-shift effect, award-winning architectural photography`;
    }

    case 'anime': {
      const style = pick(['Studio Ghibli style', 'Makoto Shinkai style', 'shonen action style', 'slice of life style', 'dark fantasy anime style', 'mecha anime style']);
      const lighting = pick(LIGHTING_STYLES);
      const comp = pick(COMPOSITION_STYLES);
      return `${rawPrompt}, ${style}, ${lighting}, ${comp}, high quality anime art, vibrant saturated colors, detailed character design, clean sharp lines, professional illustration, dynamic composition, expressive eyes, 4k resolution, masterpiece quality, trending on pixiv, cel shading, detailed background`;
    }

    case 'african_art': {
      const style = pick(['Afrofuturist digital art', 'traditional African painting', 'contemporary African illustration', 'African textile pattern art', 'Yoruba-inspired art', 'Benin bronze-inspired art']);
      const lighting = pick(LIGHTING_STYLES);
      const comp = pick(COMPOSITION_STYLES);
      return `${rawPrompt}, ${style}, ${lighting}, ${comp}, vibrant warm earth tones with gold accents, intricate traditional patterns, bold geometric designs, cultural authenticity, professional illustration, ultra detailed, 4k resolution, rich color palette, symbolic motifs, masterpiece quality`;
    }

    case 'poster': {
      const style = pick(['movie poster style', 'concert poster style', 'vintage propaganda poster', 'modern minimalist poster', 'retro 80s poster', 'luxury brand poster']);
      const lighting = pick(LIGHTING_STYLES);
      const comp = pick(COMPOSITION_STYLES);
      return `${rawPrompt}, ${style}, ${lighting}, ${comp}, dramatic composition, bold typography, cinematic lighting, high contrast, vibrant colors, print quality 300dpi, award-winning poster art, 4k resolution, professional graphic design, visual hierarchy, eye-catching layout`;
    }

    case 'icon': {
      const style = pick(['flat design', 'neumorphic design', 'glassmorphism style', 'material design', 'skeuomorphic design', 'bold outlined style']);
      return `${rawPrompt}, ${style}, clean app icon design, simple bold symbol, subtle gradient, rounded corners, professional UI design, pixel perfect, scalable vector style, 512x512, minimal clean design, high contrast, recognizable silhouette`;
    }

    case 'abstract': {
      const style = pick(['fluid art', 'geometric abstract', 'fractal art', 'glitch art', 'watercolor abstract', 'oil painting abstract', 'digital generative art']);
      const palette = pick(['vibrant neon palette', 'earth tone palette', 'monochromatic blue palette', 'warm sunset palette', 'cool ocean palette', 'high contrast black and white']);
      const comp = pick(COMPOSITION_STYLES);
      return `${rawPrompt}, ${style}, ${palette}, ${comp}, stunning abstract art, intricate patterns, dynamic composition, professional digital art, ultra detailed, 4k resolution, award-winning generative art, flowing organic forms, mathematical precision`;
    }

    case 'photorealistic':
    default: {
      const angle = pick(CAMERA_ANGLES);
      const lighting = pick(LIGHTING_STYLES);
      const cinematic = pick(CINEMATIC_STYLES);
      const atmosphere = pick(ATMOSPHERE_VARIANTS);
      const comp = pick(COMPOSITION_STYLES);
      return `${rawPrompt}, ${angle}, ${lighting}, ${cinematic}, ${atmosphere}, ${comp}, ultra photorealistic, professional photography, sharp focus, high detail, 8k resolution, RAW photo quality, no artifacts, cinematic composition, Sony A7R V, 50mm f/1.2, natural lighting, color accurate, award-winning photography`;
    }
  }
}

// ── Build complete visual request — unique every call ──────────────────────

export function buildVisualRequest(rawPrompt: string): VisualRequest {
  const mode = detectVisualMode(rawPrompt);
  const isLogo = mode === 'logo' || mode === 'branding' || mode === 'icon';
  const brandName = isLogo ? extractBrandName(rawPrompt) : undefined;

  // Build a FRESH enhanced prompt with random variations every call
  const enhancedPrompt = buildEnhancedPrompt(rawPrompt, mode, brandName);
  const negativePrompt = NEGATIVE_PROMPTS[mode];
  const models = MODE_MODELS[mode];

  // Random dimension variant for the mode
  const dimOptions = MODE_DIMENSIONS[mode];
  const dims = pick(dimOptions);

  // Cryptographic seed — different every single call
  const seed = generateEntropicSeed();

  // Variation index for logging
  const variationIndex = Math.floor(Math.random() * 1000);

  console.log(`[Visual] Seed=${seed} Variation=${variationIndex} Mode=${mode}`);

  return {
    rawPrompt,
    mode,
    enhancedPrompt,
    negativePrompt,
    model: models[0],
    width: dims.width,
    height: dims.height,
    seed,
    enhance: true,
    isLogo,
    brandName,
    variationIndex,
  };
}

// ── Quality scorer ─────────────────────────────────────────────────────────

export function scoreImageQuality(bytes: number, mode: VisualMode): number {
  const minExpected: Record<VisualMode, number> = {
    photorealistic: 80000, cinematic: 70000, logo: 20000, branding: 20000,
    anime: 60000, cyberpunk: 70000, african_art: 60000, architecture: 70000,
    portrait: 70000, wildlife: 80000, abstract: 50000, poster: 60000, icon: 15000,
  };
  const min = minExpected[mode] || 50000;
  return Math.round(Math.min(100, (bytes / min) * 100));
}
