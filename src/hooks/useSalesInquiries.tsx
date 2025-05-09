
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesInquiry } from '@/types/database';

// Define a type for valid status values
export type InquiryStatus = 'new' | 'in_progress' | 'completed';

export const useSalesInquiries = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);

  // Fetch sales inquiries
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['sales-inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_inquiries')
        .select(`
          *,
          items:sales_inquiry_items(
            *,
            product:product_id(name, description)
          )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data as SalesInquiry[];
    },
  });

  // Filter inquiries based on search term and status filter
  const filteredInquiries = useMemo(() => {
    if (!inquiries) return [];
    
    return inquiries.filter(inquiry => {
      const matchesSearch = !searchTerm || 
        inquiry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.customer_company.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = !statusFilter || inquiry.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, statusFilter]);

  // Handle status change
  const updateInquiryStatus = async (id: string, status: InquiryStatus) => {
    const { error } = await supabase
      .from('sales_inquiries')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return;
    }

    // Update the local state
    if (selectedInquiry && selectedInquiry.id === id) {
      setSelectedInquiry({
        ...selectedInquiry,
        status: status
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return {
    inquiries: filteredInquiries,
    isLoading,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    selectedInquiry,
    setSelectedInquiry,
    updateInquiryStatus,
    formatDate
  };
};
