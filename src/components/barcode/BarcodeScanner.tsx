
import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Check } from 'lucide-react';

export interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
  onBarcodeScanned?: (barcode: string) => Promise<void>;
  onScanComplete?: (data: any) => void;
  onDetected?: (barcode: string) => void;
  onClose?: () => void;
  stopOnDetect?: boolean;
  scanButtonLabel?: string;
  previewWidth?: number;
  previewHeight?: number;
  allowManualEntry?: boolean;
  allowCameraScanning?: boolean;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  embedded?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onError,
  onBarcodeScanned,
  onScanComplete,
  onDetected,
  onClose,
  stopOnDetect = true,
  scanButtonLabel = 'Scan Barcode',
  previewWidth = 320,
  previewHeight = 240,
  allowManualEntry = false,
  allowCameraScanning = true,
  inputValue = '',
  onInputChange,
  embedded = false
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
    if (onClose) onClose();
  };

  const handleDetection = (result: any) => {
    const code = result.codeResult.code;
    if (code) {
      setLastDetected(code);
      setDetected(true);
      
      // Call all provided callbacks with the barcode
      onScan(code);
      if (onBarcodeScanned) onBarcodeScanned(code);
      if (onDetected) onDetected(code);
      if (onScanComplete) onScanComplete({ code });
      
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
      {allowManualEntry && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Enter barcode manually"
              value={inputValue}
              onChange={onInputChange}
            />
            <Button 
              type="button"
              onClick={() => {
                if (inputValue && inputValue.trim() !== '') {
                  onScan(inputValue);
                  if (onBarcodeScanned) onBarcodeScanned(inputValue);
                  if (onDetected) onDetected(inputValue);
                  if (onScanComplete) onScanComplete({ code: inputValue });
                }
              }}
              disabled={!inputValue}
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-4">
        {!scanning && !detected && allowCameraScanning && (
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
