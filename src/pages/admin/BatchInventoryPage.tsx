
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
import { BatchDetailView } from '@/components/warehouse/BatchDetailView';
import { useProcessedBatches } from '@/hooks/useProcessedBatches';

const AdminBatchInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [showBatchDetails, setShowBatchDetails] = useState<boolean>(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // No need to pass data to the table component as it fetches its own data
  const { isLoading, error } = useProcessedBatches(page, pageSize);

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
    navigate(`/admin/inventory/barcodes/${batchId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Batch Inventory Management" 
        description="Comprehensive view of all processed batches across warehouses"
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/inventory')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
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
          <CardDescription>View and manage all processed inventory batches across warehouses</CardDescription>
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
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
      
      <BatchDetailView
        open={showBatchDetails}
        onOpenChange={setShowBatchDetails}
        batchId={selectedBatchId}
        onPrintBarcodes={() => selectedBatchId && handlePrintBarcodes(selectedBatchId)}
      />
    </div>
  );
};

export default AdminBatchInventoryPage;
