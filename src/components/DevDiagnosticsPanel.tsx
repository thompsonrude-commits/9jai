import React from 'react';

interface DevDiagnosticsPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DevDiagnosticsPanel({ isVisible, onClose }: DevDiagnosticsPanelProps) {
  if (!isVisible) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-white font-bold mb-3">9JAI Diagnostics</h2>
        <p className="text-white/60 text-sm">Version 2.0 · Firebase · Production</p>
        <button onClick={onClose} className="mt-4 px-4 py-2 bg-[#00ff88] text-black rounded-xl text-sm font-bold">Close</button>
      </div>
    </div>
  );
}
