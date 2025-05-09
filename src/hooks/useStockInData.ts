
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
      
      // First, get the stock in record
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          product_id,
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

      if (error) {
        console.error("Error fetching stock in:", error);
        throw error;
      }
      
      if (!data) return null;
      
      // Fetch product information
      let product = { name: 'Unknown Product', id: null };
      if (data.product_id) {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, name')
          .eq('id', data.product_id)
          .single();
          
        if (!productError && productData) {
          product = productData;
        } else {
          console.error("Error fetching product:", productError);
        }
      }
      
      // Fetch submitter information from profiles table using name field
      let submitter = null;
      if (data.submitted_by) {
        console.log("Fetching submitter with ID:", data.submitted_by);
        
        try {
          // Directly query the profiles table for the user's name and username
          const { data: submitterData, error: submitterError } = await supabase
            .from('profiles')
            .select('id, name, username')
            .eq('id', data.submitted_by)
            .maybeSingle();
            
          if (!submitterError && submitterData) {
            // Use the name field from profiles table
            submitter = {
              id: submitterData.id,
              name: submitterData.name || 'Unknown User',
              username: submitterData.username
            };
            console.log("Found submitter with name:", submitter.name);
          } else {
            console.warn("Submitter profile not found:", submitterError);
            
            // Fallback option if profile not found
            submitter = { 
              id: data.submitted_by, 
              name: 'Unknown User',
              username: data.submitted_by.substring(0, 8) + '...'
            };
          }
        } catch (err) {
          console.error("Error while fetching submitter:", err);
          submitter = { 
            id: data.submitted_by, 
            name: 'Unknown User', 
            username: 'unknown'
          };
        }
      }
      
      // Construct the complete stockInData object
      const stockInDataObject = {
        id: data.id,
        product: product,
        submitter: submitter,
        boxes: data.boxes,
        status: data.status,
        created_at: data.created_at,
        source: data.source || 'Unknown Source',
        notes: data.notes,
        rejection_reason: data.rejection_reason
      };
      
      console.log("Final stock in data:", stockInDataObject);
      setStockInData(stockInDataObject);
      return stockInDataObject;
    },
    enabled: !!stockInId,
  });

  return {
    stockInData,
    isLoadingStockIn: isLoading,
  };
};
