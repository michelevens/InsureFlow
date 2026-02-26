import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Download, X } from 'lucide-react';

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if user hasn't dismissed before
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deferredPrompt as any).prompt();
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50 p-4 animate-in slide-in-from-bottom">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl gradient-shield flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Install Insurons</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Install the app for faster access and offline support.
          </p>
          <div className="flex gap-2 mt-3">
            <Button variant="shield" size="sm" onClick={handleInstall}>
              Install
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
