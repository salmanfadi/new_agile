import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { WarehouseLocation } from '@/types/supabase';

export const useLocations = (warehouseId: string | null) => {
  return useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];

      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', warehouseId)
        .order('floor')
        .order('zone');
      
      if (error) throw error;
      return data as WarehouseLocation[];
    },
    enabled: !!warehouseId
  });
}; 