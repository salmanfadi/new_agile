
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import { Card, CardContent } from '@/components/ui/card';
import { ScanResponse } from '@/types/auth';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BarcodeLookup: React.FC = () => {
  const [lastScan, setLastScan] = useState<ScanResponse['data'] | null>(null);
  const navigate = useNavigate();

  const handleScanComplete = (data: ScanResponse['data']) => {
    setLastScan(data);
    console.log('Scan completed:', data);
  };

  // For demonstration, navigate to inventory with the barcode as a search parameter
  const viewInInventory = () => {
    if (lastScan) {
      navigate(`/operator/submissions?search=${lastScan.barcode || lastScan.box_id}`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Barcode Lookup" 
        description="Scan barcodes to view product information"
      />
      
      <div className="max-w-3xl mx-auto">
        {/* Barcode scanning tips */}
        <Card className="mb-6 border-blue-100 bg-blue-50">
          <CardContent className="pt-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Quick Tips
            </h3>
            <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
              <li>Enter barcodes manually or use a hardware scanner</li>
              <li>Try sample codes: <code className="bg-white px-1 py-0.5 rounded text-xs">BC123456789</code> (available) or <code className="bg-white px-1 py-0.5 rounded text-xs">BC987654321</code> (reserved)</li>
              <li>Click the camera icon to scan barcodes with your device camera</li>
              <li>After scanning, you can view related inventory or clear for a new scan</li>
            </ul>
          </CardContent>
        </Card>
        
        <BarcodeScanner 
          allowManualEntry={true}
          allowCameraScanning={true}
          onScanComplete={handleScanComplete}
        />
        
        {lastScan && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={viewInInventory} className="text-sm">
              View in Inventory
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarcodeLookup;
