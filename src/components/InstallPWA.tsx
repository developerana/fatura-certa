import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check iOS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt (Android/Chrome)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed) return null;

  // Show install banner
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-lg flex items-center gap-3 max-w-md mx-auto">
        <Download className="h-6 w-6 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Instalar App</p>
          <p className="text-xs text-muted-foreground">Acesse mais rápido pela tela inicial</p>
        </div>
        <Button size="sm" onClick={handleInstall}>Instalar</Button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // iOS instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 bg-card border border-border rounded-xl p-4 shadow-lg max-w-md mx-auto">
        <div className="flex items-start gap-3">
          <Share className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">Instalar App</p>
            <p className="text-xs text-muted-foreground mt-1">
              Toque em <strong>Compartilhar</strong> <Share className="h-3 w-3 inline" /> e depois em <strong>"Adicionar à Tela de Início"</strong>
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
