
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockInData } from '@/hooks/useStockInBoxes';

export const useStockInData = (stockInId: string | undefined) => {
  const [stockInData, setStockInData] = useState<StockInData | null>(null);

  const { isLoading } = useQuery({
    queryKey: ['stock-in', stockInId],
    queryFn: async () => {
      if (!stockInId) return null;
      
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(id, name),
          submitted_by,
          boxes,
          status,
          created_at,
          source,
          notes,
          rejection_reason
        `)
        .eq('id', stockInId)
        .single();

      if (error) throw error;
      
      // Fetch submitter information separately to avoid the relationship error
      let submitter = null;
      if (data && data.submitted_by) {
        const { data: submitterData, error: submitterError } = await supabase
          .from('profiles')
          .select('id, name, username')
          .eq('id', data.submitted_by)
          .single();
          
        if (!submitterError && submitterData) {
          submitter = submitterData;
        } else {
          submitter = { name: 'Unknown', username: 'unknown' };
        }
      }
      
      if (data) {
        const stockInDataObject = {
          id: data.id,
          product: data.product || { name: 'Unknown Product' },
          submitter: submitter,
          boxes: data.boxes,
          status: data.status,
          created_at: data.created_at,
          source: data.source || 'Unknown Source',
          notes: data.notes,
          rejection_reason: data.rejection_reason
        };
        
        setStockInData(stockInDataObject);
        return stockInDataObject;
      }
      
      return null;
    },
    enabled: !!stockInId,
  });

  return {
    stockInData,
    isLoadingStockIn: isLoading,
  };
};
