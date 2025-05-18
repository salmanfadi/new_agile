import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { BoxData } from '@/hooks/useStockInBoxes';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { useNavigate } from 'react-router-dom';
import { useWarehouseLocations } from '@/hooks/useWarehouseLocations';

interface StockInStepBoxesProps {
  stockIn: StockInRequestData;
  boxes: BoxData[];
  updateBox: (index: number, data: Partial<BoxData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Define a more specific type for the warehouse to match the database structure
interface Warehouse {
  id: string;
  name: string;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Export the component as a named export
export function StockInStepBoxes({ stockIn, boxes, updateBox, onNext, onBack }: StockInStepBoxesProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([]);
  const [isContinueDisabled, setIsContinueDisabled] = useState(true);
  const navigate = useNavigate();

  // Fetch warehouses
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data as Warehouse[];
    },
  });

  // Update locations when warehouse changes
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedWarehouse) {
        setWarehouseLocations([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('warehouse_locations')
          .select('*')
          .eq('warehouse_id', selectedWarehouse.id);
          
        if (error) throw error;
        setWarehouseLocations(data as WarehouseLocation[]);
      } catch (error) {
        console.error('Error fetching warehouse locations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load warehouse locations',
          variant: 'destructive',
        });
      }
    };
    
    fetchLocations();
  }, [selectedWarehouse]);
  
  // Set default warehouse if only one exists
  useEffect(() => {
    if (warehouses && warehouses.length === 1) {
      // Using a function to update state to avoid type errors
      setSelectedWarehouse(() => warehouses[0]);
    }
  }, [warehouses]);

  // Validate if all required fields are filled
  useEffect(() => {
    const allValid = boxes.every(
      box => 
        box.warehouse_id && 
        box.location_id && 
        box.quantity > 0 && 
        box.barcode
    );
    
    setIsContinueDisabled(!allValid);
  }, [boxes]);

  // Apply warehouse and location to all boxes
  const applyToAll = (warehouseId: string, locationId: string) => {
    boxes.forEach((_, index) => {
      updateBox(index, { 
        warehouse_id: warehouseId, 
        location_id: locationId 
      });
    });
    
    toast({
      title: 'Applied to all',
      description: 'Warehouse and location applied to all boxes',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-md mb-4">
        <h3 className="font-medium mb-2">Default Warehouse and Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="default-warehouse">Default Warehouse</Label>
            <Select
              value={selectedWarehouse?.id || ''}
              onValueChange={(value) => {
                const selected = warehouses?.find(w => w.id === value);
                if (selected) {
                  // Using a function to update state to avoid type errors
                  setSelectedWarehouse(() => selected);
                }
              }}
              disabled={isLoadingWarehouses}
            >
              <SelectTrigger id="default-warehouse">
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
            <Label htmlFor="default-location">Default Location</Label>
            <Select
              value=""
              onValueChange={(locationId) => {
                if (selectedWarehouse) {
                  applyToAll(selectedWarehouse.id, locationId);
                }
              }}
              disabled={!selectedWarehouse || warehouseLocations.length === 0}
            >
              <SelectTrigger id="default-location">
                <SelectValue placeholder="Apply location to all" />
              </SelectTrigger>
              <SelectContent>
                {warehouseLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    Floor {location.floor}, Zone {location.zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {boxes.map((box, index) => (
          <div key={index} className="border rounded-md p-4">
            <h4 className="font-medium mb-2">Box {index + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`box-${index}-warehouse`}>Warehouse</Label>
                <Select
                  value={box.warehouse_id || ''}
                  onValueChange={(value) => {
                    updateBox(index, { warehouse_id: value });
                    // Clear location when warehouse changes
                    updateBox(index, { location_id: '' });
                  }}
                  disabled={isLoadingWarehouses}
                >
                  <SelectTrigger id={`box-${index}-warehouse`}>
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
                <Label htmlFor={`box-${index}-location`}>Location</Label>
                <Select
                  value={box.location_id || ''}
                  onValueChange={(value) => updateBox(index, { location_id: value })}
                  disabled={!box.warehouse_id}
                >
                  <SelectTrigger id={`box-${index}-location`}>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouseLocations
                      .filter(loc => loc.warehouse_id === box.warehouse_id)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          Floor {location.floor}, Zone {location.zone}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`box-${index}-quantity`}>Quantity</Label>
                <Input
                  id={`box-${index}-quantity`}
                  type="number"
                  min="1"
                  value={box.quantity}
                  onChange={(e) => updateBox(index, { quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`box-${index}-barcode`}>Barcode</Label>
                <Input
                  id={`box-${index}-barcode`}
                  value={box.barcode || ''}
                  onChange={(e) => updateBox(index, { barcode: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`box-${index}-color`}>Color (Optional)</Label>
                <Input
                  id={`box-${index}-color`}
                  value={box.color || ''}
                  onChange={(e) => updateBox(index, { color: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`box-${index}-size`}>Size (Optional)</Label>
                <Input
                  id={`box-${index}-size`}
                  value={box.size || ''}
                  onChange={(e) => updateBox(index, { size: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={isContinueDisabled} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
