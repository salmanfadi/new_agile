
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProcessedBatchDetails } from '@/hooks/useProcessedBatches';
import { useToast } from '@/components/ui/use-toast';
import { Printer, ArrowLeft, Tag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import BarcodeInventoryTable from '@/components/barcode/BarcodeInventoryTable';
import { BarcodePrinter } from '@/components/barcode/BarcodePrinter';

const BarcodeInventoryPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [printerOpen, setPrinterOpen] = useState(false);
  const [selectedBarcodes, setSelectedBarcodes] = useState<string[]>([]);
  
  const { 
    data: batchDetails,
    isLoading,
    error 
  } = useProcessedBatchDetails(batchId || '');
  
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load batch details',
        variant: 'destructive'
      });
    }
  }, [error, toast]);
  
  const handlePrintSelected = () => {
    if (selectedBarcodes.length === 0) {
      toast({
        title: 'No barcodes selected',
        description: 'Please select at least one barcode to print',
        variant: 'destructive'
      });
      return;
    }
    
    setPrinterOpen(true);
  };
  
  const handlePrintAll = () => {
    if (!batchDetails?.items || batchDetails.items.length === 0) {
      toast({
        title: 'No barcodes available',
        description: 'This batch has no barcodes to print',
        variant: 'destructive'
      });
      return;
    }
    
    const allBarcodes = batchDetails.items.map(item => item.barcode);
    setSelectedBarcodes(allBarcodes);
    setPrinterOpen(true);
  };
  
  const handleBackToBatches = () => {
    navigate('/manager/inventory/batches');
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title={<Skeleton className="h-8 w-48" />} 
          description={<Skeleton className="h-4 w-72" />} 
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array(5).fill(null).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!batchDetails) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Batch Not Found" 
          description="The requested batch could not be found"
          actions={
            <Button onClick={handleBackToBatches} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Button>
          }
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={`Barcodes for ${batchDetails.product.name || 'Batch'}`}
        description={`Batch ID: ${batchId} • Generated on ${new Date(batchDetails.processed_at).toLocaleDateString()}`}
        actions={
          <div className="flex space-x-2">
            <Button onClick={handleBackToBatches} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Button>
            <Button onClick={handlePrintAll} variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print All
            </Button>
            <Button onClick={handlePrintSelected} disabled={selectedBarcodes.length === 0}>
              <Tag className="h-4 w-4 mr-2" />
              Print Selected ({selectedBarcodes.length})
            </Button>
          </div>
        }
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Barcode Inventory</CardTitle>
          <CardDescription>
            View and manage barcodes for this batch. Select barcodes to print or view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BarcodeInventoryTable 
            batchItems={batchDetails.items || []}
            onSelectionChange={setSelectedBarcodes}
          />
        </CardContent>
      </Card>
      
      {printerOpen && (
        <BarcodePrinter 
          open={printerOpen}
          onOpenChange={setPrinterOpen}
          barcodes={selectedBarcodes} 
          batchItems={batchDetails.items || []}
        />
      )}
    </div>
  );
};

export default BarcodeInventoryPage;
