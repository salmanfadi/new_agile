
import React, { useState, useEffect } from 'react';
import { usePwaStatus } from '../../hooks/usePwaStatus';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { X, Package, Download, Share2, Menu, Smartphone, Monitor } from 'lucide-react';

interface EnhancedInstallPromptProps {
  className?: string;
}

export function EnhancedInstallPrompt({ className = '' }: EnhancedInstallPromptProps) {
  const { 
    isStandalone, 
    isInstallPromptAvailable, 
    isIOS, 
    isAndroid,
    isMobile,
    browserName,
    showInstallPrompt 
  } = usePwaStatus();
  
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Load dismissed state from localStorage
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-prompt-dismissed');
    if (dismissedTime) {
      const dismissedAt = parseInt(dismissedTime, 10);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedAt) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      } else {
        localStorage.removeItem('pwa-install-prompt-dismissed');
      }
    }
  }, []);

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // Don't show if not installable and not iOS/Android
  if (!isInstallPromptAvailable && !isIOS && !isAndroid) {
    return null;
  }

  const handleInstall = async () => {
    if (isInstallPromptAvailable) {
      const installed = await showInstallPrompt();
      if (installed) {
        setDismissed(true);
      }
    } else {
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstructions(false);
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
  };

  const getInstructions = () => {
    if (isIOS) {
      return (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <Smartphone className="mr-2 h-4 w-4" />
            Install on iOS:
          </h4>
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li className="flex items-center">
              <span className="ml-2">Tap the <Share2 className="inline h-4 w-4 mx-1" /> share button at the bottom</span>
            </li>
            <li className="flex items-center">
              <span className="ml-2">Scroll down and tap "Add to Home Screen"</span>
            </li>
            <li className="flex items-center">
              <span className="ml-2">Tap "Add" in the top right corner</span>
            </li>
          </ol>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
            The app will appear on your home screen like a native app!
          </p>
        </div>
      );
    } else if (isAndroid && browserName === 'chrome') {
      return (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <Smartphone className="mr-2 h-4 w-4" />
            Install on Android:
          </h4>
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li className="flex items-center">
              <span className="ml-2">Tap the <Menu className="inline h-4 w-4 mx-1" /> menu button (⋮)</span>
            </li>
            <li className="flex items-center">
              <span className="ml-2">Select "Install app" or "Add to Home Screen"</span>
            </li>
            <li className="flex items-center">
              <span className="ml-2">Follow the on-screen instructions</span>
            </li>
          </ol>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
            Get faster access and offline support!
          </p>
        </div>
      );
    } else {
      return (
        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-semibold mb-3 flex items-center">
            <Monitor className="mr-2 h-4 w-4" />
            Install this app:
          </h4>
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li>Open this site in Chrome, Safari, or Edge</li>
            <li>Look for the install button in the address bar</li>
            <li>Or use the browser menu to "Install app"</li>
          </ol>
        </div>
      );
    }
  };

  return (
    <Card className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-lg border-2 border-blue-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-blue-600 mr-2" />
            <div>
              <CardTitle className="text-lg">Install Agile Warehouse</CardTitle>
              <CardDescription className="text-sm">
                {isIOS
                  ? 'Add to your home screen for the best experience'
                  : isAndroid
                    ? 'Install this app on your device for better performance'
                    : 'Install for offline access and faster loading'}
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex gap-2">
          {isInstallPromptAvailable ? (
            <Button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Install Now
            </Button>
          ) : (
            <Button
              onClick={() => setShowInstructions(!showInstructions)}
              variant="outline"
              className="flex-1"
            >
              How to Install
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="outline"
            size="sm"
          >
            Maybe Later
          </Button>
        </div>
        
        {(showInstructions || (!isInstallPromptAvailable && (isIOS || isAndroid))) && getInstructions()}
      </CardContent>
    </Card>
  );
}
