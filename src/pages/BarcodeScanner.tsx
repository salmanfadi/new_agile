
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScannerComponent from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BarcodeScannerPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Barcode Scanner"
        description="Scan barcodes to view product and inventory information"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="max-w-2xl mx-auto">
        <BarcodeScannerComponent 
          allowManualEntry={true}
          allowCameraScanning={true}
        />
      </div>
    </div>
  );
};

export default BarcodeScannerPage;
