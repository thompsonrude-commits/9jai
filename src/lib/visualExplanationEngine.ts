export interface VisualExplanation {
  title: string;
  kind: 'diagram' | 'flowchart' | 'chart' | 'map' | 'infographic' | '2d' | '3d-style' | 'graph';
  description: string;
  svg: string;
  source: 'local';
}

function escapeXml(value: string): string {
  return (value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

export function shouldUseVisualExplanation(input: string): boolean {
  const text = (input || '').toLowerCase();
  const keywords = ['human heart', 'water cycle', 'solar system', 'network', 'computer', 'electricity', 'volcano', 'cell', 'atom', 'molecule', 'body', 'ecosystem', 'architecture', 'diagram', 'map', 'graph', 'flowchart', 'math', 'chemistry', 'biology', 'physics', 'climate', 'weather', 'economics', 'programming'];
  return keywords.some((keyword) => text.includes(keyword));
}

export function generateProceduralDiagram(subject: string): string {
  const safeSubject = (subject || 'concept').trim() || 'concept';
  const lower = safeSubject.toLowerCase();
  const width = 960;
  const height = 540;

  if (lower.includes('water cycle')) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#051b1d"/>
        <text x="480" y="40" text-anchor="middle" fill="#dffdf3" font-size="26" font-family="Arial">Water cycle</text>
        <ellipse cx="680" cy="150" rx="90" ry="60" fill="#bfe7ff" stroke="#dff8ff" stroke-width="2"/>
        <text x="680" y="155" text-anchor="middle" fill="#0d2d35" font-size="18">clouds</text>
        <path d="M 680 220 C 650 260, 600 290, 540 290 C 480 290, 430 250, 420 210" stroke="#7bd8ff" stroke-width="6" fill="none"/>
        <path d="M 420 212 L 430 220 L 420 230" stroke="#7bd8ff" stroke-width="6" fill="none"/>
        <path d="M 260 330 C 360 260, 460 260, 520 330" stroke="#8be3a5" stroke-width="6" fill="none"/>
        <path d="M 520 330 L 500 380" stroke="#8be3a5" stroke-width="6" fill="none"/>
        <path d="M 520 330 L 580 380" stroke="#8be3a5" stroke-width="6" fill="none"/>
        <circle cx="240" cy="360" r="80" fill="#7ae7ff" stroke="#d3faff" stroke-width="3"/>
        <text x="240" y="370" text-anchor="middle" fill="#0f2c3c" font-size="16">sea</text>
        <text x="170" y="470" fill="#dffdf3" font-size="18">evaporation</text>
        <text x="365" y="470" fill="#dffdf3" font-size="18">condensation</text>
        <text x="610" y="470" fill="#dffdf3" font-size="18">precipitation</text>
        <text x="760" y="470" fill="#dffdf3" font-size="18">collection</text>
      </svg>
    `;
  }

  if (lower.includes('solar system')) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#070d1c"/>
        <circle cx="140" cy="270" r="42" fill="#f4d35e"/>
        <text x="140" y="330" text-anchor="middle" fill="#fff4c0" font-size="18">Sun</text>
        <circle cx="280" cy="270" r="14" fill="#5ba2ff"/>
        <text x="280" y="300" text-anchor="middle" fill="#dfeaff" font-size="14">Mercury</text>
        <circle cx="360" cy="270" r="18" fill="#e7b75f"/>
        <text x="360" y="302" text-anchor="middle" fill="#fff0d1" font-size="14">Venus</text>
        <circle cx="470" cy="270" r="22" fill="#7db4ff"/>
        <text x="470" y="305" text-anchor="middle" fill="#eaf4ff" font-size="16">Earth</text>
        <circle cx="590" cy="270" r="25" fill="#d9825a"/>
        <text x="590" y="312" text-anchor="middle" fill="#ffece0" font-size="16">Mars</text>
        <circle cx="720" cy="270" r="35" fill="#f0b65d"/>
        <text x="720" y="322" text-anchor="middle" fill="#fff0d0" font-size="18">Jupiter</text>
        <path d="M 140 270 C 200 180, 250 180, 280 270" stroke="#90a6e0" stroke-width="2" fill="none"/>
        <path d="M 140 270 C 240 110, 350 110, 360 270" stroke="#90a6e0" stroke-width="2" fill="none"/>
        <path d="M 140 270 C 280 75, 490 75, 470 270" stroke="#90a6e0" stroke-width="2" fill="none"/>
        <path d="M 140 270 C 290 50, 640 60, 590 270" stroke="#90a6e0" stroke-width="2" fill="none"/>
        <path d="M 140 270 C 310 25, 770 90, 720 270" stroke="#90a6e0" stroke-width="2" fill="none"/>
      </svg>
    `;
  }

  if (lower.includes('heart')) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#0d1b18"/>
        <g transform="translate(120,80)">
          <path d="M 260 160 C 180 80, 70 90, 90 210 C 100 310, 260 390, 260 390 C 260 390, 420 310, 430 210 C 450 90, 340 80, 260 160 Z" fill="#ff5a5a" stroke="#ffd0d0" stroke-width="4"/>
          <path d="M 200 245 L 260 310 L 320 245" stroke="#fff" stroke-width="4" fill="none"/>
          <circle cx="260" cy="170" r="22" fill="#fff3f3"/>
          <text x="260" y="50" text-anchor="middle" fill="#fff" font-size="24">Heart</text>
          <text x="260" y="430" text-anchor="middle" fill="#fff" font-size="22">atria • ventricles • valves</text>
        </g>
      </svg>
    `;
  }

  if (lower.includes('network') || lower.includes('computer')) {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect width="100%" height="100%" fill="#111827"/>
        <rect x="80" y="180" width="90" height="60" rx="12" fill="#3b82f6"/>
        <rect x="240" y="110" width="110" height="60" rx="12" fill="#10b981"/>
        <rect x="420" y="180" width="120" height="60" rx="12" fill="#f59e0b"/>
        <rect x="620" y="120" width="120" height="60" rx="12" fill="#a78bfa"/>
        <rect x="640" y="330" width="150" height="70" rx="12" fill="#ef4444"/>
        <text x="125" y="220" text-anchor="middle" fill="#fff">Laptop</text>
        <text x="295" y="150" text-anchor="middle" fill="#fff">Router</text>
        <text x="480" y="220" text-anchor="middle" fill="#fff">Switch</text>
        <text x="680" y="160" text-anchor="middle" fill="#fff">Server</text>
        <text x="715" y="370" text-anchor="middle" fill="#fff">Internet</text>
        <path d="M170 210 L240 140" stroke="#8bd3ff" stroke-width="4" fill="none"/>
        <path d="M350 140 L420 210" stroke="#8bd3ff" stroke-width="4" fill="none"/>
        <path d="M540 210 L620 150" stroke="#8bd3ff" stroke-width="4" fill="none"/>
        <path d="M680 180 L700 330" stroke="#8bd3ff" stroke-width="4" fill="none"/>
      </svg>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#0b1220"/>
      <rect x="90" y="110" width="780" height="320" rx="24" fill="#0f172a" stroke="#43d39f" stroke-width="3"/>
      <circle cx="220" cy="270" r="88" fill="#1ec38b" opacity="0.8"/>
      <rect x="400" y="190" width="260" height="150" rx="18" fill="#1f2937" stroke="#7dd3fc" stroke-width="3"/>
      <circle cx="650" cy="270" r="70" fill="#fbbf24" opacity="0.8"/>
      <path d="M 300 270 L 400 270" stroke="#66e2b2" stroke-width="8" fill="none"/>
      <path d="M 660 270 L 760 270" stroke="#66e2b2" stroke-width="8" fill="none"/>
      <text x="220" y="278" text-anchor="middle" fill="#eafaf4" font-size="22">Input</text>
      <text x="530" y="273" text-anchor="middle" fill="#eafaf4" font-size="22">${escapeXml(safeSubject.slice(0, 22))}</text>
      <text x="650" y="278" text-anchor="middle" fill="#0b1530" font-size="22">Output</text>
      <text x="480" y="480" text-anchor="middle" fill="#d9f7ef" font-size="26">${escapeXml(safeSubject)}</text>
    </svg>
  `;
}

export function createVisualExplanation(subject: string): VisualExplanation {
  const safeSubject = (subject || 'concept').trim() || 'concept';
  const kind = shouldUseVisualExplanation(safeSubject)
    ? safeSubject.toLowerCase().includes('network') || safeSubject.toLowerCase().includes('computer')
      ? 'flowchart'
      : safeSubject.toLowerCase().includes('water cycle')
        ? 'diagram'
        : safeSubject.toLowerCase().includes('solar system')
          ? 'map'
          : safeSubject.toLowerCase().includes('heart')
            ? 'diagram'
            : 'diagram'
    : 'diagram';

  return {
    title: safeSubject,
    kind,
    description: `This is a local procedural ${kind} for ${safeSubject}. It is generated in-browser without requiring a paid image API.`,
    svg: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateProceduralDiagram(safeSubject))}`,
    source: 'local',
  };
}

export function renderVisualExplanation(subject: string): string {
  return createVisualExplanation(subject).svg;
}
