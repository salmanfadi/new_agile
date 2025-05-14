
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Location {
  id: string;
  warehouse_id: string;
  floor: number;
  zone: string;
  created_at: string;
  updated_at: string;
}

export const useLocations = (warehouseId: string) => {
  const fetchLocations = async (): Promise<Location[]> => {
    if (!warehouseId) return [];
    
    const { data, error } = await supabase
      .from('warehouse_locations')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('floor', { ascending: true })
      .order('zone', { ascending: true });
    
    if (error) throw error;
    return data as Location[];
  };
  
  const locationsQuery = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: fetchLocations,
    enabled: !!warehouseId
  });
  
  return {
    locations: locationsQuery.data || [],
    isLoading: locationsQuery.isLoading,
    error: locationsQuery.error,
    refetch: locationsQuery.refetch
  };
};
