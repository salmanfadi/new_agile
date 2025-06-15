
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { WarehouseLocationDetails } from '@/types/location';

interface ProcessStockInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stockInRequest: any;
  onProcess?: () => void;
}

export const ProcessStockInDialog: React.FC<ProcessStockInDialogProps> = ({
  isOpen,
  onClose,
  stockInRequest,
  onProcess
}) => {
  const { user } = useAuth();
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<WarehouseLocationDetails[]>([]);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.error('Error fetching warehouses:', error);
      } else {
        setWarehouses(data || []);
      }
    };

    fetchWarehouses();
  }, []);

  // Fetch locations when warehouse is selected
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedWarehouse) {
        setLocations([]);
        return;
      }

      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', selectedWarehouse);
      
      if (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      } else {
        setLocations(data || []);
      }
    };

    fetchLocations();
  }, [selectedWarehouse]);

  const handleProcess = async () => {
    if (!selectedWarehouse || !selectedLocation) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select warehouse and location'
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Update stock in status to processing
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'processing',
          processed_by: user?.id,
          warehouse_id: selectedWarehouse,
          processing_started_at: new Date().toISOString(),
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', stockInRequest.id);

      if (updateError) throw updateError;

      // Create a processed batch
      const { data: batchData, error: batchError } = await supabase
        .from('processed_batches')
        .insert({
          product_id: stockInRequest.product_id,
          processed_by: user?.id,
          warehouse_id: selectedWarehouse,
          location_id: selectedLocation,
          total_boxes: stockInRequest.boxes || 0,
          total_quantity: stockInRequest.quantity || 0,
          status: 'processing',
          source: stockInRequest.source,
          notes: notes || null,
          stock_in_id: stockInRequest.id
        })
        .select()
        .single();

      if (batchError) throw batchError;

      toast({
        title: 'Processing Started',
        description: 'Stock in request is now being processed'
      });

      onClose();
      if (onProcess) onProcess();

    } catch (error) {
      console.error('Error processing stock in:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start processing'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Process Stock In Request
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Processing stock in for <strong>{stockInRequest?.product?.name || 'Unknown Product'}</strong>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Quantity: {stockInRequest?.quantity || 0} | Boxes: {stockInRequest?.boxes || 0}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="warehouse">Warehouse *</Label>
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!selectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    Floor {location.floor} - Zone {location.zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Processing Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about the processing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !selectedWarehouse || !selectedLocation}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Start Processing
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
