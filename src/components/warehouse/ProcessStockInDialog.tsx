
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StockInData {
  id: string;
  product: { name: string };
  submitter: { name: string; username: string } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
}

interface ProcessingForm {
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
}

interface ProcessStockInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStockIn: StockInData | null;
  userId: string | undefined;
}

export const ProcessStockInDialog: React.FC<ProcessStockInDialogProps> = ({
  open,
  onOpenChange,
  selectedStockIn,
  userId,
}) => {
  const queryClient = useQueryClient();

  const [processingForm, setProcessingForm] = useState<ProcessingForm>({
    warehouse_id: '',
    location_id: '',
    barcode: '',
    quantity: 0,
    color: '',
    size: '',
  });

  // Reset form when selectedStockIn changes
  React.useEffect(() => {
    if (selectedStockIn) {
      setProcessingForm({
        warehouse_id: '',
        location_id: '',
        barcode: `${Date.now()}`, // Generate a temporary barcode
        quantity: selectedStockIn.boxes * 10, // Assume each box has 10 units
        color: '',
        size: '',
      });
    }
  }, [selectedStockIn]);

  // Fetch warehouses for the dropdown
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch warehouse locations based on selected warehouse
  const { data: locations } = useQuery({
    queryKey: ['warehouse-locations', processingForm.warehouse_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', processingForm.warehouse_id)
        .order('floor')
        .order('zone');
        
      if (error) throw error;
      return data;
    },
    enabled: !!processingForm.warehouse_id,
  });

  // Process stock in mutation
  const processStockInMutation = useMutation({
    mutationFn: async (data: { stockInId: string; details: ProcessingForm }) => {
      // First update stock in status to processing
      const status: "pending" | "approved" | "rejected" | "completed" | "processing" = "processing";
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({ 
          status,
          processed_by: userId 
        })
        .eq('id', data.stockInId);

      if (updateError) throw updateError;

      // Then create stock in details
      const { error: detailsError } = await supabase
        .from('stock_in_details')
        .insert([{
          stock_in_id: data.stockInId,
          warehouse_id: data.details.warehouse_id,
          location_id: data.details.location_id,
          barcode: data.details.barcode,
          quantity: data.details.quantity,
          color: data.details.color || null,
          size: data.details.size || null,
        }]);

      if (detailsError) throw detailsError;

      // Create or update inventory
      const { data: existingInventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('barcode', data.details.barcode)
        .maybeSingle();

      if (existingInventory) {
        // Update existing inventory
        const { error: updateInventoryError } = await supabase
          .from('inventory')
          .update({ 
            quantity: existingInventory.quantity + data.details.quantity 
          })
          .eq('id', existingInventory.id);

        if (updateInventoryError) throw updateInventoryError;
      } else {
        // Get product_id from stock_in
        const { data: stockInData } = await supabase
          .from('stock_in')
          .select('product_id')
          .eq('id', data.stockInId)
          .single();

        if (!stockInData) throw new Error('Stock in not found');

        // Create new inventory entry
        const { error: createInventoryError } = await supabase
          .from('inventory')
          .insert([{
            product_id: stockInData.product_id,
            warehouse_id: data.details.warehouse_id,
            location_id: data.details.location_id,
            barcode: data.details.barcode,
            quantity: data.details.quantity,
            color: data.details.color || null,
            size: data.details.size || null,
          }]);

        if (createInventoryError) throw createInventoryError;
      }

      // Finally update stock in status to completed
      const finalStatus: "pending" | "approved" | "rejected" | "completed" | "processing" = "completed";
      const { error: completeError } = await supabase
        .from('stock_in')
        .update({ status: finalStatus })
        .eq('id', data.stockInId);

      if (completeError) throw completeError;

      return true;
    },
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Stock In Processed',
        description: 'The stock in has been processed and added to inventory.',
      });
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
    if (!selectedStockIn) return;

    processStockInMutation.mutate({
      stockInId: selectedStockIn.id,
      details: processingForm,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Process Stock In</DialogTitle>
        </DialogHeader>
        
        {selectedStockIn && (
          <form onSubmit={handleProcessingSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="font-medium">Product: {selectedStockIn.product?.name}</div>
                <div className="text-sm text-gray-500">Boxes: {selectedStockIn.boxes}</div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="warehouse_id">Warehouse</Label>
                <Select 
                  value={processingForm.warehouse_id} 
                  onValueChange={(value) => setProcessingForm(prev => ({ ...prev, warehouse_id: value, location_id: '' }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                    )) || (
                      <SelectItem value="no-warehouses-available" disabled>No warehouses available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location_id">Location</Label>
                <Select 
                  value={processingForm.location_id} 
                  onValueChange={(value) => setProcessingForm(prev => ({ ...prev, location_id: value }))}
                  disabled={!processingForm.warehouse_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        Floor {location.floor}, Zone {location.zone}
                      </SelectItem>
                    )) || (
                      <SelectItem value="no-locations-available" disabled>No locations available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input 
                  id="barcode"
                  value={processingForm.barcode}
                  onChange={(e) => setProcessingForm(prev => ({ ...prev, barcode: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity"
                  type="number"
                  min="1"
                  value={processingForm.quantity}
                  onChange={(e) => setProcessingForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Color (Optional)</Label>
                <Input 
                  id="color"
                  value={processingForm.color}
                  onChange={(e) => setProcessingForm(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="size">Size (Optional)</Label>
                <Input 
                  id="size"
                  value={processingForm.size}
                  onChange={(e) => setProcessingForm(prev => ({ ...prev, size: e.target.value }))}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!processingForm.warehouse_id || !processingForm.location_id || processStockInMutation.isPending}
              >
                {processStockInMutation.isPending ? 'Processing...' : 'Process Stock In'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
