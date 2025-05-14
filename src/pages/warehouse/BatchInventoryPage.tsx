
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ProcessedBatchesTable } from '@/components/warehouse/ProcessedBatchesTable';
import { BatchDetailsDialog } from '@/components/warehouse/BatchDetailsDialog';
import { useProcessedBatches } from '@/hooks/useProcessedBatches';

const BatchInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showBatchDetails, setShowBatchDetails] = useState<boolean>(false);

  const { isLoading, error } = useProcessedBatches();

  const handleRefresh = () => {
    toast({
      title: 'Refreshing data',
      description: 'Getting the latest processed batches...'
    });
    queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
  };

  const handleViewDetails = (batchId: string) => {
    setSelectedBatchId(batchId);
    setShowBatchDetails(true);
  };

  const handlePrintBarcodes = (batchId: string) => {
    navigate(`/manager/inventory/barcodes/${batchId}`);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Batch Inventory Management" 
        description="View all processed batches and their inventory items"
      />
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manager/inventory')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Inventory
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Processed Batches</CardTitle>
          <CardDescription>View and manage all processed inventory batches</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-red-500">
              Error loading batch data. Please try again.
            </div>
          ) : (
            <ProcessedBatchesTable 
              filters={{}}
              onViewDetails={handleViewDetails}
              onPrintBarcodes={handlePrintBarcodes}
            />
          )}
        </CardContent>
      </Card>
      
      <BatchDetailsDialog
        open={showBatchDetails}
        onOpenChange={setShowBatchDetails}
        batchId={selectedBatchId}
        onPrintBarcodes={() => selectedBatchId && handlePrintBarcodes(selectedBatchId)}
      />
    </div>
  );
};

export default BatchInventoryPage;
