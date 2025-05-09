
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ScanResponse } from '@/types/auth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input'; 
import { Button } from '@/components/ui/button';
import { Barcode, Search, Camera, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Import our new components and hooks
import { BarcodeScannerProps } from './types';
import { useBarcodeProcessor } from './useBarcodeProcessor';
import { useBarcodeDetection } from './useBarcodeDetection';
import { useHardwareScanner } from './useHardwareScanner';
import ScanDataDisplay from './ScanDataDisplay';
import CameraScanner from './CameraScanner';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScanComplete,
  embedded = false,
  allowManualEntry = true,
  allowCameraScanning = true,
  onBarcodeScanned,
  inputValue,
  onInputChange,
  scanButtonLabel = 'Search',
}) => {
  const [barcode, setBarcode] = useState(inputValue || '');
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize our custom hooks
  const {
    processScan,
    loading,
    error,
    setError,
    scanData,
    setScanData
  } = useBarcodeProcessor({
    user,
    toast,
    onScanComplete,
    onBarcodeScanned
  });

  const {
    initBarcodeDetection,
    cleanupResources
  } = useBarcodeDetection({
    processScan,
    isCameraActive,
    videoRef,
    canvasRef
  });

  useHardwareScanner({
    isScanning,
    processScan,
    inputRef
  });

  // Update barcode when inputValue changes (for controlled component)
  useEffect(() => {
    if (inputValue !== undefined) {
      setBarcode(inputValue);
    }
  }, [inputValue]);

  // Handle camera activation/deactivation
  useEffect(() => {
    if (isCameraActive) {
      initBarcodeDetection();
    } else {
      cleanupResources();
    }
    
    return cleanupResources;
  }, [isCameraActive, initBarcodeDetection, cleanupResources]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcode) {
      processScan(barcode);
      // Only reset barcode if not controlled externally
      if (inputValue === undefined) {
        setBarcode('');
      }
    }
  };

  const toggleScanner = () => {
    setIsScanning(!isScanning);
    if (!isScanning) {
      // Focus on the input when scanner is activated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  const resetScan = () => {
    setScanData(null);
    setError(null);
    setBarcode('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle input change for controlled or uncontrolled component
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onInputChange) {
      // For controlled component
      onInputChange(e);
    } else {
      // For uncontrolled component
      setBarcode(e.target.value);
    }
  };

  return (
    <Card className={embedded ? 'border-dashed border-2' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Barcode className="mr-2 h-5 w-5" />
          Barcode Scanner
        </CardTitle>
        <CardDescription>
          {isScanning 
            ? 'Ready to scan. Use a barcode scanner or enter manually.' 
            : 'Click Start Scanning to begin.'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isScanning && (
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                type="text"
                value={barcode}
                onChange={handleInputChange}
                placeholder="Scan or enter barcode"
                className="flex-1"
                autoFocus
                disabled={loading}
              />
              
              {allowManualEntry && (
                <Button type="submit" disabled={!barcode || loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Searching...' : scanButtonLabel || 'Search'}
                </Button>
              )}
              
              {allowCameraScanning && (
                <Button 
                  type="button" 
                  variant={isCameraActive ? "destructive" : "secondary"}
                  onClick={toggleCamera}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {isCameraActive && (
              <CameraScanner videoRef={videoRef} canvasRef={canvasRef} />
            )}
            
            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                {error}
              </div>
            )}
          </form>
        )}
        
        {scanData && !onBarcodeScanned && (
          <ScanDataDisplay scanData={scanData} />
        )}
        
        {loading && (
          <div className="space-y-3 mt-4">
            <Skeleton className="h-[28px] w-full" />
            <Skeleton className="h-[20px] w-3/4" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-[40px]" />
              <Skeleton className="h-[40px]" /> 
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant={isScanning ? "outline" : "default"}
          onClick={toggleScanner}
        >
          {isScanning ? 'Stop Scanning' : 'Start Scanning'}
        </Button>
        
        {scanData && !onBarcodeScanned && (
          <Button variant="secondary" onClick={resetScan}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BarcodeScanner;
