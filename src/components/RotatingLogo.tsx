import React from 'react';

/**
 * 3D Rotating Logo — uses /logo.png from public folder
 * Spins counter-clockwise (west to east, like Earth)
 * CSS 3D perspective gives a globe-like rotation effect
 */

const LOGO_SRC = '/logo.png';

// ── Shared 3D spin keyframes injected once ─────────────────────────────────
const STYLE_ID = '9jai-logo-spin';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes spin3d {
      0%   { transform: perspective(200px) rotateY(0deg); }
      100% { transform: perspective(200px) rotateY(-360deg); }
    }
    .logo-spin-3d {
      animation: spin3d 8s linear infinite;
      transform-style: preserve-3d;
    }
    @keyframes spin3d-lg {
      0%   { transform: perspective(300px) rotateY(0deg); }
      100% { transform: perspective(300px) rotateY(-360deg); }
    }
    .logo-spin-3d-lg {
      animation: spin3d-lg 8s linear infinite;
      transform-style: preserve-3d;
    }
  `;
  document.head.appendChild(style);
}

// ── Small logo — used in top bar ──────────────────────────────────────────
export default function RotatingLogo() {
  return (
    <div className="flex justify-center py-3">
      <img
        src={LOGO_SRC}
        alt="9jai"
        className="logo-spin-3d w-12 h-12 object-contain"
        style={{ background: 'none', borderRadius: 0 }}
      />
    </div>
  );
}

// ── Large hero logo — used in welcome screen ──────────────────────────────
export function RotatingLogoHero() {
  return (
    <div className="mb-3">
      <img
        src={LOGO_SRC}
        alt="9jai"
        className="logo-spin-3d-lg w-20 h-20 object-contain"
        style={{ background: 'none', borderRadius: 0 }}
      />
    </div>
  );
}

// ── Medium logo — used in login/admin pages ───────────────────────────────
export function RotatingLogoMedium() {
  return (
    <div>
      <img
        src={LOGO_SRC}
        alt="9jai"
        className="logo-spin-3d w-16 h-16 object-contain"
        style={{ background: 'none', borderRadius: 0 }}
      />
    </div>
  );
}
