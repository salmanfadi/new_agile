
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Warehouse {
  id: string;
  name: string;
}

export interface Location {
  id: string;
  floor: number;
  zone: string;
  warehouse_id: string;
}

export const useWarehouseData = (selectedWarehouseId: string) => {
  // Fetch warehouses for the dropdown
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data as Warehouse[];
    },
  });

  // Fetch warehouse locations based on selected warehouse
  const { data: locations } = useQuery({
    queryKey: ['warehouse-locations', selectedWarehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', selectedWarehouseId)
        .order('floor')
        .order('zone');
        
      if (error) throw error;
      return data as Location[];
    },
    enabled: !!selectedWarehouseId,
  });

  return {
    warehouses,
    locations,
  };
};
