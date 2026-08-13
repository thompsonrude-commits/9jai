import React, { useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCcw, Zap } from 'lucide-react';
import { proxyVision } from '../lib/aiProxy';

interface VisionEngineProps {
  onClose: () => void;
  onResult: (text: string) => void;
}

export default function VisionEngine({ onClose, onResult }: VisionEngineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async (mode: 'user' | 'environment' = 'environment') => {
    try {
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraError('');
    } catch (e: any) {
      setCameraError('Camera access denied. Please allow camera permission.');
    }
  }, []);

  React.useEffect(() => {
    startCamera(facingMode);
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, [facingMode, startCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const scale = Math.min(1, 1024 / Math.max(videoRef.current.videoWidth, videoRef.current.videoHeight));
    canvas.width = Math.round(videoRef.current.videoWidth * scale);
    canvas.height = Math.round(videoRef.current.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.8));
  }, []);

  const analyze = useCallback(async () => {
    if (!captured) return;
    setScanning(true);
    try {
      const result = await proxyVision(captured, 'Describe this image in full detail. Include objects, people, text, colors, mood, and context.');
      onResult(result.text);
    } catch (e: any) {
      const msg = /IMAGE_TOO_LARGE|too large/i.test(e?.message ?? '')
        ? 'This image is too large for direct Vision analysis. Please resize or compress it and try again.'
        : 'I couldn’t analyze that image because the vision engine is temporarily unavailable. Please try again shortly.';
      onResult(msg);
    } finally {
      setScanning(false);
    }
  }, [captured, onResult]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#070B12] border border-[#008751]/30 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#008751]/20">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff88] text-lg">👁️</span>
            <span className="text-[#00ff88] font-bold">Vision / Camera</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-green-500 hover:text-[#00ff88] hover:bg-[#008751]/10 transition-all"><X size={18} /></button>
        </div>

        {/* Camera / Preview */}
        <div className="relative bg-black aspect-video">
          {cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div>
                <p className="text-3xl mb-2">📷</p>
                <p className="text-red-400 text-sm font-semibold">{cameraError}</p>
              </div>
            </div>
          ) : captured ? (
            <img src={captured} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
          )}
          <canvas ref={canvasRef} className="hidden" />
          {/* Scan overlay */}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-[#00ff88] text-center">
                <div className="w-12 h-12 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold">Analyzing image…</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-[#008751]/20">
          {!captured ? (
            <>
              <button onClick={() => { const next = facingMode === 'environment' ? 'user' : 'environment'; setFacingMode(next); }} className="p-2.5 rounded-xl border border-[#008751]/30 text-green-400 hover:text-[#00ff88] hover:bg-[#008751]/10 transition-all" title="Flip camera">
                <RotateCcw size={18} />
              </button>
              <button onClick={capture} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#008751] text-white font-bold rounded-xl hover:bg-[#00a862] transition-all active:scale-95">
                <Camera size={18} /> Capture
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setCaptured(null)} className="flex-1 py-2.5 border border-[#008751]/30 text-green-400 font-bold rounded-xl hover:bg-[#008751]/10 transition-all">
                Retake
              </button>
              <button onClick={analyze} disabled={scanning} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#008751] text-white font-bold rounded-xl hover:bg-[#00a862] transition-all disabled:opacity-50 active:scale-95">
                <Zap size={18} /> {scanning ? 'Analyzing…' : 'Analyze'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
