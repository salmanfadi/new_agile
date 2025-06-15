
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CustomerInquiry } from '@/types/inquiries';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export const useCustomerInquiries = () => {
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      const { data, error } = await supabase
        .from('customer_inquiries')
        .select(`
          *,
          items:customer_inquiry_items(
            *,
            product:products(
              id,
              name,
              sku,
              description,
              hsn_code,
              gst_rate,
              created_at,
              updated_at,
              category,
              barcode,
              unit,
              min_stock_level,
              is_active,
              gst_category,
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transform the data to match CustomerInquiry type
      const transformedData = (data || []).map(inquiry => ({
        ...inquiry,
        items: inquiry.items?.map(item => ({
          ...item,
          product: item.product ? {
            ...item.product,
            image_url: item.product.image_url || null
          } : null
        })) || []
      }));

      setInquiries(transformedData as CustomerInquiry[]);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch inquiries';
      console.error('Error fetching inquiries:', error);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error Loading Inquiries",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    
    const channel = supabase
      .channel('customer_inquiries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_inquiries' },
        (payload) => {
          fetchInquiries();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const convertInquiryToOrder = async (inquiry: CustomerInquiry) => {
    try {
      console.log('Converting inquiry to sales order:', inquiry);

      if (!inquiry.items || inquiry.items.length === 0) {
        throw new Error('Inquiry has no items');
      }

      // Generate sales order number
      const salesOrderNumber = `SO-${Date.now()}`;

      // Create sales order
      const { data: salesOrder, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
          customer_name: inquiry.customer_name,
          customer_email: inquiry.customer_email,
          customer_company: inquiry.customer_company,
          customer_phone: inquiry.customer_phone,
          sales_order_number: salesOrderNumber,
          status: 'pending',
          order_date: new Date().toISOString(),
          total_amount: 0, // Will be updated when pricing is added
          inquiry_id: inquiry.id,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating sales order:', orderError);
        throw orderError;
      }

      // Create sales order items
      const orderItems = inquiry.items.map(item => ({
        sales_order_id: salesOrder.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: 0, // Set to 0 since pricing is not collected
        requirements: item.specific_requirements,
      }));

      const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating sales order items:', itemsError);
        throw itemsError;
      }

      // Update inquiry status to completed
      const { error: updateError } = await supabase
        .from('customer_inquiries')
        .update({
          status: 'completed',
          converted_to_order: true,
        })
        .eq('id', inquiry.id);

      if (updateError) {
        console.error('Error updating inquiry:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: `Inquiry converted to Sales Order ${salesOrderNumber}`,
      });

      return true;
    } catch (error) {
      console.error('Error in convertInquiryToOrder:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to convert inquiry to sales order. Please try again.",
      });
      return false;
    }
  };

  const updateInquiryStatus = async (id: string, status: 'new' | 'in_progress' | 'completed') => {
    try {
      if (status === 'completed') {
        const inquiry = inquiries.find(inq => inq.id === id);
        if (!inquiry) throw new Error('Inquiry not found');
        
        const success = await convertInquiryToOrder(inquiry);
        if (!success) throw new Error('Failed to convert inquiry to order');
      }

      const { error } = await supabase
        .from('customer_inquiries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setInquiries(prevInquiries =>
        prevInquiries.map(inquiry =>
          inquiry.id === id ? { ...inquiry, status } : inquiry
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating inquiry status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update inquiry status",
      });
      return false;
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  const refreshInquiries = () => {
    fetchInquiries();
  };

  return {
    inquiries,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedInquiry,
    setSelectedInquiry,
    updateInquiryStatus,
    convertInquiryToOrder,
    formatDate,
    refreshInquiries
  };
};

interface StockOutSubmission {
  productId: string;
  quantity: number;
  destination: string;
  notes?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requiredDate?: string;
}

export const useStockOutSubmission = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const submitStockOut = useMutation({
    mutationFn: async (data: StockOutSubmission) => {
      setIsLoading(true);
      try {
        const { data: stockOut, error } = await supabase
          .from('stock_out')
          .insert({
            destination: data.destination,
            notes: data.notes,
            status: 'pending',
          })
          .select()
          .single();

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
        
        return stockOut;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Stock out request has been submitted for approval',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit stock out request',
        variant: 'destructive',
      });
    },
  });

  return {
    submitStockOut,
    isLoading,
  };
};
