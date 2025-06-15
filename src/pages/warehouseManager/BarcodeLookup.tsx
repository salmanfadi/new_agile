
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Printer, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBarcodeProcessor } from '@/components/barcode/useBarcodeProcessor';
import { ScanResponse } from '@/types/auth';
import ScanDataDisplay from '@/components/barcode/ScanDataDisplay';

const ManagerBarcodeLookup: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lastScan, setLastScan] = useState<ScanResponse['data'] | null>(null);
  
  const { processScan, loading, error, scanData } = useBarcodeProcessor({
    user,
    toast,
    onScanComplete: (data) => {
      setLastScan(data);
      console.log('Scan completed:', data);
    }
  });
  
  const handleBarcodeDetected = (barcode: string) => {
    console.log('Barcode detected:', barcode);
    processScan(barcode);
  };

  const goBackToDashboard = () => {
    navigate('/manager');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={goBackToDashboard}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <PageHeader 
          title="Warehouse Barcode Lookup" 
          description="Scan barcodes to view detailed product and inventory information"
        />
        
        <Button asChild>
          <Link to="/manager/barcodes">
            <Printer className="mr-2 h-4 w-4" />
            Barcode Management
          </Link>
        </Button>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <Card className="mb-6 border-blue-100 bg-blue-50">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Scanning Instructions
            </h3>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Enter the barcode manually or use a hardware scanner</li>
              <li>Click the camera icon to scan using your device's camera</li>
              <li>Inventory information will display once a valid barcode is scanned</li>
            </ul>
          </CardContent>
        </Card>
        
        <BarcodeScanner 
          allowManualEntry={true}
          allowCameraScanning={true}
          onDetected={handleBarcodeDetected}
        />
        
        {(lastScan || scanData) && (
          <div className="mt-6">
            <ScanDataDisplay scanData={lastScan || scanData} />
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 border border-red-200 bg-red-50 rounded-md">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}
        
        {loading && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-md">
            <p className="text-blue-700 font-medium">Scanning...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerBarcodeLookup;
