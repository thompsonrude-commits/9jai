/**
 * AnimatedIllustration — generates 8-second animated SVG illustrations
 * entirely in the browser. No API, no cost.
 * Scenes: sunrise, rain, city, ocean, forest, science, math, flag, celebration
 */
import React, { useRef, useCallback, useState } from 'react';
import { Download, Play, Pause } from 'lucide-react';

interface AnimatedIllustrationProps {
  prompt: string;
}

function detectScene(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('sunrise') || p.includes('sunset') || p.includes('sun')) return 'sunrise';
  if (p.includes('rain') || p.includes('storm') || p.includes('cloud')) return 'rain';
  if (p.includes('city') || p.includes('lagos') || p.includes('abuja') || p.includes('building')) return 'city';
  if (p.includes('ocean') || p.includes('sea') || p.includes('wave') || p.includes('beach')) return 'ocean';
  if (p.includes('forest') || p.includes('tree') || p.includes('jungle')) return 'forest';
  if (p.includes('math') || p.includes('equation') || p.includes('calcul')) return 'math';
  if (p.includes('science') || p.includes('atom') || p.includes('molecule')) return 'science';
  if (p.includes('flag') || p.includes('nigeria')) return 'flag';
  if (p.includes('celebrat') || p.includes('party') || p.includes('festival')) return 'celebration';
  if (p.includes('heart') || p.includes('love')) return 'love';
  return 'abstract';
}

function buildSVGAnimation(scene: string, prompt: string): string {
  const label = prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt;

  const scenes: Record<string, string> = {
    sunrise: `
      <rect width="400" height="280" fill="#1a1a4e"/>
      <rect y="200" width="400" height="80" fill="#2d4a1e"/>
      <circle cx="200" cy="280" r="60" fill="#ff6b35">
        <animate attributeName="cy" from="280" to="120" dur="4s" fill="freeze"/>
        <animate attributeName="fill" from="#ff6b35" to="#FFD700" dur="4s" fill="freeze"/>
      </circle>
      <rect width="400" height="280" fill="#87CEEB" opacity="0">
        <animate attributeName="opacity" from="0" to="0.7" begin="2s" dur="3s" fill="freeze"/>
      </rect>
      <ellipse cx="80" cy="60" rx="40" ry="20" fill="white" opacity="0">
        <animate attributeName="opacity" from="0" to="0.9" begin="3s" dur="2s" fill="freeze"/>
        <animateTransform attributeName="transform" type="translate" from="-50 0" to="0 0" begin="3s" dur="2s" fill="freeze"/>
      </ellipse>
      <ellipse cx="300" cy="40" rx="50" ry="22" fill="white" opacity="0">
        <animate attributeName="opacity" from="0" to="0.9" begin="4s" dur="2s" fill="freeze"/>
      </ellipse>`,

    rain: `
      <rect width="400" height="280" fill="#4a5568"/>
      <ellipse cx="100" cy="50" rx="80" ry="40" fill="#718096"/>
      <ellipse cx="250" cy="40" rx="100" ry="45" fill="#4a5568"/>
      <ellipse cx="350" cy="60" rx="70" ry="35" fill="#718096"/>
      ${Array.from({length: 20}, (_, i) => `
        <line x1="${20 + i*19}" y1="80" x2="${15 + i*19}" y2="110" stroke="#90cdf4" stroke-width="1.5" opacity="0.8">
          <animate attributeName="y1" values="80;200;80" dur="${0.6 + (i%3)*0.2}s" repeatCount="indefinite"/>
          <animate attributeName="y2" values="110;230;110" dur="${0.6 + (i%3)*0.2}s" repeatCount="indefinite"/>
        </line>`).join('')}
      <rect y="240" width="400" height="40" fill="#2d3748"/>`,

    city: `
      <rect width="400" height="280" fill="#0d1b2a"/>
      ${[30,70,110,150,190,230,270,310,350].map((x, i) => {
        const h = 80 + (i%3)*60; const w = 30 + (i%2)*10;
        return `<rect x="${x}" y="${280-h}" width="${w}" height="${h}" fill="#1e3a5f"/>
        <rect x="${x}" y="${280-h}" width="${w}" height="${h}" fill="#2d5a8e" opacity="0.5"/>
        ${Array.from({length: 6}, (_, r) => `<rect x="${x+4}" y="${280-h+10+r*12}" width="6" height="6" fill="#FFD700" opacity="${Math.random()>0.4?0.9:0.1}">
          <animate attributeName="opacity" values="${Math.random()>0.5?'0.9;0.1;0.9':'0.1;0.9;0.1'}" dur="${1+r*0.3}s" repeatCount="indefinite"/>
        </rect>`).join('')}`;
      }).join('')}
      <circle cx="50" cy="30" r="15" fill="#FFD700" opacity="0.8"/>
      ${Array.from({length:8},(_,i)=>`<circle cx="${50+Math.cos(i*45*Math.PI/180)*25}" cy="${30+Math.sin(i*45*Math.PI/180)*25}" r="1.5" fill="white"/>`).join('')}`,

    ocean: `
      <rect width="400" height="280" fill="#87CEEB"/>
      <circle cx="350" cy="50" r="35" fill="#FFD700"/>
      <rect y="140" width="400" height="140" fill="#0077b6"/>
      ${Array.from({length:5},(_,i)=>`
        <path d="M${-50+i*100},${160+i*8} Q${25+i*100},${145+i*8} ${50+i*100},${160+i*8} Q${75+i*100},${175+i*8} ${100+i*100},${160+i*8}" fill="none" stroke="#00b4d8" stroke-width="3">
          <animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="${1.5+i*0.3}s" repeatCount="indefinite"/>
        </path>`).join('')}
      <ellipse cx="80" cy="100" rx="50" ry="25" fill="white" opacity="0.9"/>
      <ellipse cx="250" cy="80" rx="60" ry="28" fill="white" opacity="0.9"/>`,

    forest: `
      <rect width="400" height="280" fill="#87CEEB"/>
      <rect y="220" width="400" height="60" fill="#2d6a4f"/>
      ${[40,90,140,190,240,290,340].map((x,i)=>{
        const h=100+(i%3)*40;
        return `<polygon points="${x},${220-h} ${x-30},220 ${x+30},220" fill="${['#1b4332','#2d6a4f','#40916c'][i%3]}"/>
        <polygon points="${x},${220-h-20} ${x-22},${220-h+30} ${x+22},${220-h+30}" fill="${['#40916c','#52b788','#74c69d'][i%3]}"/>
        <rect x="${x-4}" y="210" width="8" height="15" fill="#5c4033"/>`;
      }).join('')}
      <circle cx="60" cy="50" r="25" fill="#FFD700">
        <animate attributeName="cy" values="50;45;50" dur="3s" repeatCount="indefinite"/>
      </circle>`,

    math: `
      <rect width="400" height="280" fill="#1a1a2e"/>
      <text x="200" y="60" text-anchor="middle" font-size="28" fill="#00d4ff" font-family="monospace" font-weight="bold" opacity="0">
        E = mc²
        <animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze"/>
      </text>
      <text x="200" y="110" text-anchor="middle" font-size="20" fill="#7fff00" font-family="monospace" opacity="0">
        ∫f(x)dx = F(x) + C
        <animate attributeName="opacity" from="0" to="1" begin="1.5s" dur="1s" fill="freeze"/>
      </text>
      <text x="200" y="155" text-anchor="middle" font-size="22" fill="#ff6b9d" font-family="monospace" opacity="0">
        a² + b² = c²
        <animate attributeName="opacity" from="0" to="1" begin="3s" dur="1s" fill="freeze"/>
      </text>
      <text x="200" y="200" text-anchor="middle" font-size="18" fill="#ffd700" font-family="monospace" opacity="0">
        π ≈ 3.14159265...
        <animate attributeName="opacity" from="0" to="1" begin="4.5s" dur="1s" fill="freeze"/>
      </text>
      ${Array.from({length:20},(_,i)=>`<circle cx="${Math.random()*400}" cy="${Math.random()*280}" r="1" fill="white" opacity="${Math.random()*0.5}"/>`).join('')}`,

    science: `
      <rect width="400" height="280" fill="#0d1b2a"/>
      <circle cx="200" cy="140" r="20" fill="#00d4ff">
        <animate attributeName="r" values="20;22;20" dur="1s" repeatCount="indefinite"/>
      </circle>
      ${[0,60,120,180,240,300].map((angle,i)=>`
        <circle cx="${200+80*Math.cos(angle*Math.PI/180)}" cy="${140+40*Math.sin(angle*Math.PI/180)}" r="8" fill="${['#ff6b9d','#7fff00','#ffd700','#00d4ff','#ff6b35','#c77dff'][i]}">
          <animateTransform attributeName="transform" type="rotate" from="0 200 140" to="360 200 140" dur="${2+i*0.3}s" repeatCount="indefinite"/>
        </circle>`).join('')}
      <ellipse cx="200" cy="140" rx="80" ry="40" fill="none" stroke="#00d4ff" stroke-width="1.5" opacity="0.4"/>
      <ellipse cx="200" cy="140" rx="80" ry="40" fill="none" stroke="#7fff00" stroke-width="1.5" opacity="0.4" transform="rotate(60 200 140)"/>
      <ellipse cx="200" cy="140" rx="80" ry="40" fill="none" stroke="#ff6b9d" stroke-width="1.5" opacity="0.4" transform="rotate(120 200 140)"/>`,

    flag: `
      <rect width="400" height="280" fill="#e8f4f8"/>
      <rect x="80" y="40" width="240" height="200" fill="#008751"/>
      <rect x="160" y="40" width="80" height="200" fill="white"/>
      <rect x="240" y="40" width="80" height="200" fill="#008751"/>
      <line x1="80" y1="40" x2="80" y2="240" stroke="#333" stroke-width="4"/>
      <line x1="80" y1="40" x2="80" y2="10" stroke="#333" stroke-width="4"/>
      <animateTransform attributeName="transform" type="translate" values="0,0;2,0;-2,0;0,0" dur="0.5s" repeatCount="indefinite"/>`,

    celebration: `
      <rect width="400" height="280" fill="#1a1a2e"/>
      ${Array.from({length:30},(_,i)=>`
        <circle cx="${Math.random()*400}" cy="${Math.random()*280}" r="${2+Math.random()*4}" fill="${['#ff6b35','#ffd700','#7fff00','#00d4ff','#ff6b9d','#c77dff'][i%6]}">
          <animate attributeName="cy" values="${Math.random()*280};${Math.random()*280};${Math.random()*280}" dur="${1+Math.random()*2}s" repeatCount="indefinite"/>
          <animate attributeName="cx" values="${Math.random()*400};${Math.random()*400};${Math.random()*400}" dur="${1+Math.random()*2}s" repeatCount="indefinite"/>
        </circle>`).join('')}
      <text x="200" y="130" text-anchor="middle" font-size="32" fill="#ffd700" font-family="Arial" font-weight="bold">🎉</text>
      <text x="200" y="170" text-anchor="middle" font-size="20" fill="white" font-family="Arial" font-weight="bold">Celebrate!</text>`,

    love: `
      <rect width="400" height="280" fill="#1a0a0a"/>
      ${Array.from({length:8},(_,i)=>`
        <text x="${50+i*45}" y="${100+Math.sin(i)*30}" font-size="${20+i*3}" fill="#ff6b9d" opacity="0">❤️
          <animate attributeName="opacity" from="0" to="1" begin="${i*0.3}s" dur="0.5s" fill="freeze"/>
          <animate attributeName="y" values="${100+Math.sin(i)*30};${80+Math.sin(i)*30};${100+Math.sin(i)*30}" begin="${i*0.3}s" dur="1s" repeatCount="indefinite"/>
        </text>`).join('')}
      <text x="200" y="200" text-anchor="middle" font-size="24" fill="#ffd700" font-family="Arial" font-weight="bold" opacity="0">
        With Love ❤️
        <animate attributeName="opacity" from="0" to="1" begin="3s" dur="1s" fill="freeze"/>
      </text>`,

    abstract: `
      <rect width="400" height="280" fill="#0d1b2a"/>
      ${Array.from({length:12},(_,i)=>`
        <circle cx="${200+100*Math.cos(i*30*Math.PI/180)}" cy="${140+80*Math.sin(i*30*Math.PI/180)}" r="${8+i*2}" fill="none" stroke="${['#00d4ff','#7fff00','#ff6b9d','#ffd700'][i%4]}" stroke-width="2" opacity="0.7">
          <animate attributeName="r" values="${8+i*2};${12+i*2};${8+i*2}" dur="${1+i*0.2}s" repeatCount="indefinite"/>
        </circle>`).join('')}
      <circle cx="200" cy="140" r="15" fill="#00d4ff">
        <animate attributeName="r" values="15;20;15" dur="1s" repeatCount="indefinite"/>
      </circle>`,
  };

  const svgContent = scenes[scene] || scenes.abstract;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280" width="400" height="280">
    ${svgContent}
    <rect x="0" y="255" width="400" height="25" fill="rgba(0,0,0,0.5)"/>
    <text x="200" y="272" text-anchor="middle" font-size="10" fill="white" font-family="Inter,Arial,sans-serif">${label}</text>
  </svg>`;
}

export default function AnimatedIllustration({ prompt }: AnimatedIllustrationProps) {
  const scene = detectScene(prompt);
  const svgContent = buildSVGAnimation(scene, prompt);
  const [playing, setPlaying] = useState(true);
  const svgRef = useRef<HTMLDivElement>(null);

  const downloadVideo = useCallback(async (format: 'gif' | 'mp4') => {
    if (!svgRef.current) return;
    // For now download as SVG (animated)
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `9jai-animation.svg`;
    a.click();
  }, [svgContent]);

  const downloadPNG = useCallback(() => {
    if (!svgRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 560;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 800, 560);
      const a = document.createElement('a');
      a.download = '9jai-illustration.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  }, [svgContent]);

  return (
    <div className="w-full max-w-[95%] rounded-2xl overflow-hidden border border-[#008751]/20 shadow-md bg-white">
      <div className="px-3 py-2 bg-[#008751]/5 border-b border-[#008751]/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎬</span>
          <span className="text-sm font-bold text-[#008751] truncate max-w-[180px]">{prompt}</span>
          <span className="text-[10px] text-gray-400 font-medium">8s animation</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setPlaying(p => !p)}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
            {playing ? <Pause size={10} /> : <Play size={10} />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={downloadPNG}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
            <Download size={10} /> PNG
          </button>
          <button onClick={() => downloadVideo('gif')}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#008751] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors">
            <Download size={10} /> SVG
          </button>
        </div>
      </div>
      <div
        ref={svgRef}
        className="w-full"
        style={{ animationPlayState: playing ? 'running' : 'paused' }}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-400 font-medium">SVG Animation • Play/Pause • Download as PNG or SVG</p>
      </div>
    </div>
  );
}
