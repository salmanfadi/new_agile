
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Printer } from 'lucide-react';
import { format } from 'date-fns';
import BatchItemsTable from '@/components/warehouse/BatchItemsTable';
import { useBatchItems } from '@/hooks/useBatchItems';
import { toast } from '@/hooks/use-toast';

interface BatchDetails {
  id: string;
  stock_in_id: string;
  product_id: string;
  productName?: string;
  productSku?: string;
  processed_by: string;
  processorName?: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  warehouseName?: string;
  status: string;
  notes?: string;
  source?: string;
  processed_at: string;
}

const BatchDetailsPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();

  // Fetch batch details
  const { data: batchDetails, isLoading: isLoadingBatch, error: batchError } = useQuery({
    queryKey: ['batch-details', batchId],
    queryFn: async (): Promise<BatchDetails | null> => {
      if (!batchId) return null;

      const { data, error } = await supabase
        .from('processed_batches')
        .select(`
          *,
          products (
            id,
            name,
            sku
          ),
          profiles:processed_by (
            id,
            name
          ),
          warehouses (
            id,
            name
          )
        `)
        .eq('id', batchId)
        .single();

      if (error) {
        console.error('Error fetching batch details:', error);
        throw new Error(error.message);
      }

      if (!data) return null;

      // Default values
      let productName = 'Unknown Product';
      let productSku: string | undefined = undefined;
      let processorName = 'Unknown User';
      let warehouseName = 'Unknown Warehouse';

      // Handle products data with proper type checking
      if (data.products && typeof data.products === 'object') {
        if (data.products !== null) {
          productName = typeof data.products.name === 'string' ? data.products.name : 'Unknown Product';
          productSku = typeof data.products.sku === 'string' ? data.products.sku : undefined;
        }
      }
      
      // Handle profiles data with proper type checking and null safety - additional null check for TS
      if (data.profiles && typeof data.profiles === 'object' && data.profiles !== null) {
        // Safely access the name property now that we've confirmed it's not null
        processorName = data.profiles.name ? data.profiles.name.toString() : 'Unknown User';
      }
      
      // Handle warehouses data with proper type checking
      if (data.warehouses && typeof data.warehouses === 'object') {
        if (data.warehouses !== null) {
          warehouseName = typeof data.warehouses.name === 'string' ? data.warehouses.name : 'Unknown Warehouse';
        }
      }

      return {
        id: data.id,
        stock_in_id: data.stock_in_id,
        product_id: data.product_id,
        productName: productName,
        productSku: productSku,
        processed_by: data.processed_by,
        processorName: processorName,
        total_quantity: data.total_quantity || 0,
        total_boxes: data.total_boxes || 0,
        warehouse_id: data.warehouse_id,
        warehouseName: warehouseName,
        status: data.status || 'completed',
        notes: data.notes,
        source: data.source,
        processed_at: data.processed_at || new Date().toISOString()
      };
    },
    enabled: !!batchId
  });

  // Fetch batch items
  const { 
    data: batchItems, 
    isLoading: isLoadingItems, 
    error: itemsError 
  } = useBatchItems(batchId);

  const handlePrintBarcode = (barcode: string) => {
    toast({
      title: 'Print Barcode',
      description: `Printing barcode: ${barcode}`,
    });
    // Navigate to barcode printing page
    navigate(`/manager/inventory/barcode/${barcode}`);
  };

  const handleViewDetails = (itemId: string) => {
    toast({
      title: 'View Details',
      description: `Viewing details for item: ${itemId}`,
    });
    // Navigate to item details page
    navigate(`/manager/inventory/item/${itemId}`);
  };

  if (!batchId) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>Batch ID is missing</CardDescription>
          </CardHeader>
          <CardContent>
            <p>No batch ID was provided. Please select a valid batch.</p>
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={() => navigate('/manager/inventory')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/manager/inventory')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Inventory
      </Button>
      
      <PageHeader 
        title="Batch Details" 
        description="View details and items for this batch"
      />

      {/* Batch Details Card */}
      {isLoadingBatch ? (
        <Card>
          <CardContent className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : batchError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load batch details: {batchError instanceof Error ? batchError.message : 'Unknown error'}</p>
          </CardContent>
        </Card>
      ) : batchDetails ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Batch: {batchId.slice(0, 8)}
              <Badge className="ml-2 bg-blue-500">{batchDetails.status}</Badge>
            </CardTitle>
            <CardDescription>
              Processed on {format(new Date(batchDetails.processed_at), 'MMMM d, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
                <p className="text-base font-semibold">{batchDetails.productName}</p>
                {batchDetails.productSku && <p className="text-sm text-gray-500">SKU: {batchDetails.productSku}</p>}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                <p className="text-base font-semibold">{batchDetails.total_quantity} items</p>
                <p className="text-sm text-gray-500">{batchDetails.total_boxes} boxes</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Warehouse</h3>
                <p className="text-base font-semibold">{batchDetails.warehouseName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Processed By</h3>
                <p className="text-base font-semibold">{batchDetails.processorName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
                <p className="text-base font-semibold">{batchDetails.source || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Stock In ID</h3>
                <p className="text-base font-semibold">{batchDetails.stock_in_id}</p>
              </div>
              
              {batchDetails.notes && (
                <div className="col-span-full">
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="text-base">{batchDetails.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>No batch details found.</p>
          </CardContent>
        </Card>
      )}

      {/* Batch Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Items</CardTitle>
          <CardDescription>Individual items in this batch</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchItemsTable
            items={batchItems || []}
            isLoading={isLoadingItems}
            error={itemsError as Error}
            onPrintBarcode={handlePrintBarcode}
            onViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>
      
      {/* Print All Barcodes Button */}
      {batchItems && batchItems.length > 0 && (
        <div className="flex justify-end">
          <Button 
            variant="outline"
            onClick={() => navigate(`/manager/inventory/barcodes/${batchId}`)}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print All Barcodes
          </Button>
        </div>
      )}
    </div>
  );
};

export default BatchDetailsPage;
