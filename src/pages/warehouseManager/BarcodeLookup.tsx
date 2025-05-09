
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Printer } from 'lucide-react';

const ManagerBarcodeLookup: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warehouse Barcode Lookup" 
        description="Scan barcodes to view detailed product and inventory information"
      />
      
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link to="/admin/barcodes">
            <Printer className="mr-2 h-4 w-4" />
            Barcode Management
          </Link>
        </Button>
      </div>
      
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
