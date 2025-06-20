
import React, { useEffect, useState } from 'react';
import MobileBarcodeScanner from './MobileBarcodeScanner';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface BarcodeScannerProps {
  onBarcodeScanned?: (barcode: string) => void;
  onDetected?: (barcode: string) => void;
  onScanComplete?: (data: any) => void;
  allowManualEntry?: boolean;
  allowCameraScanning?: boolean;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scanButtonLabel?: string;
  embedded?: boolean;
  preferredCamera?: 'environment' | 'user'; // Allow selecting front or back camera
  barcodeFormats?: string[]; // Allow specifying which barcode formats to detect
  showDebugInfo?: boolean; // Show technical debug info
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeScanned,
  onDetected,
  onScanComplete,
  allowManualEntry = true,
  allowCameraScanning = true,
  inputValue,
  onInputChange,
  scanButtonLabel = 'Scan',
  embedded = false,
  preferredCamera = 'environment',
  barcodeFormats = ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_39'],
  showDebugInfo = false,
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Check for camera permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        if (!navigator.permissions || !navigator.permissions.query) {
          console.log('Permissions API not available');
          return;
        }
        
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setHasCameraPermission(result.state === 'granted');
        
        result.addEventListener('change', () => {
          setHasCameraPermission(result.state === 'granted');
        });
      } catch (err) {
        console.log('Error checking camera permission:', err);
      }
    };
    
    if (allowCameraScanning) {
      checkPermissions();
    }
  }, [allowCameraScanning]);

  const handleBarcode = (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    // Play a success sound if available
    try {
      const audio = new Audio('/sounds/beep.mp3');
      audio.play().catch(e => console.log('Could not play sound:', e));
    } catch (e) {
      console.log('Sound not supported');
    }
    
    // Show success toast
    toast({
      title: "Barcode Detected",
      description: `${barcode}`,
      variant: "default"
    });
    
    // Call all provided handlers
    if (onBarcodeScanned) onBarcodeScanned(barcode);
    if (onDetected) onDetected(barcode);
    if (onScanComplete) {
      // Create mock scan data for compatibility
      const mockData = {
        box_id: barcode,
        product: { name: 'Scanned Product', sku: barcode },
        status: 'available',
        location: { warehouse: 'Main', zone: 'A1' },
        box_quantity: 1,
        attributes: {}
      };
      onScanComplete(mockData);
    }
  };
  
  const requestCameraPermission = async () => {
    if (permissionRequested) return;
    
    setPermissionRequested(true);
    
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasCameraPermission(true);
      toast({
        title: "Camera Access Granted",
        description: "You can now scan barcodes",
      });
    } catch (err) {
      console.error('Camera permission denied:', err);
      setHasCameraPermission(false);
      toast({
        title: "Camera Access Denied",
        description: "Please enable camera access in your browser settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="barcode-scanner-container">
      {hasCameraPermission === false && allowCameraScanning && (
        <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700 mb-2">Camera access is required for barcode scanning</p>
          <Button 
            onClick={requestCameraPermission} 
            variant="outline" 
            size="sm"
          >
            Request Camera Permission
          </Button>
        </div>
      )}
      
      <MobileBarcodeScanner
        onBarcodeScanned={handleBarcode}
        allowManualEntry={allowManualEntry}
        inputValue={inputValue}
        onInputChange={onInputChange}
        scanButtonLabel={scanButtonLabel}
      />
      
      {showDebugInfo && (
        <div className="mt-4 p-2 bg-slate-50 rounded text-xs text-slate-500">
          <p>Camera Permission: {hasCameraPermission === null ? 'Unknown' : hasCameraPermission ? 'Granted' : 'Denied'}</p>
          <p>Preferred Camera: {preferredCamera}</p>
          <p>Barcode Formats: {barcodeFormats.join(', ')}</p>
          <p>BarcodeDetector API: {'BarcodeDetector' in window ? 'Available' : 'Not Available'}</p>
        </div>
      )}
    </div>
  );
};

export { BarcodeScanner };
export default BarcodeScanner;

// Helper type for barcode formats
export type BarcodeFormat = 
  | 'aztec' 
  | 'code_128' 
  | 'code_39' 
  | 'code_93' 
  | 'codabar' 
  | 'data_matrix' 
  | 'ean_13' 
  | 'ean_8' 
  | 'itf' 
  | 'pdf417' 
  | 'qr_code' 
  | 'upc_a' 
  | 'upc_e';

