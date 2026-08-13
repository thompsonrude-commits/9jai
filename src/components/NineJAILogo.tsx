import React, { useEffect, useRef } from 'react';

export type LogoState =
  | 'idle' | 'processing' | 'listening' | 'speaking'
  | 'success' | 'error' | 'startup' | 'vision'
  | 'ocr' | 'translation' | 'image' | 'video' | 'document';

interface NineJAILogoProps {
  state?: LogoState;
  audioLevel?: number;
  size?: number;
}

export default function NineJAILogo({ state = 'idle', audioLevel = 0, size = 160 }: NineJAILogoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef(0);
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const W = size, H = size;
    const cx = W / 2, cy = H / 2;
    const baseR = W * 0.28;

    // Color palette per state — all Nigerian green family
    type ColDef = { primary: string; secondary: string; r: number; g: number; b: number };
    const colors: Record<LogoState, ColDef> = {
      idle:        { primary: '#008751', secondary: '#00875155', r: 0,   g: 135, b: 81  },
      processing:  { primary: '#00C16A', secondary: '#00C16A44', r: 0,   g: 193, b: 106 },
      listening:   { primary: '#22F58C', secondary: '#22F58C44', r: 34,  g: 245, b: 140 },
      speaking:    { primary: '#00ff88', secondary: '#00ff8844', r: 0,   g: 255, b: 136 },
      success:     { primary: '#00ff88', secondary: '#00ff8844', r: 0,   g: 255, b: 136 },
      error:       { primary: '#f59e0b', secondary: '#f59e0b33', r: 245, g: 158, b: 11  },
      startup:     { primary: '#00C16A', secondary: '#00C16A44', r: 0,   g: 193, b: 106 },
      vision:      { primary: '#22F58C', secondary: '#22F58C44', r: 34,  g: 245, b: 140 },
      ocr:         { primary: '#00C16A', secondary: '#00C16A44', r: 0,   g: 193, b: 106 },
      translation: { primary: '#008751', secondary: '#00875155', r: 0,   g: 135, b: 81  },
      image:       { primary: '#00ff88', secondary: '#00ff8855', r: 0,   g: 255, b: 136 },
      video:       { primary: '#22F58C', secondary: '#22F58C55', r: 34,  g: 245, b: 140 },
      document:    { primary: '#00C16A', secondary: '#00C16A44', r: 0,   g: 193, b: 106 },
    };

    // Expanding WiFi-style pulse rings (4 rings, staggered)
    const RING_COUNT = 4;
    const ringPhases = Array.from({ length: RING_COUNT }, (_, i) => i / RING_COUNT);

    function hexToRgba(col: ColDef, alpha: number) {
      return `rgba(${col.r},${col.g},${col.b},${alpha})`;
    }

    function draw() {
      if (!ctx) return;
      animFrameRef.current = requestAnimationFrame(draw);
      if (prefersReducedMotion) return;

      tickRef.current += 1;
      const t = tickRef.current;
      const col = colors[state] || colors.idle;
      const level = Math.max(0, Math.min(1, audioLevel / 100));
      const speedMul = state === 'video' ? 2.2 : state === 'image' ? 1.8 : state === 'processing' ? 1.5 : state === 'listening' ? 1.3 : state === 'speaking' ? 1.4 : state === 'startup' ? 1.6 : 1.0;

      ctx.clearRect(0, 0, W, H);

      // ── 1. Expanding WiFi pulse rings (always present) ──────────────────
      for (let i = 0; i < RING_COUNT; i++) {
        ringPhases[i] = (ringPhases[i] + 0.004 * speedMul) % 1;
        const phase = ringPhases[i];
        const ringR = baseR * 1.1 + phase * baseR * 1.4 + level * 20;
        const alpha = (1 - phase) * (state === 'idle' ? 0.35 : 0.65);
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(col, alpha);
        ctx.lineWidth = state === 'idle' ? 1.2 : 2.0;
        ctx.stroke();
      }

      // ── 2. Orbiting particles (video/image/processing/startup) ──────────
      if (['video', 'image', 'processing', 'startup'].includes(state)) {
        const pCount = state === 'video' ? 8 : 5;
        for (let p = 0; p < pCount; p++) {
          const angle = (p / pCount) * Math.PI * 2 + t * 0.03 * speedMul;
          const orbitR = baseR * 1.5 + Math.sin(t * 0.05 + p) * 8;
          const px = cx + Math.cos(angle) * orbitR;
          const py = cy + Math.sin(angle) * orbitR;
          const pSize = state === 'video' ? 3.5 : 2.5;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = hexToRgba(col, 0.8);
          ctx.fill();
        }
      }

      // ── 3. Signal wave bars (processing/speaking/listening/ocr/translation) ──
      if (['processing', 'speaking', 'listening', 'ocr', 'translation', 'image', 'video', 'vision', 'document'].includes(state)) {
        const bars = state === 'video' ? 10 : state === 'image' ? 8 : 6;
        for (let b = 0; b < bars; b++) {
          const angle = (b / bars) * Math.PI * 2 + t * 0.035 * speedMul;
          const barH = (0.4 + 0.6 * Math.abs(Math.sin(t * 0.1 * speedMul + b * 1.1))) * (18 + level * 14);
          const bx = cx + Math.cos(angle) * (baseR + 16);
          const by = cy + Math.sin(angle) * (baseR + 16);
          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(angle + Math.PI / 2);
          ctx.fillStyle = hexToRgba(col, 0.75);
          ctx.beginPath();
          ctx.roundRect(-2, -barH / 2, 4, barH, 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ── 4. OCR scan beam ────────────────────────────────────────────────
      if (state === 'ocr') {
        const scanY = cy - baseR + ((t * 1.5 * speedMul) % (baseR * 2));
        const scanGrd = ctx.createLinearGradient(cx - baseR, scanY, cx + baseR, scanY);
        scanGrd.addColorStop(0, 'transparent');
        scanGrd.addColorStop(0.5, hexToRgba(col, 0.6));
        scanGrd.addColorStop(1, 'transparent');
        ctx.fillStyle = scanGrd;
        ctx.fillRect(cx - baseR, scanY - 1.5, baseR * 2, 3);
      }

      // ── 5. Vision radar sweep ───────────────────────────────────────────
      if (state === 'vision') {
        const sweepAngle = (t * 0.04 * speedMul) % (Math.PI * 2);
        const sweepGrd = (ctx as CanvasRenderingContext2D & { createConicalGradient?: (...args: number[]) => CanvasGradient }).createConicalGradient
          ? (ctx as CanvasRenderingContext2D & { createConicalGradient: (...args: number[]) => CanvasGradient }).createConicalGradient(cx, cy, sweepAngle)
          : null;
        if (!sweepGrd) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, baseR * 1.2, sweepAngle, sweepAngle + 0.8);
          ctx.closePath();
          ctx.fillStyle = hexToRgba(col, 0.25);
          ctx.fill();
          ctx.restore();
        }
      }

      // ── 6. Radial glow ──────────────────────────────────────────────────
      const glowR = state === 'idle'
        ? baseR * 1.05 + Math.sin(t * 0.025) * 5
        : baseR * 1.35 + Math.sin(t * 0.05 * speedMul) * 10 + level * 15;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      grd.addColorStop(0, hexToRgba(col, state === 'idle' ? 0.18 : 0.38));
      grd.addColorStop(0.5, hexToRgba(col, state === 'idle' ? 0.08 : 0.15));
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx.fill();

      // ── 7. Circle ring (the solid ring around logo center) ─────────────
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.fillStyle = '#070B12';
      ctx.fill();
      const ringAlpha = state === 'idle' ? 0.5 + Math.sin(t * 0.02) * 0.1 : 0.9;
      ctx.strokeStyle = hexToRgba(col, ringAlpha);
      ctx.lineWidth = state === 'idle' ? 1.8 : 2.8;
      ctx.stroke();

      // ── 8. Success checkmark ────────────────────────────────────────────
      if (state === 'success') {
        const prog = Math.min(1, (t % 90) / 45);
        ctx.strokeStyle = col.primary;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = prog;
        ctx.beginPath();
        ctx.moveTo(cx - 12, cy);
        ctx.lineTo(cx - 3, cy + 10);
        ctx.lineTo(cx + 13, cy - 11);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ── 9. Error pulse (amber, no red) ──────────────────────────────────
      if (state === 'error') {
        const prog = 0.7 + Math.sin(t * 0.08) * 0.3;
        ctx.strokeStyle = col.primary;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.globalAlpha = prog;
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy - 9); ctx.lineTo(cx + 9, cy + 9);
        ctx.moveTo(cx + 9, cy - 9); ctx.lineTo(cx - 9, cy + 9);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state, audioLevel, size, prefersReducedMotion]);

  const showLogo = !['success', 'error'].includes(state);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: size, height: size }} />
      {showLogo && (
        <img
          src="/logo.png"
          alt="9JAI"
          style={{
            position: 'relative',
            width: size * 0.40,
            height: size * 0.40,
            objectFit: 'contain',
            zIndex: 1,
            filter: state === 'processing' || state === 'image' || state === 'video'
              ? `drop-shadow(0 0 10px rgba(0,255,136,0.9))`
              : state === 'listening'
                ? `drop-shadow(0 0 8px rgba(34,245,140,0.8))`
                : `drop-shadow(0 0 6px rgba(0,135,81,0.7))`,
            transform: state === 'speaking' ? `scale(${1 + Math.sin(Date.now() * 0.008) * 0.02})` : 'scale(1)',
            transition: 'filter 0.4s ease, transform 0.1s',
          }}
        />
      )}
    </div>
  );
}
