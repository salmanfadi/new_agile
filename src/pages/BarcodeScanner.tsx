
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';

const BarcodeScannerPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Scanner" 
        description="Test the barcode scanning functionality"
      />
      
      <div className="max-w-3xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
          <h3 className="font-medium text-yellow-800 mb-2">Testing Information</h3>
          <p className="text-sm text-yellow-700">
            Try scanning with a hardware barcode scanner or manually enter one of these test barcodes:
          </p>
          <ul className="list-disc ml-5 mt-2 text-sm text-yellow-700 space-y-1">
            <li><code className="bg-yellow-100 px-1.5 py-0.5 rounded">BC123456789</code> - Available test product</li>
            <li><code className="bg-yellow-100 px-1.5 py-0.5 rounded">BC987654321</code> - Reserved test product</li>
          </ul>
        </div>
        
        <BarcodeScanner 
          allowManualEntry={true}
          allowCameraScanning={true}
        />
      </div>
    </div>
  );
};

export default BarcodeScannerPage;
