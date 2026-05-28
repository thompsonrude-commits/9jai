/**
 * SvgImageGenerator — generates images as SVG entirely in the browser.
 * No API, no internet needed. Uses D3 + SVG patterns.
 * Supports: landscapes, abstract art, patterns, flags, simple scenes.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Download } from 'lucide-react';

interface SvgImageGeneratorProps {
  prompt: string;
}

// Detect what kind of image to generate from the prompt
function detectImageType(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes('sunset') || lower.includes('sunrise')) return 'sunset';
  if (lower.includes('ocean') || lower.includes('sea') || lower.includes('beach')) return 'ocean';
  if (lower.includes('forest') || lower.includes('tree') || lower.includes('jungle')) return 'forest';
  if (lower.includes('mountain') || lower.includes('hill')) return 'mountain';
  if (lower.includes('city') || lower.includes('skyline') || lower.includes('building') || lower.includes('lagos') || lower.includes('abuja')) return 'city';
  if (lower.includes('star') || lower.includes('night') || lower.includes('moon')) return 'night';
  if (lower.includes('flower') || lower.includes('garden')) return 'garden';
  if (lower.includes('abstract') || lower.includes('pattern') || lower.includes('art')) return 'abstract';
  if (lower.includes('rain') || lower.includes('storm')) return 'rain';
  if (lower.includes('desert') || lower.includes('sand')) return 'desert';
  return 'abstract'; // default
}

// Color palettes per scene type
const PALETTES: Record<string, string[]> = {
  sunset:   ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89', '#1A936F'],
  ocean:    ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#023E8A'],
  forest:   ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D'],
  mountain: ['#6B705C', '#A5A58D', '#B7B7A4', '#D4D4AA', '#E9E9D0'],
  city:     ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429'],
  night:    ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#ADE8F4'],
  garden:   ['#D62828', '#F77F00', '#FCBF49', '#EAE2B7', '#003049'],
  abstract: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
  rain:     ['#4A4E69', '#9A8C98', '#C9ADA7', '#F2E9E4', '#22223B'],
  desert:   ['#E9C46A', '#F4A261', '#E76F51', '#264653', '#2A9D8F'],
};

function drawScene(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, type: string, w: number, h: number, prompt: string) {
  const palette = PALETTES[type] || PALETTES.abstract;
  const rng = (seed: number) => ((Math.sin(seed) * 43758.5453) % 1 + 1) % 1;

  svg.selectAll('*').remove();

  // Background gradient
  const defs = svg.append('defs');
  const grad = defs.append('linearGradient').attr('id', 'bg').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
  grad.append('stop').attr('offset', '0%').attr('stop-color', palette[0]);
  grad.append('stop').attr('offset', '100%').attr('stop-color', palette[1]);
  svg.append('rect').attr('width', w).attr('height', h).attr('fill', 'url(#bg)');

  if (type === 'sunset' || type === 'desert') {
    // Sun
    svg.append('circle').attr('cx', w * 0.5).attr('cy', h * 0.4).attr('r', h * 0.15).attr('fill', palette[2]).attr('opacity', 0.9);
    // Horizon layers
    for (let i = 0; i < 5; i++) {
      svg.append('rect').attr('x', 0).attr('y', h * (0.5 + i * 0.1)).attr('width', w).attr('height', h * 0.12).attr('fill', palette[i % palette.length]).attr('opacity', 0.5);
    }
    // Ground
    svg.append('rect').attr('x', 0).attr('y', h * 0.75).attr('width', w).attr('height', h * 0.25).attr('fill', palette[3]);
  }

  else if (type === 'ocean' || type === 'rain') {
    // Waves
    for (let i = 0; i < 8; i++) {
      const y = h * (0.4 + i * 0.08);
      const path = d3.path();
      path.moveTo(0, y);
      for (let x = 0; x <= w; x += 40) {
        path.quadraticCurveTo(x + 20, y - 15 + rng(i * 100 + x) * 20, x + 40, y);
      }
      path.lineTo(w, h); path.lineTo(0, h); path.closePath();
      svg.append('path').attr('d', path.toString()).attr('fill', palette[i % palette.length]).attr('opacity', 0.4 + i * 0.05);
    }
    // Sky
    svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h * 0.4).attr('fill', palette[0]).attr('opacity', 0.8);
  }

  else if (type === 'forest') {
    // Sky
    svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h * 0.5).attr('fill', '#87CEEB');
    // Trees
    for (let i = 0; i < 20; i++) {
      const x = rng(i * 7) * w;
      const treeH = h * (0.3 + rng(i * 13) * 0.3);
      const treeW = treeH * 0.4;
      const y = h * 0.5;
      // Trunk
      svg.append('rect').attr('x', x - treeW * 0.08).attr('y', y + treeH * 0.7).attr('width', treeW * 0.16).attr('height', treeH * 0.3).attr('fill', '#5C4033');
      // Canopy layers
      for (let j = 0; j < 3; j++) {
        const points = `${x},${y - treeH * (0.3 + j * 0.2)} ${x - treeW * (0.5 - j * 0.1)},${y + treeH * (0.2 + j * 0.15)} ${x + treeW * (0.5 - j * 0.1)},${y + treeH * (0.2 + j * 0.15)}`;
        svg.append('polygon').attr('points', points).attr('fill', palette[j % palette.length]).attr('opacity', 0.85);
      }
    }
    // Ground
    svg.append('rect').attr('x', 0).attr('y', h * 0.85).attr('width', w).attr('height', h * 0.15).attr('fill', '#2D6A4F');
  }

  else if (type === 'mountain') {
    // Sky
    svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h).attr('fill', '#87CEEB');
    // Mountains
    for (let i = 3; i >= 0; i--) {
      const points: [number, number][] = [];
      points.push([0, h]);
      for (let x = 0; x <= w; x += w / 6) {
        const peakY = h * (0.2 + rng(i * 50 + x) * 0.4);
        points.push([x, peakY]);
      }
      points.push([w, h]);
      svg.append('polygon').attr('points', points.map(p => p.join(',')).join(' ')).attr('fill', palette[i]).attr('opacity', 0.8);
    }
    // Snow caps
    svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h * 0.15).attr('fill', 'white').attr('opacity', 0.3);
  }

  else if (type === 'city') {
    // Night sky
    svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h).attr('fill', '#0D1B2A');
    // Stars
    for (let i = 0; i < 80; i++) {
      svg.append('circle').attr('cx', rng(i * 3) * w).attr('cy', rng(i * 7) * h * 0.5).attr('r', rng(i * 11) * 2).attr('fill', 'white').attr('opacity', rng(i * 17) * 0.8 + 0.2);
    }
    // Buildings
    for (let i = 0; i < 15; i++) {
      const bw = w * (0.04 + rng(i * 5) * 0.06);
      const bh = h * (0.2 + rng(i * 9) * 0.5);
      const bx = (i / 15) * w + rng(i * 3) * (w / 15);
      svg.append('rect').attr('x', bx).attr('y', h - bh).attr('width', bw).attr('height', bh).attr('fill', palette[i % palette.length]).attr('opacity', 0.9);
      // Windows
      for (let wy = 0; wy < bh; wy += 12) {
        for (let wx = 0; wx < bw; wx += 8) {
          if (rng(i * 100 + wy + wx) > 0.4) {
            svg.append('rect').attr('x', bx + wx + 1).attr('y', h - bh + wy + 2).attr('width', 4).attr('height', 6).attr('fill', '#FFD700').attr('opacity', 0.8);
          }
        }
      }
    }
  }

  else if (type === 'night') {
    // Deep space
    for (let i = 0; i < 200; i++) {
      svg.append('circle').attr('cx', rng(i * 3) * w).attr('cy', rng(i * 7) * h).attr('r', rng(i * 11) * 2.5).attr('fill', 'white').attr('opacity', rng(i * 17) * 0.9 + 0.1);
    }
    // Moon
    svg.append('circle').attr('cx', w * 0.75).attr('cy', h * 0.25).attr('r', h * 0.1).attr('fill', '#F0E68C').attr('opacity', 0.95);
    svg.append('circle').attr('cx', w * 0.78).attr('cy', h * 0.22).attr('r', h * 0.08).attr('fill', palette[0]).attr('opacity', 0.9);
  }

  else if (type === 'garden') {
    // Green background
    svg.append('rect').attr('x', 0).attr('y', 0).attr('width', w).attr('height', h).attr('fill', '#90EE90');
    // Flowers
    for (let i = 0; i < 30; i++) {
      const fx = rng(i * 7) * w;
      const fy = rng(i * 11) * h;
      const fr = h * 0.04;
      // Petals
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2;
        svg.append('ellipse').attr('cx', fx + Math.cos(angle) * fr * 1.5).attr('cy', fy + Math.sin(angle) * fr * 1.5).attr('rx', fr).attr('ry', fr * 0.5).attr('fill', palette[i % palette.length]).attr('opacity', 0.85).attr('transform', `rotate(${p * 60},${fx},${fy})`);
      }
      // Center
      svg.append('circle').attr('cx', fx).attr('cy', fy).attr('r', fr * 0.6).attr('fill', '#FFD700');
    }
  }

  else {
    // Abstract — colorful geometric shapes
    for (let i = 0; i < 40; i++) {
      const x = rng(i * 3) * w;
      const y = rng(i * 7) * h;
      const size = rng(i * 11) * Math.min(w, h) * 0.2 + 20;
      const color = palette[i % palette.length];
      const shape = Math.floor(rng(i * 17) * 3);
      if (shape === 0) {
        svg.append('circle').attr('cx', x).attr('cy', y).attr('r', size / 2).attr('fill', color).attr('opacity', 0.5 + rng(i * 23) * 0.4);
      } else if (shape === 1) {
        svg.append('rect').attr('x', x - size / 2).attr('y', y - size / 2).attr('width', size).attr('height', size).attr('fill', color).attr('opacity', 0.5 + rng(i * 23) * 0.4).attr('transform', `rotate(${rng(i * 31) * 45},${x},${y})`);
      } else {
        const pts = `${x},${y - size / 2} ${x + size / 2},${y + size / 2} ${x - size / 2},${y + size / 2}`;
        svg.append('polygon').attr('points', pts).attr('fill', color).attr('opacity', 0.5 + rng(i * 23) * 0.4);
      }
    }
  }

  // Prompt label at bottom
  svg.append('rect').attr('x', 0).attr('y', h - 28).attr('width', w).attr('height', 28).attr('fill', 'rgba(0,0,0,0.4)');
  svg.append('text').attr('x', w / 2).attr('y', h - 10).attr('text-anchor', 'middle').attr('font-size', '11px').attr('font-family', 'Inter, Arial, sans-serif').attr('fill', 'white').attr('font-weight', 'bold').text(prompt.length > 60 ? prompt.slice(0, 57) + '...' : prompt);
}

export default function SvgImageGenerator({ prompt }: SvgImageGeneratorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const w = containerRef.current.clientWidth || 400;
    const h = Math.round(w * 0.6);
    svgRef.current.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svgRef.current.setAttribute('width', String(w));
    svgRef.current.setAttribute('height', String(h));
    const type = detectImageType(prompt);
    const svg = d3.select(svgRef.current);
    drawScene(svg, type, w, h, prompt);
    setDone(true);
  }, [prompt]);

  const download = useCallback((format: 'png' | 'jpg' | 'svg') => {
    if (!svgRef.current) return;
    if (format === 'svg') {
      const data = new XMLSerializer().serializeToString(svgRef.current);
      const blob = new Blob([data], { type: 'image/svg+xml' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '9jai-image.svg'; a.click();
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const w = svgRef.current.clientWidth || 400;
    const h = svgRef.current.clientHeight || 240;
    canvas.width = w * 2; canvas.height = h * 2;
    const ctx = canvas.getContext('2d')!;
    if (format === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    img.onload = () => {
      ctx.scale(2, 2); ctx.drawImage(img, 0, 0, w, h);
      const a = document.createElement('a');
      a.download = `9jai-image.${format}`;
      a.href = canvas.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95);
      a.click();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  }, []);

  return (
    <div className="w-full max-w-[95%] rounded-2xl overflow-hidden border border-[#008751]/20 shadow-sm bg-white">
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center justify-between">
        <span className="text-sm font-bold text-[#008751]">🎨 {prompt.length > 40 ? prompt.slice(0, 37) + '...' : prompt}</span>
        {done && (
          <div className="flex gap-1">
            {(['png', 'jpg', 'svg'] as const).map(fmt => (
              <button key={fmt} onClick={() => download(fmt)}
                className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors uppercase">
                <Download size={9} /> {fmt}
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} className="w-full block" />
      </div>
    </div>
  );
}
