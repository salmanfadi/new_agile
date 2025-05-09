
import { useRef, useEffect } from 'react';

interface UseHardwareScannerProps {
  isScanning: boolean;
  processScan: (barcode: string) => Promise<void>;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function useHardwareScanner({
  isScanning,
  processScan,
  inputRef
}: UseHardwareScannerProps) {
  const barcodeBuffer = useRef('');
  const lastScanTime = useRef<number>(0);

  // Handle hardware scanner input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process if we're in scanning mode or the input is focused
      if (!isScanning && document.activeElement !== inputRef.current) {
        return;
      }
      
      const currentTime = new Date().getTime();
      
      // Reset buffer if there's been a pause (hardware scanners are typically fast)
      if (currentTime - lastScanTime.current > 500) {
        barcodeBuffer.current = '';
      }
      
      lastScanTime.current = currentTime;
      
      // Check if it's the Enter key (typically sent by scanner after complete scan)
      if (event.key === 'Enter') {
        event.preventDefault();
        const scannedCode = barcodeBuffer.current.trim();
        if (scannedCode) {
          processScan(scannedCode);
          barcodeBuffer.current = '';
        }
      } else if (/^[0-9a-zA-Z-_]$/.test(event.key)) {
        // Only accept alphanumeric characters, hyphens, and underscores
        barcodeBuffer.current += event.key;
      }
    };
    
    // Listen for key events during scanning
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScanning, processScan, inputRef]);

  return {
    barcodeBuffer
  };
}
