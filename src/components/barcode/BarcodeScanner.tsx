
import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Check } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
  stopOnDetect?: boolean;
  scanButtonLabel?: string;
  previewWidth?: number;
  previewHeight?: number;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  stopOnDetect = true,
  scanButtonLabel = 'Scan Barcode',
  previewWidth = 320,
  previewHeight = 240
}) => {
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const hasMounted = useRef(false);

  const startScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setScanning(true);
      setDetected(false);
      
      // Clear the scanner element first
      scannerRef.current.innerHTML = '';
      
      // Check for camera access and initialize Quagga
      await Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: previewWidth,
            height: previewHeight,
            facingMode: "environment" // use rear camera if available
          }
        },
        frequency: 10, // reduce CPU usage
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        decoder: {
          readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader"] // specify barcode types to detect
        },
        locate: true
      });
      
      Quagga.start();
      
      // Add barcode detection event
      Quagga.onDetected(handleDetection);
      
    } catch (error) {
      console.error("Error starting scanner:", error);
      setScanning(false);
      if (onError) onError(error as Error);
    }
  };

  const stopScanner = () => {
    if (Quagga) {
      try {
        Quagga.offDetected(handleDetection);
        Quagga.stop();
      } catch (e) {
        console.error("Error stopping scanner:", e);
      }
    }
    setScanning(false);
  };

  const handleDetection = (result: any) => {
    const code = result.codeResult.code;
    if (code) {
      setLastDetected(code);
      setDetected(true);
      onScan(code);
      
      if (stopOnDetect) {
        stopScanner();
      }
    }
  };

  // Clean up when component unmounts
  useEffect(() => {
    hasMounted.current = true;
    
    return () => {
      if (hasMounted.current) {
        stopScanner();
      }
    };
  }, []);

  return (
    <div className="barcode-scanner-container">
      <div className="flex justify-center mb-4">
        {!scanning && !detected && (
          <Button 
            onClick={startScanner}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            {scanButtonLabel}
          </Button>
        )}
        
        {scanning && !detected && (
          <Button 
            variant="outline" 
            onClick={stopScanner}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            Stop Scanner
          </Button>
        )}
        
        {detected && lastDetected && (
          <div className="flex items-center gap-2">
            <span className="font-mono bg-muted px-2 py-1 rounded text-sm">
              {lastDetected}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setDetected(false);
                startScanner();
              }}
            >
              Scan Again
            </Button>
          </div>
        )}
      </div>
      
      <div 
        ref={scannerRef} 
        className={`barcode-scanner-view relative overflow-hidden rounded border border-gray-300 ${scanning ? 'block' : 'hidden'}`}
        style={{ maxWidth: `${previewWidth}px`, height: scanning ? `${previewHeight}px` : '0px', margin: '0 auto' }}
      >
        {scanning && (
          <div className="barcode-scanner-overlay absolute inset-0 border-2 border-dashed border-yellow-400 pointer-events-none z-10 flex items-center justify-center">
            <div className="bg-black/50 text-white px-3 py-1 rounded text-xs">
              Point camera at barcode
            </div>
          </div>
        )}
      </div>
      
      {detected && lastDetected && (
        <div className="text-center mt-4 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
          <Check className="h-5 w-5 text-green-500" />
          <span className="font-medium">Barcode detected!</span>
        </div>
      )}
    </div>
  );
};

// Add default export to maintain backward compatibility
export default BarcodeScanner;
