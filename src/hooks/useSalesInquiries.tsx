
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesInquiry } from '@/types/database';
import { format } from 'date-fns';

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

  const updateInquiryStatus = async (id: string, status: 'new' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('sales_inquiries')
        .update({ status })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setInquiries(prevInquiries =>
        prevInquiries.map(inquiry =>
          inquiry.id === id ? { ...inquiry, status } : inquiry
        )
      );

      // If the currently selected inquiry was updated, update it as well
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status });
      }

      return true;
    } catch (error) {
      console.error('Error updating inquiry status:', error);
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
