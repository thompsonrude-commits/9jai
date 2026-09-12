import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for PWA install availability
    const handleInstallPrompt = (e: any) => {
      setDeferredPrompt(e.detail);
      setShowBanner(true);
    };

    window.addEventListener('pwa-install-available', handleInstallPrompt);

    return () => {
      window.removeEventListener('pwa-install-available', handleInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA install');
    } else {
      console.log('❌ User dismissed PWA install');
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
        >
          <div className="bg-gradient-to-br from-[#008751] to-[#00a862] rounded-2xl shadow-2xl p-4 text-white">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div className="shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <img src="/logo.png" alt="BLACK AI" className="w-10 h-10" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base mb-1">Install BLACK AI</h3>
                <p className="text-sm text-white/90 mb-3 leading-snug">
                  Add to your home screen for faster access and offline support
                </p>

                <button
                  onClick={handleInstall}
                  className="w-full bg-white text-[#008751] font-bold text-sm py-2.5 px-4 rounded-xl hover:bg-white/95 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Install App
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
