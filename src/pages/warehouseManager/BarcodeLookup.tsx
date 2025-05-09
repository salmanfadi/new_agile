
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/BarcodeScanner';

const ManagerBarcodeLookup: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warehouse Barcode Lookup" 
        description="Scan barcodes to view detailed product and inventory information"
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

export default ManagerBarcodeLookup;
