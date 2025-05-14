
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import BarcodeGenerator from '@/components/barcode/BarcodeGenerator';
import BarcodePrinter from '@/components/barcode/BarcodePrinter';
import { useBatchItems } from '@/hooks/useProcessedBatches';
import BarcodeInventoryTable from '@/components/barcode/BarcodeInventoryTable';

const AdminBarcodeInventoryPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
  
  const { data: batchItems, isLoading, error } = useBatchItems(batchId || null);
  
  const handleBack = () => {
    navigate('/admin/inventory/batches');
  };
  
  const handleSelectBarcode = (barcode: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedBarcodes(prev => [...prev, barcode]);
    } else {
      setSelectedBarcodes(prev => prev.filter(code => code !== barcode));
    }
  };
  
  const handlePrintSelected = () => {
    if (selectedBarcodes.length > 0) {
      setShowPrintDialog(true);
    }
  };
  
  const handlePrintAll = () => {
    if (batchItems && batchItems.length > 0) {
      setSelectedBarcodes(batchItems.map(item => item.barcode));
      setShowPrintDialog(true);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Barcode Management" 
        description="Print and manage barcodes for the selected batch"
      />
      
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Batches
        </Button>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePrintSelected}
            disabled={selectedBarcodes.length === 0}
          >
            Print Selected ({selectedBarcodes.length})
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handlePrintAll}
            disabled={!batchItems || batchItems.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print All Barcodes
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Batch Barcodes</CardTitle>
          <CardDescription>Manage and print barcodes for this batch</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-red-500">
              Error loading barcode data. Please try again.
            </div>
          ) : (
            <BarcodeInventoryTable 
              batchItems={batchItems || []}
              isLoading={isLoading}
              selectedBarcodes={selectedBarcodes}
              onSelectBarcode={handleSelectBarcode}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Barcode Printer Dialog */}
      {showPrintDialog && (
        <BarcodePrinter 
          open={showPrintDialog}
          onOpenChange={setShowPrintDialog}
          barcodes={selectedBarcodes}
          batchItems={batchItems?.filter(item => 
            selectedBarcodes.includes(item.barcode)
          ) || []}
        />
      )}
    </div>
  );
};

export default AdminBarcodeInventoryPage;
