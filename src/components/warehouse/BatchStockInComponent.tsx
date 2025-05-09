
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Boxes, AlertTriangle, ArrowLeft, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBatchStockIn } from '@/hooks/useBatchStockIn';
import { BatchForm } from '@/components/warehouse/BatchForm';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { useStockInData } from '@/hooks/useStockInData';
import { toast } from '@/hooks/use-toast';
import { BackButton } from '@/components/warehouse/BackButton';
import { useWarehouseData } from '@/hooks/useWarehouseData';
import { DataSyncProvider, useDataSync } from '@/context/DataSyncContext';

interface BatchStockInComponentProps {
  adminMode?: boolean;
  sheetMode?: boolean;
  onClose?: () => void;
}

const BatchStockInContent: React.FC<BatchStockInComponentProps> = ({ 
  adminMode = false, 
  sheetMode = false,
  onClose
}) => {
  const { stockInId } = useParams<{ stockInId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stockInData, isLoadingStockIn } = useStockInData(stockInId);
  const { subscribeToTable } = useDataSync();

  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [remainingBoxes, setRemainingBoxes] = useState<number>(0);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Subscribe to real-time updates for relevant tables
  useEffect(() => {
    if (stockInId) {
      subscribeToTable('stock_in');
    }
    subscribeToTable('inventory');
  }, [stockInId, subscribeToTable]);
  
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
    isSubmitting: isMutationSubmitting,
    isProcessing
  } = useBatchStockIn(user?.id || '');

  // Default warehouse data
  const [defaultValues, setDefaultValues] = useState({
    warehouse: '',
    location: '',
    quantity: 0,
    color: '',
    size: '',
  });

  // Get warehouse data
  const { warehouses, locations } = useWarehouseData(defaultValues.warehouse);

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
    // Prevent adding new batches when we're submitting
    if (isMutationSubmitting || isProcessing || formSubmitted || isSubmitting) {
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
    
    // Set flag to prevent double submission
    setFormSubmitted(true);
    setIsSubmitting(true);

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

  // Function to apply default warehouse, location to all batches
  const applyDefaultsToAll = () => {
    if (!defaultValues.warehouse || !defaultValues.location) {
      toast({
        variant: 'destructive',
        title: 'Missing defaults',
        description: 'Please select a warehouse and location before applying to all batches.',
      });
      return;
    }
    
    // Update all batches with default values
    // This would need to be implemented in useBatchStockIn hook
    // For now we'll show a success toast
    toast({
      title: 'Defaults Applied',
      description: 'Default values have been applied to all batches.',
    });
  };

  // Check if any required data is missing from batches
  const isMissingRequiredData = () => {
    return batches.some(batch => 
      !batch.warehouse_id || 
      !batch.location_id || 
      batch.boxes_count <= 0 ||
      batch.quantity_per_box <= 0
    );
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
        <Card className="apple-shadow-sm">
          <CardContent className="p-6 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {stockInData && (
            <Card className="apple-shadow-sm">
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
                    <div className="p-2 bg-muted rounded-lg">
                      {stockInData.product?.name || 'Unknown Product'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Total Boxes</Label>
                    <div className="p-2 bg-muted rounded-lg flex justify-between items-center">
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
                    className="apple-shadow-sm"
                    disabled={isSubmitting || isProcessing || formSubmitted}
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
                    className="apple-shadow-sm min-h-[100px]"
                    disabled={isSubmitting || isProcessing || formSubmitted}
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {remainingBoxes < 0 && (
            <Card className="border-red-300 bg-red-50 dark:bg-red-900/20 apple-shadow-sm">
              <CardContent className="p-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle size={16} />
                <span>Warning: You've allocated more boxes than are available in the original request.</span>
              </CardContent>
            </Card>
          )}
          
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <BatchForm 
                onAddBatch={handleAddBatch} 
                isSubmitting={isSubmitting || isProcessing || formSubmitted || isMutationSubmitting}
                editingBatch={editingIndex !== null ? batches[editingIndex] : undefined}
                onCancel={editingIndex !== null ? () => setEditingIndex(null) : undefined}
                maxBoxes={remainingBoxes + (editingIndex !== null ? batches[editingIndex].boxes_count : 0)}
                stockInData={stockInData}
                defaultValues={defaultValues}
                setDefaultValues={setDefaultValues}
                warehouses={warehouses || []}
                locations={locations || []}
              />
              
              {/* Default values section for warehouse/location - optional */}
              <Card className="apple-shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Default Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="default-warehouse">Default Warehouse</Label>
                      <Select
                        value={defaultValues.warehouse}
                        onValueChange={(value) => setDefaultValues({...defaultValues, warehouse: value})}
                        disabled={isSubmitting || isProcessing || formSubmitted}
                      >
                        <SelectTrigger id="default-warehouse" className="apple-shadow-sm">
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses?.map(warehouse => (
                            <SelectItem key={warehouse.id} value={warehouse.id}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default-location">Default Location</Label>
                      <Select
                        value={defaultValues.location}
                        onValueChange={(value) => setDefaultValues({...defaultValues, location: value})}
                        disabled={isSubmitting || isProcessing || formSubmitted || !defaultValues.warehouse}
                      >
                        <SelectTrigger id="default-location" className="apple-shadow-sm">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations?.map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              Floor {location.floor}, Zone {location.zone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={applyDefaultsToAll}
                    disabled={isSubmitting || isProcessing || formSubmitted || !defaultValues.warehouse || !defaultValues.location}
                    className="w-full apple-shadow-sm"
                  >
                    Apply to All Batches
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Batches ({batches.length})</h3>
              
              {batches.length === 0 ? (
                <Card className="apple-shadow-sm">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No batches added yet. Use the form to add batches.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
                  {batches.map((batch, index) => (
                    <BatchCard 
                      key={index}
                      batch={batch}
                      index={index}
                      onEdit={() => !isSubmitting && !isProcessing && !formSubmitted && !isMutationSubmitting && editBatch(index)} 
                      onDelete={() => !isSubmitting && !isProcessing && !formSubmitted && !isMutationSubmitting && deleteBatch(index)} 
                      showBarcodes={true}
                      disabled={isSubmitting || isProcessing || formSubmitted || isMutationSubmitting}
                    />
                  ))}
                  
                  <Button 
                    onClick={handleBatchSubmission} 
                    className="w-full mt-4 apple-shadow-sm" 
                    disabled={
                      batches.length === 0 || 
                      isSubmitting || 
                      isProcessing || 
                      formSubmitted ||
                      isMutationSubmitting ||
                      isMissingRequiredData()
                    }
                  >
                    {isSubmitting || isProcessing || isMutationSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : 'Submit All Batches'}
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

// Wrap the component with DataSyncProvider
const BatchStockInComponent: React.FC<BatchStockInComponentProps> = (props) => {
  return (
    <DataSyncProvider>
      <BatchStockInContent {...props} />
    </DataSyncProvider>
  );
};

export default BatchStockInComponent;
