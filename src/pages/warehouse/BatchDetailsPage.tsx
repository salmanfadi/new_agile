
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProcessedBatchDetails } from '@/hooks/useProcessedBatches';
import { useBatchItems } from '@/hooks/useBatchItems';
import { BatchDetailsView } from '@/components/warehouse/BatchDetailsView';
import { Skeleton } from '@/components/ui/skeleton';
import { ProcessedBatchWithItems } from '@/hooks/useProcessedBatchesWithItems';

const BatchDetailsPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: batchDetails, isLoading: batchLoading, error: batchError, refetch: refetchBatch } = 
    useProcessedBatchDetails(batchId || null);
    
  const { data: batchItems, isLoading: itemsLoading, error: itemsError, refetch: refetchItems } = 
    useBatchItems(batchId);
    
  const isLoadingData = batchLoading || itemsLoading || isLoading;
  const error = batchError || itemsError;
  
  // Construct a more detailed batch object from the raw data
  const processedBatch: ProcessedBatchWithItems | null = batchDetails ? {
    id: batchDetails.id,
    stock_in_id: batchDetails.stock_in_id || null,
    product_id: batchDetails.product.id || '',
    processedBy: batchDetails.processed_by || '',
    processorName: batchDetails.processed_by || null,
    totalBoxes: batchDetails.total_boxes || 0,
    totalQuantity: batchDetails.total_quantity || 0,
    status: 'completed',
    source: batchDetails.source || null,
    notes: batchDetails.notes || null,
    createdAt: batchDetails.processed_at || new Date().toISOString(),
    warehouseId: null,
    warehouseName: batchDetails.warehouse_name || null,
    productName: batchDetails.product?.name || null,
    productSku: batchDetails.product?.sku || null,
    items: batchItems || [],
    progress: {
      completed: batchItems?.length || 0,
      total: batchDetails.total_boxes || 0,
      percentage: batchDetails.total_boxes ? 
        Math.round((batchItems?.length || 0) / batchDetails.total_boxes * 100) : 0
    }
  } : null;
  
  const handleRefresh = () => {
    setIsLoading(true);
    Promise.all([refetchBatch(), refetchItems()]).then(() => {
      toast({
        title: 'Data refreshed',
        description: 'The latest batch information has been loaded'
      });
      setIsLoading(false);
    }).catch(error => {
      toast({
        title: 'Refresh failed',
        description: error.message,
        variant: 'destructive'
      });
      setIsLoading(false);
    });
  };
  
  const handlePrint = () => {
    if (!processedBatch) return;
    
    // Open a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Print failed',
        description: 'Could not open print window. Please check your popup settings.',
        variant: 'destructive'
      });
      return;
    }
    
    // Create the print content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch ${processedBatch.id.substring(0, 8)} Barcodes</title>
        <style>
          body {
            font-family: sans-serif;
            padding: 20px;
          }
          .barcode-container {
            display: inline-block;
            width: 45%;
            margin: 2%;
            text-align: center;
            padding: 10px;
            border: 1px solid #ccc;
            page-break-inside: avoid;
          }
          .barcode-container p {
            margin: 5px 0;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .no-print {
            margin-bottom: 20px;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button onclick="window.print()">Print All Barcodes</button>
          <button onclick="window.close()">Close</button>
        </div>
        
        <div class="header">
          <h1>Batch ${processedBatch.id.substring(0, 8)} Barcodes</h1>
          <p>Product: ${processedBatch.productName} ${processedBatch.productSku ? `(${processedBatch.productSku})` : ''}</p>
          <p>Total Boxes: ${processedBatch.totalBoxes}</p>
        </div>
    `);
    
    // Add each barcode
    processedBatch.items.forEach((item, index) => {
      printWindow.document.write(`
        <div class="barcode-container">
          <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(item.barcode)}&scale=3&includetext&textsize=13" />
          <p style="font-family: monospace;">${item.barcode}</p>
          <p>Box ${index + 1} of ${processedBatch.items.length}</p>
          <p>Quantity: ${item.quantity}</p>
        </div>
      `);
    });
    
    printWindow.document.write(`
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Wait for resources to load then print
    printWindow.onload = function() {
      printWindow.focus();
      // No automatic print to let user review first
    };
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoadingData}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingData ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <PageHeader 
        title={`Batch ${batchId ? batchId.substring(0, 8).toUpperCase() : ''}`}
        description={processedBatch?.productName || 'Loading batch details...'}
      />
      
      {isLoadingData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="text-lg font-semibold mb-2">Error Loading Batch</h3>
          <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      ) : !processedBatch ? (
        <div className="text-center py-10 border rounded-md bg-background">
          <h3 className="text-xl font-semibold mb-2">Batch Not Found</h3>
          <p className="text-muted-foreground">
            The batch with ID <code>{batchId}</code> could not be found.
          </p>
          <Button
            onClick={() => navigate(-1)}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      ) : (
        <BatchDetailsView 
          id={processedBatch.id}
          productName={processedBatch.productName || 'Unknown Product'}
          productSku={processedBatch.productSku}
          processorName={processedBatch.processorName || undefined}
          totalBoxes={processedBatch.totalBoxes}
          totalQuantity={processedBatch.totalQuantity}
          warehouseName={processedBatch.warehouseName || undefined}
          status={processedBatch.status}
          source={processedBatch.source || undefined}
          notes={processedBatch.notes || undefined}
          createdAt={processedBatch.createdAt}
          items={processedBatch.items}
          progress={processedBatch.progress}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
};

export default BatchDetailsPage;
