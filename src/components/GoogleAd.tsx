import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  adLayout?: string;
  className?: string;
  responsive?: boolean;
}

/**
 * Google AdSense Component
 * 
 * Usage:
 * <GoogleAd adSlot="1234567890" adFormat="auto" responsive />
 */
export default function GoogleAd({ 
  adSlot, 
  adFormat = 'auto', 
  adLayout,
  className = '',
  responsive = true 
}: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      // Push ad to AdSense queue
      if (window.adsbygoogle && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, []);

  return (
    <div className={`google-ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={import.meta.env.VITE_GOOGLE_ADSENSE_ID || 'ca-pub-0000000000000000'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-ad-layout={adLayout}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

// Add TypeScript declaration for AdSense
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}
