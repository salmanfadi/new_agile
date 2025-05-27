import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Location {
  id: string;
  warehouse_id: string;
  zone: string;
  floor: string;
  created_at: string;
}

export const useLocations = (warehouseId: string) => {
  const fetchLocations = async (): Promise<Location[]> => {
    if (!warehouseId) {
      console.log('No warehouse ID provided to useLocations');
      return [];
    }
    
    console.log('Fetching locations for warehouse:', warehouseId);
    const { data, error } = await supabase
      .from('warehouse_locations')
      .select('*')
      .eq('warehouse_id', warehouseId)
      .order('zone')
      .order('floor');
    
    if (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
    
    console.log('Successfully fetched locations:', data);
    return data as Location[];
  };
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['locations', warehouseId],
    queryFn: fetchLocations,
    enabled: !!warehouseId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
  
  return {
    locations: data || [],
    isLoading,
    error
  };
};
