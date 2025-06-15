
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { BarcodeDebugComponent } from '@/components/barcode/BarcodeDebugComponent';

const BarcodeDebugPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader 
        title="Barcode Debug" 
        description="Debug barcode data across different tables"
      />
      
      <BarcodeDebugComponent />
    </div>
  );
};

export default BarcodeDebugPage;
