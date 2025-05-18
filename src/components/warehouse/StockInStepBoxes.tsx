
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BoxData } from '@/hooks/useStockInBoxes';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { WarehouseLocation } from '@/types/database';
import { DefaultWarehouseSelector } from './DefaultWarehouseSelector';
import { BoxesList } from './BoxesList';
import { NavigationButtons } from './NavigationButtons';

// Define a more specific type for the warehouse to match the database structure
interface Warehouse {
  id: string;
  name: string;
  location?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface StockInStepBoxesProps {
  stockIn: StockInRequestData;
  boxes: BoxData[];
  updateBox: (index: number, data: Partial<BoxData>) => void;
  onNext: () => void;
  onBack: () => void;
}

// Export the component as both default and named export
export function StockInStepBoxes({ stockIn, boxes, updateBox, onNext, onBack }: StockInStepBoxesProps) {
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseLocations, setWarehouseLocations] = useState<WarehouseLocation[]>([]);
  const [isContinueDisabled, setIsContinueDisabled] = useState(true);

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
      setSelectedWarehouse(warehouses[0]);
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
      <DefaultWarehouseSelector
        warehouses={warehouses}
        warehouseLocations={warehouseLocations}
        selectedWarehouse={selectedWarehouse}
        setSelectedWarehouse={setSelectedWarehouse}
        applyToAll={applyToAll}
        isLoadingWarehouses={isLoadingWarehouses}
      />
      
      <BoxesList
        boxes={boxes}
        updateBox={updateBox}
        warehouses={warehouses}
        warehouseLocations={warehouseLocations}
      />
      
      <NavigationButtons
        onBack={onBack}
        onNext={onNext}
        isContinueDisabled={isContinueDisabled}
      />
    </div>
  );
}

// Add default export pointing to the named export
export default StockInStepBoxes;
