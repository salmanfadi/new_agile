
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Boxes, AlertTriangle, ArrowLeft, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBatchStockIn } from '@/hooks/useBatchStockIn';
import { BatchForm } from '@/components/warehouse/BatchForm';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { useStockInData } from '@/hooks/useStockInData';
import { toast } from '@/hooks/use-toast';

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

  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [remainingBoxes, setRemainingBoxes] = useState<number>(0);
  
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
    isSubmitting
  } = useBatchStockIn(user?.id || '');

  // Populate form with stockInData when it's loaded and initialize remaining boxes
  useEffect(() => {
    if (stockInData) {
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

  const handleBatchSubmission = () => {
    if (!user) return;
    if (batches.length === 0) {
      toast({
        title: 'No batches added',
        description: 'Please add at least one batch before submitting',
        variant: 'destructive'
      });
      return;
    }

    // Fix: Add proper type handling for productId
    let productId: string;
    
    if (stockInData?.product && 'id' in stockInData.product) {
      // When product has an id property, use it with string casting for safety
      productId = stockInData.product.id as string;
    } else if (batches.length > 0) {
      // Fallback to the first batch's product id
      productId = batches[0].product_id;
    } else {
      // Ultimate fallback (shouldn't happen due to the check above, but TypeScript needs this)
      console.error("No product ID found in either stockInData or batches");
      return;
    }
    
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {adminMode ? 'Stock In Management' : 'Stock In Processing'}
          </Button>
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
        <Card>
          <CardContent className="p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {stockInData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Stock-In Request Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {stockInData.product?.name || 'Unknown Product'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Boxes</Label>
                    <div className="p-2 bg-muted rounded-md flex justify-between items-center">
                      <span>{stockInData.boxes || 0}</span>
                      <span className={`text-sm font-medium ${remainingBoxes < 0 ? 'text-red-500' : remainingBoxes === 0 ? 'text-green-500' : 'text-yellow-500'}`}>
                        {remainingBoxes < 0 ? `Exceeded by ${Math.abs(remainingBoxes)}` : 
                         remainingBoxes === 0 ? 'All boxes allocated' : 
                         `${remainingBoxes} remaining`}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input 
                    id="source" 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)} 
                    placeholder="Supplier or source"
                    readOnly={!!stockInId}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Optional notes about this batch"
                    readOnly={!!stockInId}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {remainingBoxes < 0 && (
            <Card className="border-red-300 bg-red-50">
              <CardContent className="p-4 flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} />
                <span>Warning: You've allocated more boxes than are available in the original request.</span>
              </CardContent>
            </Card>
          )}
          
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <BatchForm 
                onAddBatch={handleAddBatch} 
                isSubmitting={isSubmitting}
                editingBatch={editingIndex !== null ? batches[editingIndex] : undefined}
                onCancel={editingIndex !== null ? () => setEditingIndex(null) : undefined}
                maxBoxes={remainingBoxes + (editingIndex !== null ? batches[editingIndex].boxes_count : 0)}
                stockInData={stockInData}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Batches ({batches.length})</h3>
              
              {batches.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No batches added yet. Use the form to add batches.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {batches.map((batch, index) => (
                    <BatchCard 
                      key={index}
                      batch={batch}
                      index={index}
                      onEdit={() => editBatch(index)} 
                      onDelete={() => deleteBatch(index)} 
                      showBarcodes={true}
                    />
                  ))}
                  
                  <Button 
                    onClick={handleBatchSubmission} 
                    className="w-full mt-4" 
                    disabled={batches.length === 0 || isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Submit All Batches'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BatchStockInComponent;
