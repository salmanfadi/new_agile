
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner, { ScanResponse } from '@/components/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const BarcodeLookup: React.FC = () => {
  const navigate = useNavigate();
  
  const handleScanComplete = (data: ScanResponse['data']) => {
    toast({
      title: 'Item Found',
      description: `${data.product.name} - ${data.box_quantity} units available`,
    });
    
    // Additional handling if needed
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Barcode Lookup"
        description="Scan or enter a barcode to view product information"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/operator')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="max-w-2xl mx-auto">
        <BarcodeScanner
          onScanComplete={handleScanComplete}
          allowManualEntry={true}
          allowCameraScanning={true}
        />
      </div>
    </div>
  );
};

export default BarcodeLookup;
