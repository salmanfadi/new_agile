
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SalesOrderItem {
  id?: string;
  product_id: string;
  quantity: number;
  requirements?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
    hsn_code?: string;
    gst_rate?: number;
  };
}

export interface SalesOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_phone?: string;
  sales_order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'completed' | 'cancelled';
  order_date: string;
  total_amount: number;
  inquiry_id?: string;
  pushed_to_stockout?: boolean;
  stockout_id?: string;
  items: SalesOrderItem[];
  created_at: string;
  updated_at: string;
}

export const useSalesOrders = () => {
  const queryClient = useQueryClient();

  const { data: salesOrders = [], isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_orders')
        .select(`
          *,
          items:sales_order_items(
            *,
            product:products(
              id,
              name,
              sku,
              hsn_code,
              gst_rate
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SalesOrder[];
    },
  });

  const createSalesOrder = useMutation({
    mutationFn: async (orderData: Omit<SalesOrder, 'id' | 'created_at' | 'updated_at' | 'sales_order_number'>) => {
      // Generate sales order number
      const salesOrderNumber = `SO-${Date.now()}`;
      
      const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          customer_company: orderData.customer_company,
          customer_phone: orderData.customer_phone,
          sales_order_number: salesOrderNumber,
          status: orderData.status,
          order_date: orderData.order_date,
          total_amount: orderData.total_amount,
          inquiry_id: orderData.inquiry_id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items if any
      if (orderData.items && orderData.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('sales_order_items')
          .insert(
            orderData.items.map(item => ({
              sales_order_id: order.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: 0, // Set to 0 since price is not collected
              requirements: item.requirements,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // Also invalidate orders query
      toast({
        title: 'Success',
        description: 'Sales order created successfully',
      });
    },
    onError: (error) => {
      console.error('Sales order creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create sales order',
      });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SalesOrder['status'] }) => {
      const { error } = await supabase
        .from('sales_orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      toast({
        title: 'Success',
        description: 'Order status updated successfully',
      });
    },
  });

  const pushToStockOut = useMutation({
    mutationFn: async (salesOrder: SalesOrder) => {
      // Create stock-out request
      const { data: stockOutRequest, error: stockOutError } = await supabase
        .from('stock_out')
        .insert({
          sales_order_id: salesOrder.id,
          customer_name: salesOrder.customer_name,
          customer_email: salesOrder.customer_email,
          customer_company: salesOrder.customer_company,
          customer_phone: salesOrder.customer_phone,
          destination: `${salesOrder.customer_company} - ${salesOrder.customer_name}`,
          notes: `Stock-out request for Sales Order: ${salesOrder.sales_order_number}`,
          status: 'from_sales_order',
        })
        .select()
        .single();

      if (stockOutError) throw stockOutError;

      // Create stock-out details for each item
      const stockOutDetails = salesOrder.items.map(item => ({
        stock_out_id: stockOutRequest.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const { error: detailsError } = await supabase
        .from('stock_out_details')
        .insert(stockOutDetails);

      if (detailsError) throw detailsError;

      // Update sales order to mark as pushed to stock-out
      const { error: updateError } = await supabase
        .from('sales_orders')
        .update({
          pushed_to_stockout: true,
          stockout_id: stockOutRequest.id,
          status: 'processing'
        })
        .eq('id', salesOrder.id);

      if (updateError) throw updateError;

      return stockOutRequest;
    },
    onSuccess: (stockOutRequest, salesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Success',
        description: `Sales Order ${salesOrder.sales_order_number} pushed to stock-out successfully`,
      });
    },
    onError: (error) => {
      console.error('Push to stock-out error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to push order to stock-out',
      });
    },
  });

  return {
    salesOrders,
    isLoading,
    createSalesOrder,
    updateOrderStatus,
    pushToStockOut,
  };
};
