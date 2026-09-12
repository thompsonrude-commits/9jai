import React, { useState, useEffect, useCallback } from 'react';
import { generateImageWithQuotaCheck, parseImageRequest, type ImageRequest } from '../lib/imageGeneration';
import { User as FirebaseUser } from 'firebase/auth';

interface ImageBubbleProps {
  prompt: string;
  onRetry?: () => void;
  user?: FirebaseUser | null;
}

export default function ImageBubble({ prompt, onRetry, user }: ImageBubbleProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState<string>('');

  const generate = useCallback(async () => {
    console.log('[ImageBubble] Generating image for:', prompt);
    setStatus('loading');
    setProgress(0);
    setError('');
    setQuotaInfo('');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 300);

    try {
      // Parse the request to detect type and extract text
      const request: ImageRequest = parseImageRequest(prompt);
      console.log('[ImageBubble] Parsed request:', request);

      // Generate with quota check
      const result = await generateImageWithQuotaCheck(
        request,
        user?.uid,
        user?.email || undefined
      );
      clearInterval(progressInterval);
      setProgress(100);

      if (result.quotaExceeded) {
        console.error('[ImageBubble] Quota exceeded');
        setError(result.quotaMessage || 'Daily limit reached');
        setStatus('error');
        return;
      }

      if (result.success) {
        console.log('[ImageBubble] Success:', result.imageUrl);
        setImageUrl(result.imageUrl);
        setStatus('success');
        
        // Show remaining quota
        if (result.remaining) {
          const { daily, monthly } = result.remaining;
          if (daily !== -1) {
            setQuotaInfo(`${daily} left today · ${monthly} this month`);
          }
        }
      } else {
        console.error('[ImageBubble] Failed:', result.error);
        setImageUrl(result.imageUrl); // Show fallback
        setError(result.error || 'Generation failed');
        setStatus('error');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('[ImageBubble] Error:', err);
      setError(err.message || 'Failed to generate image');
      setStatus('error');
    }
  }, [prompt, user]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleDownload = (format: 'png' | 'jpg') => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `blackai-${prompt.slice(0, 20).replace(/\s+/g, '-')}.${format}`;
    link.click();
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      generate();
    }
  };

  return (
    <div className="max-w-[92%] rounded-2xl overflow-hidden border border-[#008751]/30 shadow-lg bg-[#07110d]">
      {/* Loading State */}
      {status === 'loading' && (
        <div className="relative bg-gradient-to-br from-[#0a1f15] to-[#050e0a] aspect-video flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-16 h-16 border-4 border-[#008751] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#00ff88] font-bold text-lg mb-2">Generating Image...</p>
            <div className="w-64 h-2 bg-[#1a3d2e] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#008751] to-[#00ff88] transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-green-400 text-sm mt-2">{progress}%</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'success' && imageUrl && (
        <>
          <img 
            src={imageUrl} 
            alt={prompt} 
            className="w-full h-auto block"
            onLoad={() => {
              console.log('[ImageBubble] Image loaded successfully');
            }}
            onError={() => {
              console.error('[ImageBubble] Image failed to load, using SVG fallback');
              // Generate SVG fallback on error
              const fallbackSvg = `data:image/svg+xml;base64,${btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
                  <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#008751;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#00d37a;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <rect width="1024" height="1024" fill="url(#grad)"/>
                  <circle cx="512" cy="341" r="170" fill="rgba(255,255,255,0.2)"/>
                  <text x="512" y="512" font-family="Arial, sans-serif" font-size="36" fill="#ffffff" text-anchor="middle" font-weight="bold">
                    ${prompt.substring(0, 30)}
                  </text>
                  <text x="512" y="562" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">
                    AI Generated Image
                  </text>
                  <text x="512" y="650" font-family="Arial, sans-serif" font-size="16" fill="rgba(255,255,255,0.6)" text-anchor="middle">
                    Powered by BLACK AI
                  </text>
                </svg>
              `)}`;
              setImageUrl(fallbackSvg);
            }}
          />
          <div className="px-3 py-2 bg-[#0a1a12] border-t border-[#008751]/20 flex items-center gap-2">
            <span className="text-[10px] text-green-600 font-medium flex-1 truncate">
              🎨 {prompt.slice(0, 50)}{prompt.length > 50 ? '...' : ''}
            </span>
            {quotaInfo && (
              <span className="text-[9px] text-[#00ff88] font-bold px-2 py-1 bg-[#008751]/10 rounded">
                {quotaInfo}
              </span>
            )}
            <button 
              onClick={handleRetry} 
              className="px-2 py-1 text-[10px] font-bold text-green-500 border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
              title="Regenerate"
            >
              🔄
            </button>
            <button 
              onClick={() => handleDownload('png')} 
              className="px-2 py-1 text-[10px] font-bold text-[#00ff88] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
            >
              ⬇ PNG
            </button>
            <button 
              onClick={() => handleDownload('jpg')} 
              className="px-2 py-1 text-[10px] font-bold text-[#00ff88] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
            >
              ⬇ JPG
            </button>
          </div>
        </>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="px-6 py-8 text-center">
          <p className="text-4xl mb-3">😔</p>
          <p className="text-sm font-bold text-green-300 mb-2">Image generation failed</p>
          <p className="text-xs text-green-600 mb-4">{error || 'Unknown error'}</p>
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt="Fallback" 
              className="w-full h-auto mb-4 rounded-lg opacity-50"
            />
          )}
          <button 
            onClick={handleRetry} 
            className="px-4 py-2 bg-[#008751] text-white text-xs font-bold rounded-xl hover:bg-[#006b40] transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      )}
    </div>
  );
}
