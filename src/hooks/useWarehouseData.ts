
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  id: string;
  name: string;
  description?: string;
  warehouse_id: string;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: string;
}

export const useWarehouseData = () => {
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async (): Promise<Warehouse[]> => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });

  const locationsQuery = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .order('zone');
      
      if (error) throw error;
      
      // Transform the data to match the Location interface
      return (data || []).map(item => ({
        id: item.id,
        name: `${item.zone}${item.floor ? ' - Floor ' + item.floor : ''}`,
        description: `Zone: ${item.zone}${item.floor ? ', Floor: ' + item.floor : ''}`,
        warehouse_id: item.warehouse_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
    }
  });

  return {
    warehouses: warehousesQuery.data || [],
    locations: locationsQuery.data || [],
    isLoadingWarehouses: warehousesQuery.isLoading,
    isLoadingLocations: locationsQuery.isLoading,
    warehousesError: warehousesQuery.error,
    locationsError: locationsQuery.error,
    refetchWarehouses: warehousesQuery.refetch,
    refetchLocations: locationsQuery.refetch
  };
};
