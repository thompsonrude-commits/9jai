import { generateDesignImage, generateImageWithFallback } from '../imageService';
import { requiresExplicitVisualRequest } from '../ai';

function unwrapDataUrl(dataUrl: string): string {
  // data:image/svg+xml;charset=utf-8,ENCODED
  const parts = dataUrl.split(',');
  if (parts.length < 2) return '';
  return decodeURIComponent(parts.slice(1).join(','));
}

describe('Visual generation matrix (local/hybrid fallbacks)', () => {
  test('restaurant flyer preserves exact headline text', async () => {
    const headline = 'TOMEGAVERSE TECHNOLOGIES\nAI FOR AFRICA\nCall: 08012345678';
    const dataUrl = await generateDesignImage('restaurant flyer', [
      { type: 'headline', text: headline, size: 48, weight: '800', align: 'center' },
    ], 1200, 1600);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('TOMEGAVERSE TECHNOLOGIES');
    expect(svg).toContain('AI FOR AFRICA');
    expect(svg).toContain('08012345678');
  });

  test('3D bottle prompt produces a fallback image containing prompt', async () => {
    const prompt = 'Create a realistic 3D bottle with studio lighting';
    const dataUrl = await generateImageWithFallback(prompt);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('3D');
    expect(svg).toContain('realistic');
  });

  test('embossed gold logo generation fallback includes logo prompt', async () => {
    const prompt = 'Embossed gold logo for TOMEGAVERSE';
    const dataUrl = await generateImageWithFallback(prompt);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('TOMEGAVERSE');
  });

  test('Nigerian grocery advertisement preserves requested text', async () => {
    const headline = 'Fresh Tomatoes - N500 per crate';
    const dataUrl = await generateDesignImage('grocery flyer', [
      { type: 'headline', text: headline, size: 44, weight: '800', align: 'center' },
    ]);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('Fresh Tomatoes');
    expect(svg).toContain('N500');
  });

  test('company letterhead includes company name', async () => {
    const company = 'TOMEGAVERSE LTD.';
    const dataUrl = await generateDesignImage('letterhead', [
      { type: 'title', text: company, size: 36, weight: '800', align: 'center' },
    ], 1600, 1120);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('TOMEGAVERSE LTD');
  });

  test('photorealistic market prompt results in fallback containing "market"', async () => {
    const prompt = 'Photorealistic Nigerian market scene with vibrant stalls';
    const dataUrl = await generateImageWithFallback(prompt);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg.toLowerCase()).toContain('market');
  });

  test('explicit diagram requests are detected only when the user asks for a visual', () => {
    expect(requiresExplicitVisualRequest('Explain photosynthesis with a diagram')).toBe(true);
    expect(requiresExplicitVisualRequest('Explain photosynthesis')).toBe(false);
    expect(requiresExplicitVisualRequest('How does photosynthesis work?')).toBe(false);
  });

  test('educational diagram: explain photosynthesis includes prompt text', async () => {
    const prompt = 'Explain photosynthesis with a diagram';
    const dataUrl = await generateImageWithFallback(prompt);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg.toLowerCase()).toContain('photosynthesis');
  });

  test('product advertisement with exact text uses provided text blocks', async () => {
    const blocks = [
      { type: 'headline', text: 'NEW: Pure Palm Oil', size: 56, weight: '800', align: 'center' },
      { type: 'cta', text: 'Buy now: 08098765432', size: 32, weight: '700', align: 'center' },
    ];
    const dataUrl = await generateDesignImage('product ad', blocks);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('Pure Palm Oil');
    expect(svg).toContain('08098765432');
  });

  test('uploaded image modification preserves backgroundUrl when provided', async () => {
    const bg = 'https://example.com/uploads/original.png';
    const dataUrl = await generateDesignImage('edit uploaded', [{ text: 'Edited caption', size: 24 }], 800, 600, bg);
    const svg = unwrapDataUrl(dataUrl);
    // ensure the background href is the provided URL
    expect(svg).toContain(bg);
  });

  test('uploaded logo preservation: text block with logo placeholder remains', async () => {
    const blocks = [{ type: 'title', text: 'TOMEGAVERSE - with logo', size: 40 }];
    const dataUrl = await generateDesignImage('logo preserve', blocks);
    const svg = unwrapDataUrl(dataUrl);
    expect(svg).toContain('TOMEGAVERSE');
    expect(svg).toContain('logo');
  });
});
