/**
 * SpeakerCube — Futuristic AI Speaker Visualizer
 * - Stays visible as long as speaker is ON (isActive)
 * - Single button: speaker toggle (on/off)
 * - Modern dark UI with animated waveform
 */
import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SpeakerCubeProps {
  isActive: boolean;     // speaker is ON — page stays visible
  isSpeaking: boolean;   // AI currently speaking
  isBusy: boolean;       // AI thinking
  text?: string;
  onEnd?: () => void;    // turn speaker OFF
  onVoiceInput?: (text: string) => void;
}

export default function SpeakerCube({ isActive, isSpeaking, isBusy, onEnd }: SpeakerCubeProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const animRef     = useRef<number>(0);
  const tRef        = useRef(0);
  const speakRef    = useRef(isSpeaking);
  const busyRef     = useRef(isBusy);
  speakRef.current  = isSpeaking;
  busyRef.current   = isBusy;

  const isAnimating = isSpeaking || isBusy;
  const label = isSpeaking ? 'SPEAKING' : isBusy ? 'THINKING' : 'STANDBY';

  // ── Canvas — runs while isActive is true ─────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    function frame() {
      const active = speakRef.current || busyRef.current;
      tRef.current += active ? 0.030 : 0.008;
      const t = tRef.current;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) { animRef.current = requestAnimationFrame(frame); return; }
      const cx = W / 2;
      const cy = H / 2;

      ctx.clearRect(0, 0, W, H);

      // ── Deep space background ───────────────────────────────────────────
      const bg = ctx.createRadialGradient(cx, cy * 0.6, 0, cx, cy, Math.max(W, H) * 0.85);
      bg.addColorStop(0,   '#050e0a');
      bg.addColorStop(0.5, '#020805');
      bg.addColorStop(1,   '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Grid lines (futuristic) ─────────────────────────────────────────
      ctx.strokeStyle = 'rgba(0,135,81,0.04)';
      ctx.lineWidth   = 0.5;
      for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // ── Glow halo ──────────────────────────────────────────────────────
      const R = Math.min(W, H) * 0.30;
      if (active) {
        const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.8);
        halo.addColorStop(0,   `rgba(0,255,100,${0.10 + 0.08 * Math.abs(Math.sin(t * 1.4))})`);
        halo.addColorStop(0.5, 'rgba(0,135,81,0.04)');
        halo.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Particle orbits ─────────────────────────────────────────────────
      const numOrbit = active ? 5 : 2;
      for (let o = 0; o < numOrbit; o++) {
        const orR    = R * (0.85 + o * 0.18);
        const speed  = (0.22 + o * 0.08) * (o % 2 === 0 ? 1 : -1);
        const numDot = active ? 6 : 2;
        for (let d = 0; d < numDot; d++) {
          const angle = t * speed + (d / numDot) * Math.PI * 2;
          const px    = cx + Math.cos(angle) * orR;
          const py    = cy + Math.sin(angle) * orR * 0.42;
          const size  = active ? (1.5 + Math.abs(Math.sin(t * 3 + d + o)) * 2.5) : 1.0;
          const alpha = active ? (0.4 + Math.abs(Math.sin(t * 2 + d)) * 0.5) : 0.15;
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0,255,100,${alpha})`;
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur  = active ? 10 : 0;
          ctx.fill();
          ctx.shadowBlur  = 0;
        }
      }

      // ── Morphing plasma ring ────────────────────────────────────────────
      const numLayers = 3;
      for (let layer = 0; layer < numLayers; layer++) {
        const alpha = active ? (0.85 - layer * 0.22) : (0.18 - layer * 0.04);
        const scale = 1 + layer * 0.07;
        ctx.beginPath();
        const pts = 220;
        for (let i = 0; i <= pts; i++) {
          const a   = (i / pts) * Math.PI * 2;
          const amp = active ? (0.14 + 0.11 * Math.abs(Math.sin(t * 1.6 + a * 2 + layer * 0.8))) : 0.020;
          const n1  = Math.sin(a * 4  + t * 2.1 + layer * 0.9) * 0.09;
          const n2  = Math.sin(a * 7  - t * 1.5 + layer * 1.3) * 0.06;
          const n3  = Math.sin(a * 11 + t * 2.9 - layer * 0.6) * 0.03;
          const r   = R * scale * (1 + (n1 + n2 + n3) * amp / 0.18);
          const x   = cx + Math.cos(a) * r;
          const y   = cy + Math.sin(a) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();

        const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
        if (active) {
          const pulse = 0.7 + 0.3 * Math.abs(Math.sin(t * 1.1 + layer));
          g.addColorStop(0.0,  `rgba(0,255,120,${alpha * pulse})`);
          g.addColorStop(0.35, `rgba(0,200,80,${alpha * pulse * 0.9})`);
          g.addColorStop(0.7,  `rgba(0,135,81,${alpha * pulse * 0.8})`);
          g.addColorStop(1.0,  `rgba(0,60,30,${alpha * pulse * 0.5})`);
        } else {
          g.addColorStop(0, `rgba(0,135,81,${alpha})`);
          g.addColorStop(1, `rgba(0,40,20,${alpha * 0.5})`);
        }
        ctx.strokeStyle = g;
        ctx.lineWidth   = active ? Math.max(0.5, 4.0 - layer * 0.9) : 0.8;
        ctx.shadowColor = active ? '#00ff66' : 'transparent';
        ctx.shadowBlur  = active ? (20 - layer * 5) : 0;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // ── EQ bars inside ring ─────────────────────────────────────────────
      if (active) {
        const numBars  = 18;
        const barMax   = R * 0.22;
        const barAreaW = R * 0.68;
        const barSp    = barAreaW / numBars;
        const barBase  = cy - R * 0.35;
        for (let b = 0; b < numBars; b++) {
          const bh  = barMax * (0.15 + 0.85 * Math.abs(Math.sin(t * 5.2 + b * 0.55 + (speakRef.current ? 1.5 : 0.4))));
          const bx  = cx - barAreaW / 2 + b * barSp + barSp * 0.1;
          const bw  = barSp * 0.72;
          const hue = 130 + b * 4;
          const barG = ctx.createLinearGradient(bx, barBase, bx, barBase - bh);
          barG.addColorStop(0, `hsla(${hue},100%,40%,0.3)`);
          barG.addColorStop(1, `hsla(${hue},100%,75%,0.95)`);
          ctx.fillStyle   = barG;
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur  = 5;
          ctx.beginPath();
          ctx.roundRect(bx, barBase - bh, bw, bh, 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // ── Scan line effect ────────────────────────────────────────────────
      const scanY = ((t * 60) % H);
      const scanG = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 4);
      scanG.addColorStop(0,   'rgba(0,255,80,0)');
      scanG.addColorStop(0.7, `rgba(0,255,80,${active ? 0.04 : 0.015})`);
      scanG.addColorStop(1,   'rgba(0,255,80,0)');
      ctx.fillStyle = scanG;
      ctx.fillRect(0, scanY - 20, W, 24);

      // ── Center dark circle ──────────────────────────────────────────────
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2);
      const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.52);
      centerGrad.addColorStop(0, '#060e08');
      centerGrad.addColorStop(1, '#020505');
      ctx.fillStyle = centerGrad;
      ctx.fill();

      // Center ring
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = active ? `rgba(0,255,80,${0.15 + 0.10 * Math.abs(Math.sin(t * 1.8))})` : 'rgba(0,135,81,0.18)';
      ctx.lineWidth   = 1;
      ctx.stroke();

      // ── Pause bars ─────────────────────────────────────────────────────
      const bW = R * 0.13, bH = R * 0.40, bG = R * 0.12;
      ctx.fillStyle = active ? `rgba(255,255,255,${0.75 + 0.20 * Math.abs(Math.sin(t * 2))})` : 'rgba(0,200,80,0.55)';
      ctx.beginPath();
      ctx.roundRect(cx - bG - bW, cy - bH / 2, bW, bH, 4);
      ctx.roundRect(cx + bG,      cy - bH / 2, bW, bH, 4);
      ctx.fill();

      // ── Corner accent marks ─────────────────────────────────────────────
      const corners = [[0.12, 0.12], [0.88, 0.12], [0.12, 0.88], [0.88, 0.88]];
      for (const [fx, fy] of corners) {
        const px = W * fx, py = H * fy;
        const len = 18, a = active ? 0.5 : 0.2;
        ctx.strokeStyle = `rgba(0,200,80,${a})`;
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, py + (fy < 0.5 ? 0 : -len)); ctx.lineTo(px, py + (fy < 0.5 ? len : 0));
        ctx.moveTo(px + (fx < 0.5 ? 0 : -len), py); ctx.lineTo(px + (fx < 0.5 ? len : 0), py);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(frame);
    }

    animRef.current = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [isActive]); // eslint-disable-line

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black overflow-hidden" style={{ fontFamily: '"Segoe UI", system-ui, sans-serif' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-6 pb-0 z-10 relative select-none">
        {/* Left: branding */}
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#008751] animate-pulse"/>
          <span className="text-[#008751] text-xs font-medium tracking-[0.3em] uppercase">9ja AI</span>
        </div>

        {/* Center: status */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="text-[#00cc55]/80 text-[10px] tracking-[0.35em] uppercase font-light">{label}</span>
            {isAnimating && (
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-0.5 h-3 bg-[#008751] rounded-full"
                    style={{ animation: `speakPulse 0.6s ease-in-out infinite alternate`, animationDelay: `${i * 0.15}s` }}/>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: speaker toggle button ONLY */}
        <button
          onClick={onEnd}
          className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-95"
          style={{
            background: 'rgba(0,135,81,0.12)',
            borderColor: 'rgba(0,135,81,0.40)',
            color: '#00cc55',
          }}
        >
          <Volume2 size={14}/>
          <span className="text-xs font-medium tracking-wide">Speaker On</span>
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative min-h-0">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ width: '100%', height: '100%' }}/>

        {/* Current text — subtle, only when not speaking */}
        {!isSpeaking && !isBusy && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none w-[70%] text-center">
            <p className="text-[#008751]/35 text-[10px] tracking-wider uppercase">Ready</p>
          </div>
        )}
      </div>

      {/* Bottom: minimal turn-off strip */}
      <div className="z-10 px-6 pb-8 pt-2 flex justify-center">
        <button
          onClick={onEnd}
          className="flex items-center gap-3 px-8 py-3 rounded-full border transition-all active:scale-95 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400"
          style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(0,135,81,0.25)', color: 'rgba(0,180,80,0.6)' }}
        >
          <VolumeX size={16}/>
          <span className="text-xs tracking-[0.2em] uppercase">Turn Off Speaker</span>
        </button>
      </div>

      <style>{`
        @keyframes speakPulse {
          from { transform: scaleY(0.3); opacity: 0.4; }
          to   { transform: scaleY(1.5); opacity: 1.0; }
        }
      `}</style>
    </div>
  );
}
