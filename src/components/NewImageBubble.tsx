import React, { useState, useEffect, useCallback } from 'react';
import { generateImage, type ImageGenerationRequest } from '../lib/newImageEngine';

interface NewImageBubbleProps {
  request: ImageGenerationRequest;
  onComplete?: (imageUrl: string) => void;
}

export default function NewImageBubble({ request, onComplete }: NewImageBubbleProps) {
  const [status, setStatus] = useState<'generating' | 'loading' | 'loaded' | 'error'>('generating');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const [provider, setProvider] = useState<string>('');

  const generate = useCallback(async () => {
    console.log('[NewImageBubble] Starting generation');
    setStatus('generating');
    setProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 5, 90));
    }, 300);

    try {
      const result = await generateImage(request);
      clearInterval(progressInterval);
      setProgress(95);

      console.log('[NewImageBubble] Generation result:', result);

      if (result.success) {
        setImageUrl(result.imageUrl);
        setProvider(result.provider);
        setStatus('loading'); // Will trigger onLoad
        setProgress(100);
        onComplete?.(result.imageUrl);
      } else {
        // Even on "failure", we have a fallback image
        setImageUrl(result.imageUrl);
        setProvider(result.provider);
        setStatus('loading');
        setProgress(100);
        onComplete?.(result.imageUrl);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('[NewImageBubble] Generation error:', err);
      setStatus('error');
      setError(err.message || 'Image generation failed');
    }
  }, [request, onComplete]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleImageLoad = () => {
    console.log('[NewImageBubble] Image loaded successfully');
    setStatus('loaded');
    setProgress(100);
  };

  const handleImageError = async () => {
    console.error('[NewImageBubble] Image failed to load from Pollinations');
    
    // Try alternative AI generation first
    try {
      console.log('[NewImageBubble] Trying Hugging Face API...');
      const response = await fetch('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: request.prompt,
          parameters: {
            width: request.dimensions?.width || 1024,
            height: request.dimensions?.height || 1024,
          }
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          console.log('[NewImageBubble] Hugging Face succeeded!');
          setImageUrl(dataUrl);
          setProvider('huggingface');
          setStatus('loading'); // Will trigger onLoad
        };
        reader.readAsDataURL(blob);
        return; // Exit early if HF works
      }
    } catch (err) {
      console.log('[NewImageBubble] Hugging Face also failed, using SVG fallback');
    }
    
    // If all AI providers fail, use SVG fallback
    const dimensions = {
      width: request.dimensions?.width || 1024,
      height: request.dimensions?.height || 1024
    };
    
    const colors = {
      logo: ['#1e40af', '#3b82f6'],
      flyer: ['#dc2626', '#f59e0b'],
      'business-card': ['#1f2937', '#6b7280'],
      letterhead: ['#0f766e', '#14b8a6'],
      ad: ['#7c3aed', '#a78bfa'],
      banner: ['#ea580c', '#fb923c'],
      poster: ['#be123c', '#fb7185'],
      regular: ['#059669', '#10b981'],
    };
    
    const type = request.type || 'regular';
    const [color1, color2] = colors[type as keyof typeof colors] || colors.regular;
    const { width, height } = dimensions;
    
    // Create beautiful SVG fallback
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
  
  <!-- Decorative elements -->
  <circle cx="${width * 0.2}" cy="${height * 0.3}" r="${Math.min(width, height) * 0.15}" 
    fill="white" opacity="0.1"/>
  <circle cx="${width * 0.8}" cy="${height * 0.7}" r="${Math.min(width, height) * 0.12}" 
    fill="white" opacity="0.1"/>
  
  <!-- Type label -->
  <text x="${width/2}" y="60" font-size="24" fill="white" opacity="0.8" 
    text-anchor="middle" font-family="Arial, sans-serif" font-weight="600">
    ${type.toUpperCase()}
  </text>
  
  <!-- Main text -->
  <text x="${width/2}" y="${height/2}" font-size="${type === 'logo' ? '48' : '36'}" 
    fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">
    ${request.prompt.substring(0, 30)}
  </text>
  
  ${request.textOverlay?.title ? `
    <text x="${width/2}" y="${height - 100}" font-size="32" fill="white" 
      text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">
      ${request.textOverlay.title}
    </text>
  ` : ''}
  
  <!-- Footer -->
  <text x="${width/2}" y="${height - 40}" font-size="18" fill="white" opacity="0.7" 
    text-anchor="middle" font-family="Arial, sans-serif">
    Powered by 9JAI
  </text>
</svg>`;
    
    const fallbackUrl = `data:image/svg+xml;base64,${btoa(svg.replace('Powered by 9JAI', 'Placeholder image - no provider available'))}`;
    setImageUrl(fallbackUrl);
    setProvider('placeholder');
    setStatus('loading'); // Will trigger onLoad
  };

  const handleRetry = () => {
    setError('');
    generate();
  };

  const handleDownload = (format: 'png' | 'jpg' = 'png') => {
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `9jai-${request.type || 'image'}-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[92%] rounded-2xl overflow-hidden border border-[#008751]/30 shadow-lg bg-[#07110d]">
      {/* Progress Bar */}
      {(status === 'generating' || status === 'loading') && (
        <div className="relative w-full h-2 bg-[#0a1a12]">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#008751] to-[#00ff88] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Loading State */}
      {status === 'generating' && (
        <div className="px-5 py-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-[#008751]/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#008751] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-[#00ff88] font-bold text-lg mb-2">
            Generating {request.type || 'Image'}...
          </p>
          <p className="text-green-600 text-sm">
            {progress}% complete
          </p>
          <p className="text-green-700 text-xs mt-2">
            {request.prompt.substring(0, 50)}...
          </p>
        </div>
      )}

      {/* Image Display */}
      {imageUrl && (status === 'loading' || status === 'loaded') && (
        <>
          <img
            src={imageUrl}
            alt={request.prompt}
            className={`w-full h-auto block transition-opacity duration-500 ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />

          {/* Image Info Bar */}
          {status === 'loaded' && (
            <div className="px-3 py-2 bg-[#0a1a12] border-t border-[#008751]/20 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-green-600 font-medium truncate">
                  🎨 {request.type || 'image'} · {provider === 'placeholder' ? '⚠️ Placeholder — no provider available' : provider}
                </p>
                <p className="text-[9px] text-green-700 truncate">
                  {request.prompt}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handleRetry}
                  className="px-2 py-1 text-[10px] font-bold text-green-500 border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
                  title="Regenerate"
                >
                  🔄
                </button>
                {provider !== 'placeholder' && (
                  <>
                    <button
                      onClick={() => handleDownload('png')}
                      className="px-2 py-1 text-[10px] font-bold text-[#00ff88] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
                      title="Download PNG"
                    >
                      ⬇ PNG
                    </button>
                    <button
                      onClick={() => handleDownload('jpg')}
                      className="px-2 py-1 text-[10px] font-bold text-[#00ff88] border border-[#008751]/30 rounded-lg hover:bg-[#008751]/10 transition-colors"
                      title="Download JPG"
                    >
                      ⬇ JPG
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="px-5 py-6 text-center">
          <p className="text-3xl mb-2">😔</p>
          <p className="text-sm font-bold text-green-300 mb-1">Generation Failed</p>
          <p className="text-xs text-green-600 mb-3">{error || 'Unknown error'}</p>
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
