
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WarehouseLocation } from '@/types/database';

export const useWarehouseLocations = (warehouseId?: string) => {
  return useQuery({
    queryKey: ['warehouse-locations', warehouseId],
    queryFn: async (): Promise<WarehouseLocation[]> => {
      let query = supabase
        .from('warehouse_locations')
        .select('*')
        .order('floor')
        .order('zone');
      
      // Filter by warehouseId if provided
      if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching warehouse locations:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: true, // Always fetch, but filter by warehouseId when provided
  });
};

export default useWarehouseLocations;
