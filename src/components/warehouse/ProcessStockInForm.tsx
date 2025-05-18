
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Box, Clipboard } from 'lucide-react';

interface ProcessStockInFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockIn: StockInRequestData | null;
  userId?: string;
  adminMode?: boolean;
}

const ProcessStockInForm: React.FC<ProcessStockInFormProps> = ({
  open,
  onOpenChange,
  stockIn,
  userId,
  adminMode = false,
}) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [confirmedBoxes, setConfirmedBoxes] = useState<number>(0);
  const [processingNotes, setProcessingNotes] = useState<string>('');
  
  // Fetch warehouses and locations
  const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: locations, isLoading: isLoadingLocations } = useLocations(warehouseId);
  
  // Reset form when the selected stockIn changes
  useEffect(() => {
    if (stockIn) {
      setConfirmedBoxes(stockIn.boxes);
      setProcessingNotes(stockIn.notes || '');
      setWarehouseId('');
      setLocationId('');
    }
  }, [stockIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stockIn || !userId) {
      toast({
        title: "Error",
        description: "Missing stock in information or user ID",
        variant: "destructive",
      });
      return;
    }
    
    if (!warehouseId) {
      toast({
        title: "Required Field",
        description: "Please select a warehouse",
        variant: "destructive",
      });
      return;
    }

    if (!locationId) {
      toast({
        title: "Required Field",
        description: "Please select a location",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirmedBoxes || confirmedBoxes <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Please enter a valid number of boxes",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update the stock_in record to "processing" status
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: 'processing',
          processed_by: userId,
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', stockIn.id);
      
      if (updateError) throw updateError;
      
      // Store processing preferences in localStorage
      localStorage.setItem('stock_in_processing_preferences', JSON.stringify({
        warehouseId,
        locationId,
        confirmedBoxes,
        processingNotes,
      }));
      
      // Close the dialog
      onOpenChange(false);
      
      // Navigate to the unified batch processing page
      const baseRoute = adminMode ? '/admin' : '/manager';
      navigate(`${baseRoute}/stock-in/unified/${stockIn.id}`);
      
    } catch (error) {
      console.error('Error starting stock in processing:', error);
      toast({
        title: "Error",
        description: "Failed to initiate stock in processing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Process Stock In Request
          </DialogTitle>
          <DialogDescription>
            Enter the required information to begin processing this stock in request
          </DialogDescription>
        </DialogHeader>
        
        {stockIn && (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-3 text-left">
              {/* Stock In Information Summary */}
              <div className="bg-muted/60 p-3 rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Product:</span>
                  <span className="font-medium">{stockIn.product?.name || 'Unknown Product'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Source:</span>
                  <span>{stockIn.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  <Badge variant="outline">{stockIn.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Requested Boxes:</span>
                  <span className="font-medium">{stockIn.boxes}</span>
                </div>
              </div>
              
              {/* Warehouse Selection */}
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse <span className="text-destructive">*</span></Label>
                <Select
                  value={warehouseId}
                  onValueChange={setWarehouseId}
                  disabled={isLoadingWarehouses || isSubmitting}
                >
                  <SelectTrigger id="warehouse">
                    <SelectValue placeholder="Select a warehouse" />
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
              
              {/* Location Selection - Only shown when warehouse is selected */}
              {warehouseId && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                  <Select
                    value={locationId}
                    onValueChange={setLocationId}
                    disabled={isLoadingLocations || isSubmitting}
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          Floor {location.floor}, Zone {location.zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Confirmed Boxes */}
              <div className="space-y-2">
                <Label htmlFor="confirmedBoxes">Confirmed Box Count <span className="text-destructive">*</span></Label>
                <Input
                  id="confirmedBoxes"
                  type="number"
                  value={confirmedBoxes}
                  onChange={(e) => setConfirmedBoxes(parseInt(e.target.value) || 0)}
                  min="1"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Processing Notes */}
              <div className="space-y-2">
                <Label htmlFor="processingNotes">Processing Notes</Label>
                <Textarea
                  id="processingNotes"
                  value={processingNotes}
                  onChange={(e) => setProcessingNotes(e.target.value)}
                  placeholder="Enter any additional notes for processing"
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting || !warehouseId || !locationId || confirmedBoxes <= 0}
              >
                {isSubmitting ? 'Processing...' : 'Start Processing'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProcessStockInForm;
