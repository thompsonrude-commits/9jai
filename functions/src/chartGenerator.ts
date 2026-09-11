export type ChartRequest = {
  type?: 'bar' | 'line' | 'pie';
  labels: string[];
  values: number[];
  width?: number;
  height?: number;
  title?: string;
};

export function generateChartSVG(req: ChartRequest): { svg: string; contentType: string } {
  const type = req.type || 'bar';
  const labels = req.labels || [];
  const values = req.values || [];
  const width = req.width || 800;
  const height = req.height || 400;
  const pad = 40;
  const title = req.title || '';

  if (!labels || !values || labels.length === 0 || values.length === 0) {
    throw new Error('labels and values are required');
  }

  if (type === 'bar') {
    const maxV = Math.max(...values, 1);
    const barW = Math.floor((width - pad * 2) / Math.max(1, values.length)) - 8;
    const bars = values.map((v, i) => {
      const h = Math.round(((v / maxV) * (height - pad * 2)));
      const x = pad + i * (barW + 8);
      const y = height - pad - h;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${h}" fill="#008751" />`;
    }).join('\n');

    const labelEls = labels.map((lab, i) => {
      const x = pad + i * (barW + 8) + barW / 2;
      const safeLab = String(lab).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<text x="${x}" y="${height - pad + 16}" font-size="12" fill="#062e2a" text-anchor="middle">${safeLab}</text>`;
    }).join('\n');

    const svg = `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="100%" height="100%" fill="#f7fff9"/>` +
      (title ? `<text x="${width/2}" y="20" text-anchor="middle" font-size="16" fill="#064e3b">${String(title)}</text>` : '') +
      `<g>${bars}</g>` +
      `<g>${labelEls}</g>` +
      `</svg>`;

    return { svg, contentType: 'image/svg+xml' };
  }

  // Fallback: simple line
  if (type === 'line') {
    const maxV = Math.max(...values, 1);
    const step = (width - pad * 2) / Math.max(1, values.length - 1);
    const points = values.map((v, i) => {
      const x = pad + i * step;
      const y = height - pad - Math.round(((v / maxV) * (height - pad * 2)));
      return `${x},${y}`;
    }).join(' ');

    const labelEls = labels.map((lab, i) => {
      const x = pad + i * step;
      const safeLab = String(lab).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<text x="${x}" y="${height - pad + 16}" font-size="12" fill="#062e2a" text-anchor="middle">${safeLab}</text>`;
    }).join('\n');

    const svg = `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="100%" height="100%" fill="#fff"/>` +
      `<polyline fill="none" stroke="#008751" stroke-width="2" points="${points}"/>` +
      `<g>${labelEls}</g>` +
      `</svg>`;

    return { svg, contentType: 'image/svg+xml' };
  }

  // Pie chart simple
  if (type === 'pie') {
    const total = values.reduce((s, v) => s + v, 0) || 1;
    let angle = -Math.PI / 2;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.min(width, height) / 2 - pad;
    const slices = values.map((v, i) => {
      const portion = v / total;
      const theta = portion * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += theta;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = theta > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return `<path d="${path}" fill="hsl(${(i * 60) % 360} 70% 50%)" />`;
    }).join('\n');

    const svg = `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="100%" height="100%" fill="#fff"/>` +
      `${slices}` +
      `</svg>`;

    return { svg, contentType: 'image/svg+xml' };
  }

  throw new Error('Unsupported chart type');
}
