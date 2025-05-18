
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Barcode, Camera } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: Error) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onError }) => {
  const [barcode, setBarcode] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannerAvailable, setScannerAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check if hardware scanner is available
    const checkScanner = async () => {
      try {
        // This is a simple check - we assume that if the browser supports
        // the Barcode Detection API, a scanner might be available
        if ('BarcodeDetector' in window) {
          setScannerAvailable(true);
        }
      } catch (error) {
        console.error('Error checking barcode scanner:', error);
        setScannerAvailable(false);
      }
    };

    checkScanner();
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      onScan(barcode);
      setBarcode('');
    }
  };

  const toggleScanning = () => {
    const newState = !isScanning;
    setIsScanning(newState);
    
    if (!newState) {
      // Stop scanning logic would go here
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Enter barcode manually"
            className="flex-grow"
          />
          <Button type="submit" variant="default">
            <Barcode className="h-4 w-4 mr-2" />
            Enter
          </Button>
        </form>
        
        {scannerAvailable && (
          <Button
            type="button"
            variant={isScanning ? "destructive" : "outline"}
            onClick={toggleScanning}
          >
            <Camera className="h-4 w-4 mr-2" />
            {isScanning ? "Stop Scanning" : "Start Scanner"}
          </Button>
        )}
      </div>

      {isScanning && (
        <div className="border rounded-md p-4 bg-muted/50 text-center">
          <div className="animate-pulse">Scanning...</div>
          <div className="mt-2 text-sm text-muted-foreground">
            Position barcode in front of camera
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
