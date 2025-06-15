import React, { useState, useEffect } from 'react';
import { usePwaStatus } from '../../hooks/usePwaStatus';
import { Button } from '../ui/button';
import { X, Package, Download, Share2, Menu } from 'lucide-react';

interface InstallPromptProps {
  className?: string;
}

export function InstallPrompt({ className = '' }: InstallPromptProps) {
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
      // Only consider it dismissed for 24 hours
      const dismissedAt = parseInt(dismissedTime, 10);
      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedAt) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      } else {
        // Reset the dismissed state after 24 hours
        localStorage.removeItem('pwa-install-prompt-dismissed');
      }
    }
  }, []);

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  // Don't show if not installable and not iOS
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
      // Show instructions for manual installation
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstructions(false);
    // Save to localStorage to prevent showing again for 24 hours
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
  };

  // Different instructions based on device and browser
  const getInstructions = () => {
    if (isIOS) {
      return (
        <div className="mt-2 p-3 bg-slate-800 rounded-md">
          <h4 className="font-semibold mb-2">Install on iOS:</h4>
          <ol className="list-decimal list-inside text-sm">
            <li className="mb-1">Tap the <Share2 className="inline h-4 w-4" /> share button</li>
            <li className="mb-1">Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right corner</li>
          </ol>
        </div>
      );
    } else if (isAndroid && browserName === 'chrome') {
      return (
        <div className="mt-2 p-3 bg-slate-800 rounded-md">
          <h4 className="font-semibold mb-2">Install on Android:</h4>
          <ol className="list-decimal list-inside text-sm">
            <li className="mb-1">Tap the <Menu className="inline h-4 w-4" /> menu button</li>
            <li className="mb-1">Select "Install app" or "Add to Home Screen"</li>
            <li>Follow the on-screen instructions</li>
          </ol>
        </div>
      );
    } else {
      return (
        <div className="mt-2 p-3 bg-slate-800 rounded-md">
          <h4 className="font-semibold mb-2">Install this app:</h4>
          <ol className="list-decimal list-inside text-sm">
            <li className="mb-1">Open this site in Chrome or Safari</li>
            <li className="mb-1">Tap the menu button</li>
            <li>Select "Install app" or "Add to Home Screen"</li>
          </ol>
        </div>
      );
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 p-4 bg-slate-900 text-white transform transition-transform duration-300 z-50 ${className}`}>
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold">Install Agile Warehouse</h3>
              <p className="text-sm text-slate-300">
                {isIOS
                  ? 'Add to your home screen for the best experience'
                  : isAndroid
                    ? 'Install this app on your device'
                    : 'Install for offline access and better performance'}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            {isInstallPromptAvailable && (
              <Button
                onClick={handleInstall}
                variant="outline"
                className="mr-2 text-white border-white hover:bg-slate-800"
              >
                <Download className="mr-1 h-4 w-4" /> Install
              </Button>
            )}
            {!isInstallPromptAvailable && (
              <Button
                onClick={() => setShowInstructions(!showInstructions)}
                variant="outline"
                className="mr-2 text-white border-white hover:bg-slate-800"
              >
                How to Install
              </Button>
            )}
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Show installation instructions when needed */}
        {(showInstructions || (!isInstallPromptAvailable && (isIOS || isAndroid))) && getInstructions()}
      </div>
    </div>
  );
}
