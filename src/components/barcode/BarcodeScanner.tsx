
import React from 'react';
import MobileBarcodeScanner from './MobileBarcodeScanner';

interface BarcodeScannerProps {
  onBarcodeScanned?: (barcode: string) => void;
  onDetected?: (barcode: string) => void;
  onScanComplete?: (data: any) => void;
  allowManualEntry?: boolean;
  allowCameraScanning?: boolean;
  inputValue?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  scanButtonLabel?: string;
  embedded?: boolean; // Add the missing embedded prop
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
  embedded = false, // Default value for embedded
}) => {
  const handleBarcode = (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
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

  return (
    <MobileBarcodeScanner
      onBarcodeScanned={handleBarcode}
      allowManualEntry={allowManualEntry}
      inputValue={inputValue}
      onInputChange={onInputChange}
      scanButtonLabel={scanButtonLabel}
    />
  );
};

export { BarcodeScanner };
export default BarcodeScanner;
