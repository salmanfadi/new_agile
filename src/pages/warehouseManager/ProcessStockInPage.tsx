
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { processStockIn } from '@/utils/stockInProcessor';
import { toast } from '@/hooks/use-toast';
import { useStockInBoxes } from '@/hooks/useStockInBoxes';
import { useStockInData, StockInData as StockInDataType } from '@/hooks/useStockInData';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { StockInDetails } from '@/components/warehouse/StockInDetails';
import { DefaultValuesSection } from '@/components/warehouse/DefaultValuesSection';
import { BoxDetailsSection } from '@/components/warehouse/BoxDetailsSection';
import { ProcessingActions } from '@/components/warehouse/ProcessingActions';
import { LoadingState } from '@/components/warehouse/LoadingState';
import { ErrorState } from '@/components/warehouse/ErrorState';
import { BackButton } from '@/components/warehouse/BackButton';

const ProcessStockInPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { stockInId } = useParams<{ stockInId: string }>();
  const { user } = useAuth();

  // Fetch stock in data
  const { stockInData: originalStockInData, isLoadingStockIn } = useStockInData(stockInId);
  
  // Make sure stockInData conforms to the expected structure for useStockInBoxes
  const stockInData = originalStockInData ? {
    ...originalStockInData,
    // Ensure product is defined if it's not
    product: originalStockInData.product || { name: 'Unknown Product' }
  } : null;

  // Initialize box data with the hook
  const {
    boxesData,
    defaultValues,
    setDefaultValues,
    handleBoxUpdate,
    applyDefaultsToAll,
    isMissingRequiredData
  } = useStockInBoxes(stockInData, true);

  // Fetch warehouse data
  const { warehouses, locations } = useWarehouseData(defaultValues.warehouse);

  // Process stock in mutation
  const processStockInMutation = useMutation({
    mutationFn: async (data: { stockInId: string; boxes: typeof boxesData }) => {
      return processStockIn(data.stockInId, data.boxes, user?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Stock In Processed',
        description: 'The stock in has been processed and added to inventory.',
      });
      // Navigate back to the stock in list
      navigate('/manager/stock-in');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process stock in',
      });
    },
  });

  const handleProcessingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInId || !stockInData) return;

    if (isMissingRequiredData()) {
      toast({
        variant: 'destructive',
        title: 'Incomplete data',
        description: 'Please fill in all required fields for each box.',
      });
      return;
    }

    processStockInMutation.mutate({
      stockInId: stockInId,
      boxes: boxesData,
    });
  };

  const navigateBack = () => navigate('/manager/stock-in');

  if (isLoadingStockIn) {
    return <LoadingState />;
  }

  if (!stockInData) {
    return <ErrorState onNavigateBack={navigateBack} />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Process Stock In" 
        description={`Processing stock for ${stockInData.product?.name || 'Unknown Product'}`} 
      />
      
      <BackButton onClick={navigateBack} className="mb-4" />
      
      <form onSubmit={handleProcessingSubmit}>
        <div className="space-y-6">
          <StockInDetails stockInData={stockInData} />
          
          <DefaultValuesSection 
            defaultValues={defaultValues}
            setDefaultValues={setDefaultValues}
            applyDefaultsToAll={applyDefaultsToAll}
            warehouses={warehouses}
            locations={locations}
          />
          
          <BoxDetailsSection 
            boxesData={boxesData}
            handleBoxUpdate={handleBoxUpdate}
            warehouses={warehouses}
            locations={locations}
          />
          
          <ProcessingActions 
            onCancel={navigateBack} 
            isSubmitting={processStockInMutation.isPending} 
            isDisabled={isMissingRequiredData()} 
          />
        </div>
      </form>
    </div>
  );
};

export default ProcessStockInPage;
