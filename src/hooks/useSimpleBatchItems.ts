
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SimpleBatchItem {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  warehouse_id: string;
  location_id: string;
  created_at: string;
  updated_at?: string;
}

export const useSimpleBatchItems = (batchId?: string) => {
  return useQuery({
    queryKey: ['simple-batch-items', batchId],
    queryFn: async (): Promise<SimpleBatchItem[]> => {
      if (!batchId) return [];
      
      console.log('Fetching simple batch items for batch:', batchId);
      
      const { data: items, error } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId);
      
      if (error) {
        console.error('Error fetching batch items:', error);
        throw error;
      }
      
      return items || [];
    },
    enabled: !!batchId
  });
};
