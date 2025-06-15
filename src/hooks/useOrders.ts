
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  requirements: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_phone: string;
  inquiry_id: string;
  status: string;
  order_date: string;
  total_amount: number;
  items: OrderItem[];
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      // Since 'orders' table doesn't exist, return empty array or use stock_out as orders
      console.log('Orders table not found, returning empty array');
      
      // Alternative: Use stock_out as order data
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          id,
          destination,
          notes,
          created_at,
          status,
          requested_by,
          stock_out_details (
            quantity,
            product_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stock out data:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load order data'
        });
        throw error;
      }

      // Transform stock_out data to match Order interface
      return (data || []).map((stockOut: any) => ({
        id: stockOut.id,
        customer_name: stockOut.destination || 'Unknown Customer',
        customer_email: 'unknown@example.com',
        customer_company: stockOut.destination || 'Unknown Company',
        customer_phone: 'Unknown',
        inquiry_id: stockOut.id,
        status: stockOut.status || 'pending',
        order_date: stockOut.created_at,
        total_amount: 0,
        items: (stockOut.stock_out_details || []).map((detail: any) => ({
          product_id: detail.product_id,
          product_name: 'Unknown Product',
          quantity: detail.quantity,
          requirements: stockOut.notes || ''
        }))
      }));
    }
  });
}
