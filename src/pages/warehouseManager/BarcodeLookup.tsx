
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
      description: `${data.product.name} - ${data.box_quantity} units in box, ${data.total_product_quantity} total units`,
    });
    
    // Additional handling if needed for warehouse manager
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Barcode Lookup"
        description="Scan or enter a barcode to view detailed inventory information"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
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
