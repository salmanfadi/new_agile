import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesInquiry } from '@/types/database';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export const useSalesInquiries = () => {
  const [inquiries, setInquiries] = useState<SalesInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_inquiries')
        .select(`
          *,
          items:sales_inquiry_items(
            *,
            product:product_id(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Make sure we're setting data as SalesInquiry[]
      setInquiries(data as SalesInquiry[] || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('sales_inquiries_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_inquiries' },
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

  const convertInquiryToOrder = async (inquiry: SalesInquiry) => {
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
        .from('sales_inquiries')
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
        .from('sales_inquiries')
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
