
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBatchDetails } from '@/hooks/useProcessedBatchesWithItems';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { BatchDetailsView } from '@/components/warehouse/BatchDetailsView';
import BatchItemsTable from '@/components/warehouse/BatchItemsTable';
import { Skeleton } from '@/components/ui/skeleton';
import { BatchItem } from '@/types/barcode';

const BatchDetailsPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useBatchDetails(batchId);
  
  const handlePrintBarcodes = () => {
    navigate(`/admin/inventory/barcodes/${batchId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <PageHeader 
          title="Batch Details" 
          description="Loading batch information..." 
        />
        
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error.message}</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Batch Not Found</h2>
          <p className="text-gray-500">The batch with ID {batchId} could not be found.</p>
        </div>
      </div>
    );
  }

  // Transform the data for the batch items table to match BatchItem type
  const batchItems: BatchItem[] = data.items.map(item => ({
    id: item.id,
    barcode: item.barcode,
    batch_id: data.id,
    warehouse_id: '', // These fields are required by the BatchItem type
    location_id: '',
    quantity: item.quantity,
    color: item.color || undefined,
    size: item.size || undefined,
    status: item.status,
    created_at: data.createdAt
  }));

  const batchData = {
    id: data.id,
    stockId: data.stock_in_id || undefined,
    productId: data.product_id || undefined,
    productName: data.product?.name || 'Unknown Product',
    productSku: data.product?.sku || undefined,
    status: data.status,
    totalBoxes: data.totalBoxes,
    totalQuantity: data.totalQuantity,
    processedBy: data.processorName || 'Unknown',
    source: data.source || 'Unknown',
    notes: data.notes || undefined,
    warehouseName: data.warehouseName || 'Unknown',
    locationDetails: data.locationDetails || 'Unknown',
    createdAt: data.createdAt,
    progress: data.progress
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <PageHeader 
        title="Batch Details" 
        description={data.product?.name || 'Unknown Product'} 
      />

      <div className="flex justify-end">
        <Button onClick={handlePrintBarcodes}>
          <Printer className="mr-2 h-4 w-4" /> Print Barcodes
        </Button>
      </div>
      
      <BatchDetailsView batchData={batchData} />
      
      <h2 className="text-xl font-bold mt-8 mb-4">Boxes in this Batch</h2>
      <BatchItemsTable items={batchItems} />
    </div>
  );
};

export default BatchDetailsPage;
