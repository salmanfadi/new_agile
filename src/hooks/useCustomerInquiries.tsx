import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CustomerInquiry } from '@/types/database';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';

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
      // First verify Supabase connection
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      const { data, error } = await supabase
        .from('customer_inquiries')
        .select(`
          *,
          items:customer_inquiry_items(
            *,
            product:product_id(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('No data received from Supabase');
      }

      // Make sure we're setting data as CustomerInquiry[]
      setInquiries(data as CustomerInquiry[] || []);
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
    
    // Set up real-time subscription
    const channel = supabase
      .channel('customer_inquiries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customer_inquiries' },
        (payload) => {
          // Refresh the list when there's a change
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
      console.log('Converting inquiry to order:', inquiry); // Debug log

      // First, validate that we have all required information
      if (!inquiry.items || inquiry.items.length === 0) {
        throw new Error('Inquiry has no items');
      }

      // Create the order entry
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: inquiry.customer_name,
          customer_email: inquiry.customer_email,
          customer_company: inquiry.customer_company || '',
          customer_phone: inquiry.customer_phone || '',
          inquiry_id: inquiry.id,
          status: 'pending',
          order_date: new Date().toISOString(),
          total_amount: inquiry.items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0),
          items: inquiry.items.map(item => ({
            product_id: item.product_id,
            product_name: item.product?.name || 'Unknown Product',
            quantity: item.quantity,
            requirements: item.specific_requirements || ''
          }))
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      // Update the inquiry to mark it as converted
      const { error: updateError } = await supabase
        .from('customer_inquiries')
        .update({
          status: 'completed',
          converted_to_order: true,
          order_id: order.id
        })
        .eq('id', inquiry.id);

      if (updateError) {
        console.error('Error updating inquiry:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Inquiry has been converted to an order successfully",
      });

      return true;
    } catch (error) {
      console.error('Error in convertInquiryToOrder:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to convert inquiry to order. Please try again.",
      });
      return false;
    }
  };

  const updateInquiryStatus = async (id: string, status: 'new' | 'in_progress' | 'completed') => {
    try {
      // If status is being set to completed, first convert to order
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

      // Update local state
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
        // Create the stock out request
        const { data: stockOut, error } = await supabase
          .from('stock_out')
          .insert({
            product_id: data.productId,
            quantity: data.quantity,
            destination: data.destination,
            notes: data.notes,
            priority: data.priority || 'normal',
            required_date: data.requiredDate,
            status: 'pending', // Initial status for warehouse manager review
          })
          .select()
          .single();

        if (error) throw error;

        // Invalidate queries to refresh the lists
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
