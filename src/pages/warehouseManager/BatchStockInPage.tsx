
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Boxes } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBatchStockIn } from '@/hooks/useBatchStockIn';
import { BatchForm } from '@/components/warehouse/BatchForm';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { useStockInData } from '@/hooks/useStockInData';

const BatchStockInPage: React.FC = () => {
  const { stockInId } = useParams<{ stockInId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stockInData, isLoadingStockIn } = useStockInData(stockInId);

  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

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

  // Populate form with stockInData when it's loaded
  useEffect(() => {
    if (stockInData) {
      setSource(stockInData.source || '');
      setNotes(stockInData.notes || '');
    }
  }, [stockInData]);

  const handleBatchSubmission = () => {
    if (!user) return;
    if (batches.length === 0) return;

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

  const goBack = () => navigate(-1);

  return (
    <div className="container p-6 space-y-6">
      <PageHeader 
        title={stockInId ? "Process Stock In Request" : "Batch Stock In Processing"}
        description={stockInId 
          ? `Process the stock-in request with multiple batches` 
          : "Create and process multiple batches at once"
        }
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={goBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
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
                    <div className="p-2 bg-muted rounded-md">
                      {stockInData.boxes || 0}
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
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <BatchForm 
                onAddBatch={addBatch} 
                isSubmitting={isSubmitting}
                editingBatch={editingIndex !== null ? batches[editingIndex] : undefined}
                onCancel={editingIndex !== null ? () => setEditingIndex(null) : undefined}
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
                <div className="space-y-4">
                  {batches.map((batch, index) => (
                    <BatchCard 
                      key={index}
                      batch={batch}
                      index={index}
                      onEdit={() => editBatch(index)} 
                      onDelete={() => deleteBatch(index)} 
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
    </div>
  );
};

export default BatchStockInPage;
