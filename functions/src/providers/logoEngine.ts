/**
 * Pure SVG Logo Engine — No native dependencies
 * Generates professional logos as SVG, converts to base64
 * Works in any Node.js environment including Firebase Cloud Functions
 */

// ── Color schemes ──────────────────────────────────────────────────────────

interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  gradient1: string;
  gradient2: string;
}

export interface BrandKit {
  name: string;
  initials: string;
  svg: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    palette: string[];
  };
  typography: {
    heading: string;
    body: string;
    pairingNote: string;
  };
  brandStory: string;
}

function detectColorScheme(prompt: string): ColorScheme {
  const lower = prompt.toLowerCase();

  if (lower.includes('green') || lower.includes('nigeria') || lower.includes('eco') ||
      lower.includes('tech') || lower.includes('tomega') || lower.includes('9jai')) {
    return { primary: '#00A651', secondary: '#006B35', accent: '#7FFF00',
             background: '#000000', text: '#FFFFFF', gradient1: '#00C864', gradient2: '#004D20' };
  }
  if (lower.includes('blue') || lower.includes('finance') || lower.includes('bank') || lower.includes('trust')) {
    return { primary: '#0066CC', secondary: '#003D7A', accent: '#00AAFF',
             background: '#000814', text: '#FFFFFF', gradient1: '#0088FF', gradient2: '#002255' };
  }
  if (lower.includes('gold') || lower.includes('luxury') || lower.includes('premium') || lower.includes('royal')) {
    return { primary: '#D4AF37', secondary: '#8B7536', accent: '#FFD700',
             background: '#0A0A0A', text: '#FFFFFF', gradient1: '#FFD700', gradient2: '#8B6914' };
  }
  if (lower.includes('red') || lower.includes('energy') || lower.includes('power')) {
    return { primary: '#CC0000', secondary: '#800000', accent: '#FF4444',
             background: '#0A0000', text: '#FFFFFF', gradient1: '#FF2222', gradient2: '#660000' };
  }
  if (lower.includes('purple') || lower.includes('creative') || lower.includes('ai') || lower.includes('digital')) {
    return { primary: '#7B2FBE', secondary: '#4A1A7A', accent: '#B44FFF',
             background: '#0A0014', text: '#FFFFFF', gradient1: '#9B4FDE', gradient2: '#3A0A5A' };
  }
  if (lower.includes('orange') || lower.includes('startup') || lower.includes('innovation')) {
    return { primary: '#FF6B00', secondary: '#CC4400', accent: '#FF9500',
             background: '#0A0500', text: '#FFFFFF', gradient1: '#FF8800', gradient2: '#AA3300' };
  }
  // Default: professional green
  return { primary: '#00A651', secondary: '#006B35', accent: '#7FFF00',
           background: '#000000', text: '#FFFFFF', gradient1: '#00C864', gradient2: '#004D20' };
}

// ── Extract initials ───────────────────────────────────────────────────────

function getInitials(name: string): string {
  const stopWords = new Set(['limited', 'ltd', 'inc', 'llc', 'corp', 'company', 'co', 'group', 'the', 'and', 'of', 'for', 'technology', 'tech', 'solutions', 'services', 'global', 'international']);
  const words = name.trim().split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()) && w.length > 0);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ── Logo style detector ────────────────────────────────────────────────────

type LogoStyle = 'circular_badge' | 'modern_minimal' | 'tech_hex' | 'shield';

function detectLogoStyle(prompt: string): LogoStyle {
  const lower = prompt.toLowerCase();
  if (lower.includes('minimal') || lower.includes('clean') || lower.includes('simple')) return 'modern_minimal';
  if (lower.includes('tech') || lower.includes('ai') || lower.includes('digital') || lower.includes('cyber') || lower.includes('hex')) return 'tech_hex';
  if (lower.includes('shield') || lower.includes('security') || lower.includes('protect') || lower.includes('trust')) return 'shield';
  return 'circular_badge';
}

// ── SVG generators ─────────────────────────────────────────────────────────

function generateCircularBadgeSVG(brandName: string, initials: string, colors: ColorScheme): string {
  const size = 800;
  const cx = 400;
  const cy = 400;
  const outerR = 340;
  const innerR = 270;
  const iconR = 200;

  // Split brand name for arc text
  const upperName = brandName.toUpperCase().replace(/\s+(LIMITED|LTD|INC|CORP|LLC)$/i, '');
  const suffix = (brandName.match(/\b(LIMITED|LTD|INC|CORP|LLC|GROUP|TECHNOLOGY|TECH)\b/i)?.[1] || 'LIMITED').toUpperCase();

  // Build arc text paths
  const topArcChars = upperName.split('').map((char, i, arr) => {
    const totalAngle = Math.PI * 0.75;
    const startAngle = -Math.PI / 2 - totalAngle / 2;
    const angle = startAngle + (i / Math.max(arr.length - 1, 1)) * totalAngle;
    const r = outerR * 0.82;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const rot = (angle + Math.PI / 2) * (180 / Math.PI);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" transform="rotate(${rot.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)})" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="800" font-size="38" fill="${colors.text}" letter-spacing="1">${char}</text>`;
  }).join('');

  const bottomArcChars = suffix.split('').map((char, i, arr) => {
    const totalAngle = Math.PI * 0.5;
    const startAngle = Math.PI / 2 - totalAngle / 2;
    const angle = startAngle + (i / Math.max(arr.length - 1, 1)) * totalAngle;
    const r = outerR * 0.82;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const rot = (angle - Math.PI / 2) * (180 / Math.PI);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" transform="rotate(${rot.toFixed(1)},${x.toFixed(1)},${y.toFixed(1)})" text-anchor="middle" dominant-baseline="middle" font-family="Arial,sans-serif" font-weight="700" font-size="34" fill="${colors.accent}" letter-spacing="1">${char}</text>`;
  }).join('');

  // Circuit dots
  const dots = [0, 60, 120, 180, 240, 300].map(deg => {
    const rad = deg * Math.PI / 180;
    const r = outerR * 0.91;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="${colors.accent}" opacity="0.8"/>`;
  }).join('');

  const initialsSize = initials.length <= 2 ? 160 : 120;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#111111"/>
      <stop offset="100%" stop-color="${colors.background}"/>
    </radialGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${colors.primary}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${colors.primary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.accent}"/>
      <stop offset="50%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.secondary}"/>
    </linearGradient>
    <radialGradient id="iconGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${colors.gradient1}"/>
      <stop offset="60%" stop-color="${colors.primary}"/>
      <stop offset="100%" stop-color="${colors.gradient2}"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textGlow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>

  <!-- Outer glow -->
  <circle cx="${cx}" cy="${cy}" r="${outerR * 1.1}" fill="url(#glowGrad)"/>

  <!-- Outer ring -->
  <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="url(#ringGrad)" stroke-width="18" filter="url(#glow)"/>

  <!-- Inner ring -->
  <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${colors.primary}" stroke-width="5" opacity="0.5"/>

  <!-- Icon circle -->
  <circle cx="${cx}" cy="${cy - 20}" r="${iconR}" fill="url(#iconGrad)"/>

  <!-- Circuit dots -->
  ${dots}

  <!-- Initials -->
  <text x="${cx}" y="${cy - 20}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="${initialsSize}"
    fill="white" filter="url(#textGlow)" letter-spacing="-2">${initials}</text>

  <!-- Top arc text -->
  ${topArcChars}

  <!-- Bottom arc text -->
  ${bottomArcChars}

  <!-- Separator dots -->
  <circle cx="${cx - outerR * 0.55}" cy="${cy + outerR * 0.62}" r="5" fill="${colors.accent}" opacity="0.7"/>
  <circle cx="${cx + outerR * 0.55}" cy="${cy + outerR * 0.62}" r="5" fill="${colors.accent}" opacity="0.7"/>
</svg>`;
}

function generateModernMinimalSVG(brandName: string, initials: string, colors: ColorScheme): string {
  const size = 800;
  const cx = 400;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A0A0A"/>
      <stop offset="100%" stop-color="${colors.background}"/>
    </linearGradient>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.gradient1}"/>
      <stop offset="100%" stop-color="${colors.gradient2}"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="8" stdDeviation="20" flood-color="${colors.primary}" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>

  <!-- Icon box with rounded corners -->
  <rect x="250" y="160" width="300" height="300" rx="60" ry="60" fill="url(#boxGrad)" filter="url(#shadow)"/>

  <!-- Initials -->
  <text x="${cx}" y="325" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black,Arial,sans-serif" font-weight="900"
    font-size="${initials.length <= 2 ? 140 : 100}" fill="white" letter-spacing="-3">${initials}</text>

  <!-- Accent line -->
  <rect x="180" y="500" width="440" height="5" rx="3" fill="${colors.accent}" opacity="0.8"/>

  <!-- Brand name -->
  <text x="${cx}" y="560" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial,sans-serif" font-weight="700" font-size="52"
    fill="${colors.text}" letter-spacing="4">${brandName.toUpperCase()}</text>

  <!-- Tagline dots -->
  <circle cx="340" cy="630" r="5" fill="${colors.accent}" opacity="0.6"/>
  <circle cx="400" cy="630" r="5" fill="${colors.primary}" opacity="0.8"/>
  <circle cx="460" cy="630" r="5" fill="${colors.accent}" opacity="0.6"/>
</svg>`;
}

function generateTechHexSVG(brandName: string, initials: string, colors: ColorScheme): string {
  const size = 800;
  const cx = 400;
  const cy = 360;
  const hexR = 200;

  // Hexagon points
  const hexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    return `${(cx + hexR * Math.cos(angle)).toFixed(1)},${(cy + hexR * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  const innerHexPoints = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const r = hexR * 0.85;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0A0A1A"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${colors.gradient1}"/>
      <stop offset="100%" stop-color="${colors.gradient2}"/>
    </linearGradient>
    <filter id="neonGlow">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>

  <!-- Outer hex glow -->
  <polygon points="${hexPoints}" fill="none" stroke="${colors.accent}" stroke-width="3" opacity="0.3" filter="url(#neonGlow)"/>

  <!-- Main hex -->
  <polygon points="${hexPoints}" fill="url(#hexGrad)" filter="url(#neonGlow)"/>

  <!-- Inner hex border -->
  <polygon points="${innerHexPoints}" fill="none" stroke="${colors.accent}" stroke-width="3" opacity="0.6"/>

  <!-- Initials -->
  <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black,Arial,sans-serif" font-weight="900"
    font-size="${initials.length <= 2 ? 150 : 110}" fill="white"
    filter="url(#neonGlow)" letter-spacing="-3">${initials}</text>

  <!-- Brand name -->
  <text x="${cx}" y="${cy + hexR + 60}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial,sans-serif" font-weight="700" font-size="50"
    fill="${colors.text}" letter-spacing="5">${brandName.toUpperCase()}</text>

  <!-- Neon underline -->
  <line x1="${cx - 200}" y1="${cy + hexR + 85}" x2="${cx + 200}" y2="${cy + hexR + 85}"
    stroke="${colors.accent}" stroke-width="3" opacity="0.7" filter="url(#neonGlow)"/>
</svg>`;
}

// ── Main logo generator ────────────────────────────────────────────────────

/**
 * Generates a full professional brand kit including SVG, Palette, and Typography
 */
export function generateBrandKit(brandName: string, prompt: string): BrandKit {
  const colors = detectColorScheme(prompt);
  const style = detectLogoStyle(prompt);
  const initials = getInitials(brandName);
  const svg = generateLogoSVG(brandName, prompt);

  return {
    name: brandName,
    initials,
    svg,
    colors: {
      primary: colors.primary,
      secondary: colors.secondary,
      accent: colors.accent,
      palette: [colors.primary, colors.secondary, colors.accent, colors.background, colors.text]
    },
    typography: {
      heading: 'Arial Black, sans-serif',
      body: 'Arial, sans-serif',
      pairingNote: 'Strong geometric sans-serif for headings, clean functional sans-serif for body copy.'
    },
    brandStory: `The ${brandName} identity utilizes ${style.replace('_', ' ')} aesthetics to project reliability and innovation. ` +
                `The ${colors.primary} palette signifies professional growth and Nigerian heritage integration.`
  };
}

export function generateLogoSVG(brandName: string, prompt: string): string {
  const colors = detectColorScheme(prompt);
  const style = detectLogoStyle(prompt);
  const initials = getInitials(brandName);

  console.log(`[LogoEngine] Brand="${brandName}" Initials="${initials}" Style="${style}"`);

  switch (style) {
    case 'modern_minimal': return generateModernMinimalSVG(brandName, initials, colors);
    case 'tech_hex': return generateTechHexSVG(brandName, initials, colors);
    default: return generateCircularBadgeSVG(brandName, initials, colors);
  }
}

// Convert SVG to base64 data URL
export function svgToBase64DataUrl(svg: string): string {
  const base64 = Buffer.from(svg, 'utf-8').toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
