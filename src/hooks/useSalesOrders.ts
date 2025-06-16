
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
      // First check if the order is already pushed to stock-out to prevent duplicates
      const { data: existingOrder, error: checkError } = await supabase
        .from('sales_orders')
        .select('pushed_to_stockout, stockout_id')
        .eq('id', salesOrder.id)
        .single();
      
      if (checkError) {
        throw new Error(`Failed to check order status: ${checkError.message}`);
      }
      
      if (existingOrder?.pushed_to_stockout) {
        // Order already pushed to stock-out, return existing stockout_id
        const { data: existingStockOut, error: fetchError } = await supabase
          .from('stock_out')
          .select('*')
          .eq('id', existingOrder.stockout_id)
          .single();
          
        if (fetchError) {
          throw new Error(`Order marked as pushed to stock-out but failed to fetch stock-out details: ${fetchError.message}`);
        }
        
        return existingStockOut;
      }

      // Start a transaction using RPC function
      // Note: This assumes you have a stored procedure in Supabase for transaction handling
      // If not available, we'll use the sequential approach with better error handling
      try {
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
            status: 'pending',
          })
          .select()
          .single();

        if (stockOutError) {
          throw new Error(`Failed to create stock-out request: ${stockOutError.message}`);
        }

        // Create stock-out details for each item
        const stockOutDetails = salesOrder.items.map(item => ({
          stock_out_id: stockOutRequest.id,
          product_id: item.product_id,
          quantity: item.quantity,
        }));

        const { error: detailsError } = await supabase
          .from('stock_out_details')
          .insert(stockOutDetails);

        if (detailsError) {
          // Attempt to clean up the stock-out request if details insertion fails
          await supabase.from('stock_out').delete().eq('id', stockOutRequest.id);
          throw new Error(`Failed to create stock-out details: ${detailsError.message}`);
        }

        // Update sales order to mark as pushed to stock-out
        const { error: updateError } = await supabase
          .from('sales_orders')
          .update({
            pushed_to_stockout: true,
            stockout_id: stockOutRequest.id,
            status: 'processing'
          })
          .eq('id', salesOrder.id);

        if (updateError) {
          // Attempt to clean up if update fails
          await supabase.from('stock_out_details').delete().eq('stock_out_id', stockOutRequest.id);
          await supabase.from('stock_out').delete().eq('id', stockOutRequest.id);
          throw new Error(`Failed to update sales order: ${updateError.message}`);
        }

        return stockOutRequest;
      } catch (error) {
        // Re-throw the error to be handled by onError
        throw error;
      }
    },
    onSuccess: (stockOutRequest, salesOrder) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Success',
        description: `Sales Order ${salesOrder.sales_order_number} pushed to stock-out successfully`,
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      console.error('Push to stock-out error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to push order to stock-out',
        duration: 7000,
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
