import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { useBatchStockIn } from '@/hooks/useBatchStockIn';
import { BatchForm } from '@/components/warehouse/BatchForm';
import { useStockInData } from '@/hooks/useStockInData';
import { toast } from '@/hooks/use-toast';
import { BackButton } from '@/components/warehouse/BackButton';
import { StockInRequestDetails } from '@/components/warehouse/StockInRequestDetails';
import { BatchList } from '@/components/warehouse/BatchList';
import { BatchStockInLoading } from '@/components/warehouse/BatchStockInLoading';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BatchStockInComponentProps {
  adminMode?: boolean;
  sheetMode?: boolean;
  onClose?: () => void;
}

const BatchStockInComponent: React.FC<BatchStockInComponentProps> = ({ 
  adminMode = false, 
  sheetMode = false,
  onClose
}) => {
  const { stockInId } = useParams<{ stockInId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stockInData, isLoadingStockIn } = useStockInData(stockInId);
  const queryClient = useQueryClient();

  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [remainingBoxes, setRemainingBoxes] = useState<number>(0);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Log stockInData to debug
  useEffect(() => {
    console.log("StockInData loaded:", stockInData);
  }, [stockInData]);
  
  const handleGoBack = () => {
    if (sheetMode && onClose) {
      onClose();
    } else {
      if (adminMode) {
        navigate('/admin/stock-in');
      } else {
        navigate('/manager/stock-in');
      }
    }
  };

  const {
    batches,
    addBatch,
    editBatch,
    deleteBatch,
    editingIndex,
    setEditingIndex,
    submitStockIn,
    isSubmitting,
    isProcessing,
    isSuccess,
    barcodeErrors,
    resetBatches
  } = useBatchStockIn(user?.id || '');

  // Navigate to inventory page after successful submission with improved navigation reliability
  useEffect(() => {
    if (isSuccess && !isProcessing && !isSubmitting) {
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      setShowSuccessModal(true);
      const timer = setTimeout(() => {
        let role = user?.role;
        let path = window.location.pathname;
        console.log('Redirecting after batch submission:', { role, path });
        if (onClose) {
          console.log('Calling onClose() to close panel/sheet');
          onClose();
        }
        if (role === 'admin') {
          console.log('Navigating to /admin/inventory');
          navigate('/admin/inventory');
        } else if (role === 'warehouse_manager') {
          console.log('Navigating to /manager/inventory');
          navigate('/manager/inventory');
        } else if (path.includes('/admin')) {
          console.log('Fallback: Navigating to /admin/inventory');
          navigate('/admin/inventory');
        } else {
          console.log('Fallback: Navigating to /manager/inventory');
          navigate('/manager/inventory');
        }
        resetBatches();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, isProcessing, isSubmitting, user, navigate, onClose, resetBatches, queryClient]);

  const handleNavigateToInventory = () => {
    setShowSuccessModal(false);
    let role = user?.role;
    let path = window.location.pathname;
    console.log('Manual redirect after modal:', { role, path });
    if (onClose) {
      console.log('Calling onClose() to close panel/sheet');
      onClose();
    }
    if (role === 'admin') {
      console.log('Navigating to /admin/inventory');
      navigate('/admin/inventory');
    } else if (role === 'warehouse_manager') {
      console.log('Navigating to /manager/inventory');
      navigate('/manager/inventory');
    } else if (path.includes('/admin')) {
      console.log('Fallback: Navigating to /admin/inventory');
      navigate('/admin/inventory');
    } else {
      console.log('Fallback: Navigating to /manager/inventory');
      navigate('/manager/inventory');
    }
    resetBatches();
  };

  // Populate form with stockInData when it's loaded and initialize remaining boxes
  useEffect(() => {
    if (stockInData) {
      console.log("Setting source and notes from stockInData", stockInData);
      setSource(stockInData.source || '');
      setNotes(stockInData.notes || '');
      
      // Initialize remaining boxes from stock in data
      const totalBoxes = stockInData.boxes || 0;
      const batchBoxesCount = batches.reduce((sum, batch) => sum + batch.boxes_count, 0);
      setRemainingBoxes(totalBoxes - batchBoxesCount);
    }
  }, [stockInData, batches]);

  // Custom batch add function that validates against remaining boxes
  const handleAddBatch = (formData: any) => {
    // Prevent adding new batches when we're submitting
    if (isSubmitting || isProcessing || formSubmitted) {
      return;
    }

    // If editing, we need to account for the current batch's boxes
    const currentEditingBoxes = editingIndex !== null ? batches[editingIndex].boxes_count : 0;
    const effectiveNewBoxes = editingIndex !== null 
      ? formData.boxes_count - currentEditingBoxes 
      : formData.boxes_count;

    // Check if adding this batch would exceed the remaining boxes
    if (effectiveNewBoxes > remainingBoxes && editingIndex === null) {
      toast({
        title: 'Box count exceeds limit',
        description: `You can only add ${remainingBoxes} more boxes. Please adjust the quantity.`,
        variant: 'destructive'
      });
      return;
    }

    // Proceed with adding the batch
    addBatch(formData);
  };

  const handleBatchSubmission = (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event propagation
    
    if (!user) return;
    if (batches.length === 0) {
      toast({
        title: 'No batches added',
        description: 'Please add at least one batch before submitting',
        variant: 'destructive'
      });
      return;
    }

    setFormSubmitted(true);

    // Fixed type handling for productId
    let productId: string;
    
    // First check if stockInData exists and has a product with an id
    if (stockInData?.product && 'id' in stockInData.product && stockInData.product.id) {
      productId = stockInData.product.id;
    } else if (batches.length > 0 && batches[0].product_id) {
      // Fallback to the first batch's product id
      productId = batches[0].product_id;
    } else {
      // Ultimate fallback (shouldn't happen due to the check above, but TypeScript needs this)
      console.error("No product ID found in either stockInData or batches");
      toast({
        title: 'Error',
        description: 'Could not determine product ID for batch submission',
        variant: 'destructive'
      });
      return;
    }
    
    console.log("Submitting with product ID:", productId);
    submitStockIn({
      stockInId: stockInId,
      productId,
      source,
      notes,
      submittedBy: user.id,
      batches
    });
  };

  return (
    <>
      {!sheetMode && (
        <div className="flex items-center gap-2 mb-6">
          <BackButton 
            onClick={handleGoBack} 
            className="hover-lift" 
          />
        </div>
      )}
      
      {!sheetMode && (
        <PageHeader 
          title={stockInId ? "Process Stock In Request" : "Batch Stock In Processing"}
          description={stockInId 
            ? `Process the stock-in request with multiple batches` 
            : "Create and process multiple batches at once"
          }
        />
      )}
      
      {isLoadingStockIn ? (
        <BatchStockInLoading />
      ) : (
        <div className="space-y-6">
          <StockInRequestDetails
            stockInData={stockInData}
            source={source}
            setSource={setSource}
            notes={notes}
            setNotes={setNotes}
            remainingBoxes={remainingBoxes}
            isSubmitting={isSubmitting}
            isProcessing={isProcessing}
            stockInId={stockInId}
          />
          
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {remainingBoxes === 0 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700 text-center">
                  All boxes for this stock-in request have been processed.
                </div>
              ) : (
                <BatchForm 
                  onAddBatch={handleAddBatch} 
                  isSubmitting={isSubmitting || isProcessing || formSubmitted}
                  editingBatch={editingIndex !== null ? batches[editingIndex] : undefined}
                  onCancel={editingIndex !== null ? () => setEditingIndex(null) : undefined}
                  maxBoxes={remainingBoxes + (editingIndex !== null ? batches[editingIndex].boxes_count : 0)}
                  stockInData={stockInData}
                />
              )}
            </div>
            
            <div className="space-y-4">
              <BatchList 
                batches={batches}
                editBatch={editBatch}
                deleteBatch={deleteBatch}
                handleBatchSubmission={handleBatchSubmission}
                isSubmitting={isSubmitting}
                isProcessing={isProcessing}
                formSubmitted={formSubmitted}
                barcodeValidationErrors={barcodeErrors}
              />
            </div>
          </div>
        </div>
      )}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batch Processed!</DialogTitle>
          </DialogHeader>
          <div className="py-2">Your batch has been processed successfully. You will be redirected to Inventory shortly.</div>
          <DialogFooter>
            <Button onClick={handleNavigateToInventory} className="w-full">View Inventory Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchStockInComponent;
