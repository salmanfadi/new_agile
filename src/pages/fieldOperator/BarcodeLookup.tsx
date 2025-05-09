
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/BarcodeScanner';

const BarcodeLookup: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Lookup" 
        description="Scan barcodes to view product information"
      />
      
      <div className="max-w-3xl mx-auto">
        <BarcodeScanner 
          allowManualEntry={true}
          allowCameraScanning={true}
        />
      </div>
    </div>
  );
};

export default BarcodeLookup;
