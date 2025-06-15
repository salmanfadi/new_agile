import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { StockInRequestData } from '@/types/database';

interface ProcessStockInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockIn: StockInRequestData | null;
  userId?: string;
  adminMode?: boolean;
}

export const ProcessStockInForm: React.FC<ProcessStockInFormProps> = ({
  open,
  onOpenChange,
  stockIn,
  userId,
  adminMode = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [quantityPerBox, setQuantityPerBox] = useState('1');

  const { warehouses } = useWarehouses();
  const { locations } = useLocations(warehouseId);

  const handleProcess = async () => {
    if (!stockIn || !warehouseId || !locationId) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select both warehouse and location',
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Update the stock in record
      const { error } = await supabase
        .from('stock_in')
        .update({
          status: 'processing',
          warehouse_id: warehouseId,
          processing_started_at: new Date().toISOString()
        })
        .eq('id', stockIn.id);

      if (error) throw error;

      toast({
        title: 'Stock In Processing Started',
        description: 'Stock in request is now being processed',
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error processing stock in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start processing stock in request',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stockIn) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Stock In Request</DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={locationId} onValueChange={setLocationId} disabled={!warehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        Floor {location.floor} - Zone {location.zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity per Box</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantityPerBox}
                onChange={(e) => setQuantityPerBox(e.target.value)}
                placeholder="Items per box"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Processing Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any processing notes..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleProcess} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Start Processing'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessStockInForm;
