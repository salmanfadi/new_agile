import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StockIn, StockInDetails } from '@/types/stockin';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string | null;
}

interface Submitter {
  id: string;
  name?: string | null;
  username: string;
}

interface StockInWithDetails extends StockIn {
  details: StockInDetails[];
  product?: Product;
  submitter?: Submitter;
}

export const useStockInProcessing = () => {
  const fetchStockIn = async (): Promise<StockInWithDetails[]> => {
    try {
      const { data: stockIns, error } = await supabase
        .from('stock_in')
        .select(`
          *,
          products (
            id,
            name,
            sku,
            category
          ),
          profiles (
            id,
            name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock-in data:', error);
        throw error;
      }

      if (!stockIns) {
        console.warn('No stock-in data found.');
        return [];
      }

      const stockInWithDetails = await Promise.all(
        stockIns.map(async (stockIn) => {
          const { data: details, error: detailsError } = await supabase
            .from('stock_in_details')
            .select('*')
            .eq('stock_in_id', stockIn.id);

          if (detailsError) {
            console.error(`Error fetching details for stock-in ID ${stockIn.id}:`, detailsError);
            return mapStockInWithDetails(stockIn, []);
          }

          return mapStockInWithDetails(stockIn, details || []);
        })
      );

      return stockInWithDetails;
    } catch (error) {
      console.error('Failed to fetch stock-in data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch stock-in data.',
      });
      throw error;
    }
  };

  const mapStockInWithDetails = (stockIn: any, details: any[]) => {
    const stockInData: StockInWithDetails = {
      id: stockIn.id,
      created_at: stockIn.created_at,
      updated_at: stockIn.updated_at,
      product_id: stockIn.product_id,
      boxes: stockIn.boxes,
      source: stockIn.source,
      notes: stockIn.notes,
      submitted_by: stockIn.submitted_by,
      processed_by: stockIn.processed_by,
      rejection_reason: stockIn.rejection_reason,
      status: stockIn.status,
      details: details || [],
    };
    
    // Fix product and submitter parsing
    if (stockIn.products) {
      stockInData.product = {
        id: stockIn.products.id,
        name: stockIn.products.name,
        sku: stockIn.products.sku,
        category: stockIn.products.category,
      };
    }

    if (stockIn.profiles) {
      stockInData.submitter = {
        id: stockIn.profiles.id,
        name: stockIn.profiles.name,
        username: stockIn.profiles.username,
      };
    }

    return stockInData;
  };

  return useQuery({
    queryKey: ['stock-in'],
    queryFn: fetchStockIn,
  });
};
