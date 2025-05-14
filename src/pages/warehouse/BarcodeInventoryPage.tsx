
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useBatchItems } from '@/hooks/useProcessedBatches';
import { formatBarcodeForDisplay } from '@/utils/barcodeUtils';
import { useQueryClient } from '@tanstack/react-query';
import { BarcodeGenerator } from '@/components/barcode/BarcodeGenerator';
import { BarcodePrinter } from '@/components/barcode/BarcodePrinter';
import { useIsMobile } from '@/hooks/use-mobile';

const BarcodeInventoryPage: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  const { data: batchItems, isLoading, error } = useBatchItems(batchId || null);
  
  // Force refresh when component mounts
  useEffect(() => {
    if (batchId) {
      queryClient.invalidateQueries({ queryKey: ['batch-items', batchId] });
    }
  }, [batchId, queryClient]);
  
  const handlePrintAll = () => {
    if (!batchItems || batchItems.length === 0) return;
    
    // This would be handled by the BarcodePrinter component
    console.log("Printing all barcodes for batch:", batchId);
  };
  
  const handleBack = () => {
    navigate('/manager/inventory/batches');
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Batch Barcodes" 
        description="View and print barcodes for inventory batch items"
      />
      
      <div className="flex justify-between items-center flex-wrap gap-2">
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
            onClick={handlePrintAll}
            className="flex items-center gap-1"
            disabled={!batchItems || batchItems.length === 0}
          >
            <Printer className="h-4 w-4" />
            Print All
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            disabled={!batchItems || batchItems.length === 0}
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>
      
      <div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-500">
            Error loading batch items. Please try again.
          </div>
        ) : !batchItems || batchItems.length === 0 ? (
          <Card>
            <CardContent className="flex justify-center p-6 text-gray-500">
              No barcode items found for this batch
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batchItems.map((item: any) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col items-center">
                  <div className="w-full mb-2">
                    <BarcodeGenerator
                      barcodeData={item.barcode}
                      displayText={formatBarcodeForDisplay(item.barcode, 24)}
                      width={isMobile ? 250 : 300}
                      height={100}
                    />
                  </div>
                  
                  <div className="w-full grid grid-cols-2 gap-2 text-sm mt-2">
                    <div>
                      <p className="text-xs text-gray-500">Quantity</p>
                      <p className="font-medium">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium">
                        {item.warehouses?.name || 'Unknown'}, 
                        Floor {item.locations?.floor}, 
                        Zone {item.locations?.zone}
                      </p>
                    </div>
                    {item.color && (
                      <div>
                        <p className="text-xs text-gray-500">Color</p>
                        <p className="font-medium">{item.color}</p>
                      </div>
                    )}
                    {item.size && (
                      <div>
                        <p className="text-xs text-gray-500">Size</p>
                        <p className="font-medium">{item.size}</p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      // Individual barcode printing will be handled here
                      console.log("Printing barcode:", item.barcode);
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Barcode
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Hidden print component that will be used for printing */}
      <div className="hidden">
        <BarcodePrinter barcodes={batchItems?.map((item: any) => ({
          barcode: item.barcode,
          text: `Qty: ${item.quantity}${item.color ? `, Color: ${item.color}` : ''}${item.size ? `, Size: ${item.size}` : ''}`,
          location: `${item.warehouses?.name || 'Unknown'}, Floor ${item.locations?.floor}, Zone ${item.locations?.zone}`
        }))} />
      </div>
    </div>
  );
};

export default BarcodeInventoryPage;
