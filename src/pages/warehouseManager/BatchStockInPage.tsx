
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BatchForm } from '@/components/warehouse/BatchForm';
import { BatchCard } from '@/components/warehouse/BatchCard';
import { useBatchStockIn } from '@/hooks/useBatchStockIn';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, SendHorizontal, AlertTriangle } from 'lucide-react';
import { BatchFormData } from '@/types/batchStockIn';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { toast } from '@/hooks/use-toast';

const BatchStockInPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id || '';

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [editFormData, setEditFormData] = useState<BatchFormData | null>(null);

  const { 
    batches, 
    addBatch, 
    editBatch, 
    deleteBatch, 
    editingIndex, 
    setEditingIndex,
    submitStockIn,
    isSubmitting
  } = useBatchStockIn(userId);

  // Fetch products
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleEditBatch = (index: number) => {
    const batch = editBatch(index);
    if (!batch) return;
    
    // Prepare form data for editing
    setEditFormData({
      product: batch.product || null,
      warehouse: batch.warehouse || null,
      location: batch.warehouseLocation || null,
      boxes_count: batch.boxes_count,
      quantity_per_box: batch.quantity_per_box,
      color: batch.color || '',
      size: batch.size || '',
    });
  };

  const handleAddBatch = (formData: BatchFormData) => {
    addBatch(formData);
    setEditFormData(null);
  };

  const handleSubmit = () => {
    if (!selectedProductId) {
      toast({
        title: 'Missing product',
        description: 'Please select a product for the stock-in',
        variant: 'destructive'
      });
      return;
    }

    if (!source) {
      toast({
        title: 'Missing source',
        description: 'Please enter the source of the stock-in',
        variant: 'destructive'
      });
      return;
    }

    if (batches.length === 0) {
      toast({
        title: 'No batches',
        description: 'Please add at least one batch to process',
        variant: 'destructive'
      });
      return;
    }

    submitStockIn({
      productId: selectedProductId,
      source,
      notes,
      submittedBy: userId,
      batches
    });
  };

  useEffect(() => {
    // When editing is cancelled or finished, clear the edit form data
    if (editingIndex === null) {
      setEditFormData(null);
    }
  }, [editingIndex]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Batch Stock-In Processing" 
        description="Create and manage stock batches for efficient inventory processing"
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Batch Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock-In Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Main Product</Label>
                <Select onValueChange={handleProductChange} disabled={isSubmitting || batches.length > 0}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {batches.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Cannot change main product once batches are added
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g. Supplier Name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <BatchForm 
            onAddBatch={handleAddBatch} 
            isSubmitting={isSubmitting}
          />
        </div>

        {/* Right column - Batches List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">Batches ({batches.length})</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-grow">
              {batches.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-4 border border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">No batches added yet</p>
                  <p className="text-xs text-muted-foreground">
                    Use the form on the left to create batches for processing
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {batches.map((batch, index) => (
                      <BatchCard
                        key={index}
                        batch={batch}
                        index={index}
                        onDelete={deleteBatch}
                        onEdit={handleEditBatch}
                        showBarcodes={true}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
            
            <div className="p-4 mt-auto border-t">
              <Button 
                className="w-full"
                size="lg"
                disabled={batches.length === 0 || !selectedProductId || !source || isSubmitting}
                onClick={handleSubmit}
              >
                <SendHorizontal className="mr-2 h-5 w-5" />
                {isSubmitting ? 'Processing...' : 'Process Stock-In'}
              </Button>
              {batches.length > 0 && (
                <div className="mt-2 text-sm text-muted-foreground text-center">
                  {batches.reduce((sum, batch) => sum + batch.boxes_count, 0)} boxes in {batches.length} batches
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BatchStockInPage;
