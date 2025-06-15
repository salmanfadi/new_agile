import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

/**
 * A button that forces the PWA installation prompt to show
 * This is useful when the automatic browser prompt doesn't appear
 */
export function ForceInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://') ||
      window.location.href.includes('standalone=true');
    
    setIsStandalone(standalone);

    // Capture the install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If no install prompt is available, open a modal with instructions
      alert('To install this app:\n\n1. Open this site in Chrome\n2. Tap the menu button (⋮)\n3. Select "Install app" or "Add to Home Screen"');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // Reset the deferred prompt variable
    setDeferredPrompt(null);
    setIsInstallable(false);
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  return (
    <Button 
      onClick={handleInstall}
      className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
    >
      <Download className="mr-2 h-4 w-4" />
      Install App
    </Button>
  );
}
