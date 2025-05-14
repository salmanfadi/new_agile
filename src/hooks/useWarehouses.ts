import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Warehouse } from '@/types/supabase';

export const useWarehouses = () => {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Warehouse[];
    }
  });
};
