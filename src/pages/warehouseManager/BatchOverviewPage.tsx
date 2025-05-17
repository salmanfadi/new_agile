
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Package, Printer, Download, Filter } from 'lucide-react';
import { useStockInBatches } from '@/hooks/useStockInBatches';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { useStockInData } from '@/hooks/useStockInData';
import { LoadingState } from '@/components/warehouse/LoadingState';
import { ErrorState } from '@/components/warehouse/ErrorState';
import { Badge } from '@/components/ui/badge';

const BatchOverviewPage: React.FC = () => {
  const { stockInId } = useParams<{ stockInId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = location;
  
  const [focusedBatchId, setFocusedBatchId] = useState<string | null>(
    state?.batchId || null
  );
  
  const { data: batches, isLoading, error, isError } = useStockInBatches(stockInId);
  const { stockInData, isLoadingStockIn, error: stockInError } = useStockInData(stockInId);
  
  useEffect(() => {
    // If a batch ID was passed in location state, highlight it
    if (state?.batchId) {
      setFocusedBatchId(state.batchId);
      
      // Clear the state after a delay
      const timer = setTimeout(() => {
        setFocusedBatchId(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [state]);
  
  const handleEditBatch = (batchId: string) => {
    // Navigate to edit batch page
    console.log('Edit batch:', batchId);
    // This would typically navigate to an edit page or open a modal
  };
  
  const handleDeleteBatch = (batchId: string) => {
    // Delete batch with confirmation
    console.log('Delete batch:', batchId);
    // This would typically open a confirmation dialog
  };
  
  const handleViewBarcodes = (batchId: string) => {
    navigate(`/manager/inventory/barcodes/${batchId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={() => navigate('/manager/stock-in')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Stock In
        </Button>
        
        {stockInData && (
          <Badge 
            className={`text-xs px-2 py-1 ${
              stockInData.status === 'completed' ? 'bg-green-100 text-green-800' :
              stockInData.status === 'processing' ? 'bg-amber-100 text-amber-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {stockInData.status.charAt(0).toUpperCase() + stockInData.status.slice(1)}
          </Badge>
        )}
      </div>
      
      <PageHeader 
        title="Batch Overview" 
        description={stockInData ? `Processed batches for ${stockInData.product?.name}` : 'Loading...'} 
      />
      
      {isLoadingStockIn || isLoading ? (
        <LoadingState message="Loading batch data..." />
      ) : isError || stockInError ? (
        <ErrorState 
          message={`Error loading batch data`}
          details={error?.message || stockInError?.message || "Unknown error"} 
          onNavigateBack={() => navigate('/manager/stock-in')}
        />
      ) : (
        <div className="space-y-6">
          {/* Stock In Request Summary */}
          {stockInData && (
            <Card>
              <CardHeader>
                <CardTitle>Stock In Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Product</p>
                    <p>{stockInData.product?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Boxes</p>
                    <p>{stockInData.boxes}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Submitted By</p>
                    <p>{stockInData.submitter?.name || stockInData.submitter?.username}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Source</p>
                    <p>{stockInData.source}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
                    <p>{new Date(stockInData.created_at).toLocaleDateString()}</p>
                  </div>
                  {stockInData.notes && (
                    <div className="space-y-2 col-span-1 md:col-span-3">
                      <p className="text-sm font-medium text-muted-foreground">Notes</p>
                      <p className="text-sm">{stockInData.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Batches */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Processed Batches</CardTitle>
                <CardDescription>
                  {batches && `${batches.length} ${batches.length === 1 ? 'batch' : 'batches'} processed`}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {batches && batches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {batches.map((batch, index) => (
                    <div 
                      key={batch.id}
                      className={
                        focusedBatchId === batch.id 
                          ? "animate-pulse ring-2 ring-blue-500 rounded-lg" 
                          : ""
                      }
                    >
                      <BatchCard 
                        batch={batch}
                        index={index}
                        onEdit={() => handleEditBatch(batch.id!)}
                        onDelete={() => handleDeleteBatch(batch.id!)}
                        showBarcodes={false}
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex gap-1"
                          onClick={() => handleViewBarcodes(batch.id!)}
                        >
                          <Package className="h-4 w-4" /> View Barcodes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-lg font-medium">No batches found</p>
                  <p className="text-sm mt-1">
                    {stockInData?.status === 'pending' 
                      ? "This stock-in request has not been processed yet."
                      : "No batches have been created for this stock-in request."
                    }
                  </p>
                  {stockInData?.status === 'pending' && (
                    <Button
                      className="mt-4"
                      onClick={() => navigate(`/manager/stock-in/batch/${stockInId}`)}
                    >
                      Process Stock In
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BatchOverviewPage;
