import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
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
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load orders'
        });
        throw error;
      }

      return data as Order[];
    }
  });
} 