
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Trash, Box } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockInData {
  id: string;
  product: { name: string };
  submitter: { name: string; username: string } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
}

interface BoxData {
  id: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
  warehouse_id: string;
  location_id: string;
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
  const [boxesData, setBoxesData] = useState<BoxData[]>([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState<string>('');
  const [defaultLocation, setDefaultLocation] = useState<string>('');
  const [defaultColor, setDefaultColor] = useState<string>('');
  const [defaultSize, setDefaultSize] = useState<string>('');

  // Reset form when selectedStockIn changes
  React.useEffect(() => {
    if (selectedStockIn && open) {
      // Initialize with empty box entries for the number of boxes
      const initialBoxes = Array(selectedStockIn.boxes).fill(null).map((_, index) => ({
        id: `temp-${index}`,
        barcode: `${Date.now()}-${index}`, // Generate a temporary barcode
        quantity: 0, // Default quantity per box
        color: '',
        size: '',
        warehouse_id: '',
        location_id: ''
      }));
      
      setBoxesData(initialBoxes);
      setDefaultWarehouse('');
      setDefaultLocation('');
      setDefaultColor('');
      setDefaultSize('');
    }
  }, [selectedStockIn, open]);

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
    queryKey: ['warehouse-locations', defaultWarehouse],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', defaultWarehouse)
        .order('floor')
        .order('zone');
        
      if (error) throw error;
      return data;
    },
    enabled: !!defaultWarehouse,
  });

  // Process stock in mutation
  const processStockInMutation = useMutation({
    mutationFn: async (data: { stockInId: string; boxes: BoxData[] }) => {
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

      // Create stock in details for each box
      const stockInDetailPromises = data.boxes.map(box => {
        return supabase
          .from('stock_in_details')
          .insert([{
            stock_in_id: data.stockInId,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: box.barcode,
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
          }]);
      });
      
      const stockInDetailsResults = await Promise.all(stockInDetailPromises);
      const stockInDetailsError = stockInDetailsResults.find(result => result.error);
      
      if (stockInDetailsError) throw stockInDetailsError.error;

      // Get product_id from stock_in for inventory creation
      const { data: stockInData } = await supabase
        .from('stock_in')
        .select('product_id')
        .eq('id', data.stockInId)
        .single();

      if (!stockInData) throw new Error('Stock in not found');

      // Create inventory entries for each box
      const inventoryPromises = data.boxes.map(box => {
        return supabase
          .from('inventory')
          .insert([{
            product_id: stockInData.product_id,
            warehouse_id: box.warehouse_id,
            location_id: box.location_id,
            barcode: box.barcode,
            quantity: box.quantity,
            color: box.color || null,
            size: box.size || null,
          }]);
      });
      
      const inventoryResults = await Promise.all(inventoryPromises);
      const inventoryError = inventoryResults.find(result => result.error);
      
      if (inventoryError) throw inventoryError.error;

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

  // Update a single box data
  const handleBoxUpdate = (index: number, field: keyof BoxData, value: string | number) => {
    const updatedBoxes = [...boxesData];
    updatedBoxes[index] = {
      ...updatedBoxes[index],
      [field]: value
    };
    setBoxesData(updatedBoxes);
  };

  // Apply default values to all boxes
  const applyDefaultsToAll = () => {
    if (!defaultWarehouse || !defaultLocation) {
      toast({
        variant: 'destructive',
        title: 'Missing defaults',
        description: 'Please select a warehouse and location before applying to all boxes.',
      });
      return;
    }

    const updatedBoxes = boxesData.map(box => ({
      ...box,
      warehouse_id: defaultWarehouse,
      location_id: defaultLocation,
      color: defaultColor,
      size: defaultSize
    }));
    
    setBoxesData(updatedBoxes);
  };

  const isMissingRequiredData = () => {
    return boxesData.some(box => 
      !box.warehouse_id || 
      !box.location_id || 
      !box.barcode || 
      box.quantity <= 0
    );
  };

  const handleProcessingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockIn) return;

    if (isMissingRequiredData()) {
      toast({
        variant: 'destructive',
        title: 'Incomplete data',
        description: 'Please fill in all required fields for each box.',
      });
      return;
    }

    processStockInMutation.mutate({
      stockInId: selectedStockIn.id,
      boxes: boxesData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Process Stock In</DialogTitle>
        </DialogHeader>
        
        {selectedStockIn && (
          <form onSubmit={handleProcessingSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Product: {selectedStockIn.product?.name}</div>
                <div className="text-sm text-gray-500">Total Boxes: {selectedStockIn.boxes}</div>
                <div className="text-sm text-gray-500">
                  Submitted By: {selectedStockIn.submitter ? `${selectedStockIn.submitter.name} (${selectedStockIn.submitter.username})` : 'Unknown'}
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="text-sm font-medium mb-3">Set Default Values (Apply to All Boxes)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="default_warehouse">Warehouse</Label>
                    <Select 
                      value={defaultWarehouse} 
                      onValueChange={setDefaultWarehouse}
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
                  
                  <div>
                    <Label htmlFor="default_location">Location</Label>
                    <Select 
                      value={defaultLocation} 
                      onValueChange={setDefaultLocation}
                      disabled={!defaultWarehouse}
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
                  
                  <div>
                    <Label htmlFor="default_color">Color (Optional)</Label>
                    <Input 
                      id="default_color"
                      value={defaultColor}
                      onChange={(e) => setDefaultColor(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="default_size">Size (Optional)</Label>
                    <Input 
                      id="default_size"
                      value={defaultSize}
                      onChange={(e) => setDefaultSize(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  type="button" 
                  onClick={applyDefaultsToAll}
                  className="mt-4"
                  disabled={!defaultWarehouse || !defaultLocation}
                >
                  Apply to All Boxes
                </Button>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Box Details</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Box #</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Size</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boxesData.map((box, index) => (
                        <TableRow key={box.id}>
                          <TableCell>
                            <span className="flex items-center space-x-1">
                              <Box className="h-4 w-4" />
                              <span>{index + 1}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={box.barcode}
                              onChange={(e) => handleBoxUpdate(index, 'barcode', e.target.value)}
                              className="w-32"
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number"
                              value={box.quantity}
                              onChange={(e) => handleBoxUpdate(index, 'quantity', parseInt(e.target.value) || 0)}
                              className="w-20"
                              min="1"
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={box.warehouse_id} 
                              onValueChange={(value) => {
                                handleBoxUpdate(index, 'warehouse_id', value);
                                handleBoxUpdate(index, 'location_id', '');
                              }}
                              required
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Warehouse" />
                              </SelectTrigger>
                              <SelectContent>
                                {warehouses?.map(warehouse => (
                                  <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.name}</SelectItem>
                                )) || (
                                  <SelectItem value="no-warehouses-available" disabled>None</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select 
                              value={box.location_id} 
                              onValueChange={(value) => handleBoxUpdate(index, 'location_id', value)}
                              disabled={!box.warehouse_id}
                              required
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue placeholder="Location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations?.filter(loc => loc.warehouse_id === box.warehouse_id).map(location => (
                                  <SelectItem key={location.id} value={location.id}>
                                    F{location.floor}, Z{location.zone}
                                  </SelectItem>
                                )) || (
                                  <SelectItem value="no-locations-available" disabled>None</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={box.color}
                              onChange={(e) => handleBoxUpdate(index, 'color', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              value={box.size}
                              onChange={(e) => handleBoxUpdate(index, 'size', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isMissingRequiredData() || processStockInMutation.isPending}
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
