import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Warehouse, ScanLine, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import BarcodeScanner from '@/components/barcode/BarcodeScanner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createInventoryMovement } from '@/hooks/useInventoryMovements';
import { v4 as uuidv4 } from 'uuid';

interface ScannedItem {
  barcode: string;
  inventory_id: string;
  product_name: string;
  product_id: string;
  warehouse_name: string;
  warehouse_id: string;
  location_name: string;
  location_id: string;
  quantity: number;
}

interface InventoryItemResponse {
  inventory_id: string;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  warehouse_location: string;
  floor: number;
  zone: string;
  quantity: number;
  barcode: string;
  color: string;
  size: string;
  batch_id: string;
  status: string;
  // Add the missing fields needed for warehouse and location IDs
  warehouse_id: string;
  location_id: string;
}

const FieldOperatorTransfers: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [currentScannedBarcode, setCurrentScannedBarcode] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [targetWarehouseId, setTargetWarehouseId] = useState('');
  const [targetLocationId, setTargetLocationId] = useState('');
  const [reason, setReason] = useState('');

  // Fetch warehouses
  const { data: warehouses, isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('id, name, location')
        .order('name');
        
      if (error) throw error;
      return data;
    },
  });

  // Fetch locations based on selected warehouse
  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ['locations', targetWarehouseId],
    queryFn: async () => {
      if (!targetWarehouseId) return [];
      
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('id, floor, zone, warehouse_id')
        .eq('warehouse_id', targetWarehouseId)
        .order('floor')
        .order('zone');
        
      if (error) throw error;
      return data;
    },
    enabled: !!targetWarehouseId,
  });

  const handleBarcodeScanned = async (barcode: string) => {
    setCurrentScannedBarcode(barcode);
    
    // Check if barcode already scanned
    if (scannedItems.some(item => item.barcode === barcode)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate barcode',
        description: 'This item has already been scanned.',
      });
      return;
    }
    
    try {
      // Query inventory details
      const { data, error } = await supabase.rpc(
        'find_inventory_by_barcode',
        { search_barcode: barcode }
      );
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid barcode',
          description: 'No inventory found with this barcode.',
        });
        return;
      }
      
      // Explicitly cast the response to include the missing fields
      const item = data[0] as InventoryItemResponse;
      
      // Add to scanned items
      setScannedItems([...scannedItems, {
        barcode: item.barcode,
        inventory_id: item.inventory_id,
        product_name: item.product_name,
        product_id: item.inventory_id,
        warehouse_name: item.warehouse_name,
        warehouse_id: item.warehouse_id, // Now properly typed
        location_name: `Floor ${item.floor}, Zone ${item.zone}`,
        location_id: item.location_id, // Now properly typed
        quantity: item.quantity
      }]);
      
      setCurrentScannedBarcode('');
      
      toast({
        title: 'Item scanned',
        description: `Added ${item.product_name} to transfer list.`,
      });
    } catch (error) {
      console.error('Error fetching barcode details:', error);
      toast({
        variant: 'destructive',
        title: 'Error scanning barcode',
        description: error instanceof Error ? error.message : 'Failed to process barcode',
      });
    }
  };
  
  const removeScannedItem = (index: number) => {
    const updatedItems = [...scannedItems];
    updatedItems.splice(index, 1);
    setScannedItems(updatedItems);
  };
  
  const transferMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !targetWarehouseId || !targetLocationId || scannedItems.length === 0) {
        throw new Error('Missing required fields');
      }
      
      // Generate a unique transfer reference ID to link related movements
      const transferReferenceId = uuidv4();
      
      // Create an inventory movement for each scanned item
      const promises = scannedItems.map(async (item) => {
        // Create "out" movement from source location
        await createInventoryMovement(
          item.product_id,
          item.warehouse_id,
          item.location_id,
          item.quantity,
          'transfer',
          'in_transit',
          'inventory',
          item.inventory_id,
          user.id,
          {
            direction: 'out',
            from_warehouse_id: item.warehouse_id,
            from_location_id: item.location_id,
            to_warehouse_id: targetWarehouseId,
            to_location_id: targetLocationId,
            barcode: item.barcode,
            notes: reason || 'Field transfer'
          },
          transferReferenceId
        );
        
        // Create "in" movement to destination location
        await createInventoryMovement(
          item.product_id,
          targetWarehouseId,
          targetLocationId,
          item.quantity,
          'transfer',
          'in_transit',
          'inventory',
          item.inventory_id,
          user.id,
          {
            direction: 'in',
            from_warehouse_id: item.warehouse_id,
            from_location_id: item.location_id,
            to_warehouse_id: targetWarehouseId,
            to_location_id: targetLocationId,
            barcode: item.barcode,
            notes: reason || 'Field transfer'
          },
          transferReferenceId
        );
        
        // Update the inventory record
        await supabase
          .from('inventory')
          .update({
            warehouse_id: targetWarehouseId,
            location_id: targetLocationId,
          })
          .eq('id', item.inventory_id);
      });
      
      await Promise.all(promises);
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Transfer submitted',
        description: `Successfully transferred ${scannedItems.length} items.`,
      });
      setScannedItems([]);
      setTargetWarehouseId('');
      setTargetLocationId('');
      setReason('');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Transfer failed',
        description: error instanceof Error ? error.message : 'Failed to process transfer',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetWarehouseId) {
      toast({
        variant: 'destructive',
        title: 'Missing destination warehouse',
        description: 'Please select a destination warehouse.',
      });
      return;
    }
    
    if (!targetLocationId) {
      toast({
        variant: 'destructive',
        title: 'Missing destination location',
        description: 'Please select a destination location.',
      });
      return;
    }
    
    if (scannedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No items scanned',
        description: 'Please scan at least one item to transfer.',
      });
      return;
    }
    
    transferMutation.mutate();
  };
  
  const isSubmitDisabled = () => {
    return scannedItems.length === 0 || !targetWarehouseId || !targetLocationId || transferMutation.isPending;
  };
  
  // Group scanned items by warehouse
  const groupedItems = scannedItems.reduce<Record<string, ScannedItem[]>>((acc, item) => {
    if (!acc[item.warehouse_name]) {
      acc[item.warehouse_name] = [];
    }
    acc[item.warehouse_name].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Transfer Inventory" 
        description="Move inventory between warehouses and locations"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/field')}
        className="flex items-center gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ScanLine className="mr-2 h-5 w-5" />
              Scan Items
            </CardTitle>
            <CardDescription>
              Scan inventory items to transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarcodeScanner 
              allowManualEntry={true}
              allowCameraScanning={true}
              onBarcodeScanned={handleBarcodeScanned}
              inputValue={currentScannedBarcode}
              onInputChange={(e) => setCurrentScannedBarcode(e.target.value)}
              scanButtonLabel="Scan Item"
              embedded={true}
            />
            
            {scannedItems.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Scanned Items: {scannedItems.length}</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(groupedItems).map(([warehouseName, items]) => (
                    <div key={warehouseName} className="border rounded-md overflow-hidden">
                      <div className="bg-muted p-2">
                        <h4 className="text-sm font-medium">{warehouseName}</h4>
                      </div>
                      <div className="divide-y">
                        {items.map((item, idx) => {
                          const itemIndex = scannedItems.findIndex(si => si.barcode === item.barcode);
                          return (
                            <div key={idx} className="p-2 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{item.product_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Location: {item.location_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} • Barcode: {item.barcode}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeScannedItem(itemIndex)}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                &times;
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRight className="mr-2 h-5 w-5" />
              Transfer Details
            </CardTitle>
            <CardDescription>
              Select destination and submit transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="destination-warehouse">Destination Warehouse</Label>
                <Select 
                  value={targetWarehouseId} 
                  onValueChange={setTargetWarehouseId}
                >
                  <SelectTrigger id="destination-warehouse">
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehousesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : warehouses?.map(warehouse => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="destination-location">Destination Location</Label>
                <Select 
                  value={targetLocationId} 
                  onValueChange={setTargetLocationId}
                  disabled={!targetWarehouseId}
                >
                  <SelectTrigger id="destination-location">
                    <SelectValue placeholder={targetWarehouseId ? "Select location" : "Select warehouse first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locationsLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : locations?.length ? 
                      locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          Floor {location.floor}, Zone {location.zone}
                        </SelectItem>
                      )) : (
                        <SelectItem value="no-locations" disabled>No locations available</SelectItem>
                      )
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea 
                  id="reason"
                  placeholder="Reason for transfer"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitDisabled()}
              className="w-full"
            >
              {transferMutation.isPending ? 'Processing...' : 'Submit Transfer'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default FieldOperatorTransfers;
