import React, { useRef, useState, useCallback } from 'react';
import { X, Camera, RotateCcw, Zap } from 'lucide-react';
import { proxyVision } from '../lib/aiProxy';
import { detectTextInImage } from '../lib/ocr';

interface VisionEngineProps {
  onClose: () => void;
  onResult: (text: string, imageData?: string) => void;
  mode?: 'vision' | 'ocr';
}

export default function VisionEngine({ onClose, onResult, mode = 'vision' }: VisionEngineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionScreen, setShowPermissionScreen] = useState(true);

  const startCamera = useCallback(async (cameraMode: 'user' | 'environment' = 'environment') => {
    try {
      setCameraError('');
      if (streamRef.current) { 
        streamRef.current.getTracks().forEach(t => t.stop()); 
      }
      
      console.log('[VisionEngine] Requesting camera access with mode:', cameraMode);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraMode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      
      console.log('[VisionEngine] Camera stream obtained:', stream.active);
      streamRef.current = stream;
      setPermissionGranted(true);
      setShowPermissionScreen(false);
      
      // Give React time to render the video element
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) { 
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log('[VisionEngine] Video metadata loaded, playing...');
          videoRef.current?.play().catch(err => {
            console.error('[VisionEngine] Play failed:', err);
          });
        };
      } else {
        console.error('[VisionEngine] Video ref is null');
      }
    } catch (e: any) {
      console.error('[VisionEngine] Camera error:', e);
      setCameraError('Camera access denied. Please allow camera permission in your browser settings.');
      setPermissionGranted(false);
      setShowPermissionScreen(false);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    setShowPermissionScreen(false);
    await startCamera(facingMode);
  }, [facingMode, startCamera]);

  React.useEffect(() => {
    return () => { 
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop()); 
      }
    };
  }, []);

  const handleFlipCamera = useCallback(() => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (permissionGranted) {
      startCamera(next);
    }
  }, [facingMode, permissionGranted, startCamera]);

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const scale = Math.min(1, 1024 / Math.max(videoRef.current.videoWidth, videoRef.current.videoHeight));
    canvas.width = Math.round(videoRef.current.videoWidth * scale);
    canvas.height = Math.round(videoRef.current.videoHeight * scale);
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCaptured(canvas.toDataURL('image/jpeg', 0.8));
  }, []);

  const analyze = useCallback(async () => {
    if (!captured) return;
    setScanning(true);
    try {
      if (mode === 'ocr') {
        console.log('[VisionEngine] Running OCR on captured image...');
        const ocrResult = await detectTextInImage(captured);
        
        if (ocrResult.text && ocrResult.text.trim()) {
          // Professional, concise OCR result format
          const confidence = ocrResult.confidence ? ` (${Math.round(ocrResult.confidence * 100)}% confidence)` : '';
          const resultText = `📝 Text Extracted${confidence}:\n\n${ocrResult.text.trim()}`;
          onResult(resultText);
        } else {
          onResult('❌ No text detected in the image. Please ensure the image contains clear, readable text and try again.');
        }
      } else {
        // Vision Mode: Analyze image with focus on main subject/object
        const detailedPrompt = `Analyze this image with FOCUS ON THE MAIN SUBJECT/OBJECT, not the background.

PRIORITY ANALYSIS (in order):
1. Primary Object/Subject: What is the main item in the image?
2. Text & Labels: Read ALL visible text, labels, brand names, product names
3. Product Details (if applicable):
   - Product/medicine name
   - Brand/manufacturer name
   - Scientific/generic names
   - Contents/ingredients/composition
   - Dosage/strength/specifications
   - Expiry date, batch number, lot number
   - Country of manufacture/origin
   - Usage/purpose/indications
   - Warnings, cautions, or instructions
   - Barcodes, QR codes, or product codes
4. Physical Description: Size, color, shape, packaging condition
5. Background: Only mention briefly if contextually important

Focus on extracting COMPLETE and DETAILED information from any text, labels, or packaging visible in the image. Read everything you can see on the main subject.`;

        const result = await proxyVision(captured, detailedPrompt);
        onResult(result.text);
      }
    } catch (e: any) {
      if (mode === 'ocr') {
        onResult('OCR failed. Please try again or upload a clearer image with visible text.');
      } else {
        const isLarge = /IMAGE_TOO_LARGE|too large/i.test(e?.message ?? '');
        const msg = isLarge 
          ? 'This image is too large for direct Vision analysis. Please resize or compress it and try again.'
          : 'Vision analysis temporarily unavailable. Please try again shortly.';
        onResult(msg);
      }
    } finally {
      setScanning(false);
    }
  }, [captured, onResult, mode]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#070B12] border border-[#008751]/30 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#008751]/20">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff88] text-lg">{mode === 'ocr' ? '📝' : '👁️'}</span>
            <span className="text-[#00ff88] font-bold">{mode === 'ocr' ? 'OCR / Camera' : 'Vision / Camera'}</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-green-500 hover:text-[#00ff88] hover:bg-[#008751]/10 transition-all"><X size={18} /></button>
        </div>

        <div className="relative bg-black aspect-video">
          {showPermissionScreen ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
              <div className="max-w-sm">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-[#00ff88] text-xl font-bold mb-3">
                  {mode === 'ocr' ? 'Camera Access for OCR' : 'Camera Access for Vision'}
                </h3>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  {mode === 'ocr' 
                    ? 'Allow camera access to capture and extract text from images in real-time.'
                    : 'Allow camera access to capture and analyze images with AI vision.'}
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={requestCameraPermission}
                    className="w-full py-3 bg-[#008751] text-white font-bold rounded-xl hover:bg-[#00a862] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Allow Camera Access
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full py-2.5 border border-[#008751]/30 text-green-400 font-semibold rounded-xl hover:bg-[#008751]/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Your camera feed is processed locally and never stored.
                </p>
              </div>
            </div>
          ) : cameraError ? (
            <div className="absolute inset-0 flex items-center justify-center text-center p-6">
              <div>
                <p className="text-5xl mb-3">🚫</p>
                <p className="text-red-400 text-sm font-semibold mb-4">{cameraError}</p>
                <button 
                  onClick={onClose}
                  className="px-6 py-2 bg-[#008751] text-white font-bold rounded-xl hover:bg-[#00a862] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : captured ? (
            <img src={captured} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
          )}
          
          <canvas ref={canvasRef} className="hidden" />
          
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-[#00ff88] text-center">
                <div className="w-12 h-12 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold">{mode === 'ocr' ? 'Extracting text...' : 'Analyzing image...'}</p>
              </div>
            </div>
          )}
        </div>

        {!showPermissionScreen && !cameraError && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-[#008751]/20">
            {!captured ? (
              <>
                <button 
                  onClick={handleFlipCamera} 
                  className="px-3 py-2.5 rounded-xl border border-[#008751]/30 text-green-400 hover:text-[#00ff88] hover:bg-[#008751]/10 transition-all flex items-center gap-2" 
                  title={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to back camera'}
                  disabled={!permissionGranted}
                >
                  <RotateCcw size={18} />
                  <span className="text-xs font-semibold hidden sm:inline">
                    {facingMode === 'environment' ? 'Back' : 'Front'}
                  </span>
                </button>
                <button 
                  onClick={capture} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#008751] text-white font-bold rounded-xl hover:bg-[#00a862] transition-all active:scale-95 disabled:opacity-50"
                  disabled={!permissionGranted}
                >
                  <Camera size={18} /> Capture
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setCaptured(null)} 
                  className="flex-1 py-2.5 border border-[#008751]/30 text-green-400 font-bold rounded-xl hover:bg-[#008751]/10 transition-all"
                >
                  Retake
                </button>
                <button 
                  onClick={analyze} 
                  disabled={scanning} 
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#008751] text-white font-bold rounded-xl hover:bg-[#00a862] transition-all disabled:opacity-50 active:scale-95"
                >
                  <Zap size={18} /> {scanning ? (mode === 'ocr' ? 'Extracting...' : 'Analyzing...') : (mode === 'ocr' ? 'Extract Text' : 'Analyze')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
