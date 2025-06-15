
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SalesInquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_phone?: string | null;
  message?: string | null;
  status: 'new' | 'in_progress' | 'completed';
  created_at: string;
  updated_at?: string;
  converted_to_order?: boolean;
  inquiry_details?: any;
  items?: Array<{
    id: string;
    inquiry_id: string;
    product_id: string;
    quantity: number;
    specific_requirements?: string | null;
    product?: {
      id: string;
      name: string;
      description?: string | null;
    };
  }>;
}

export const useSalesInquiries = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);

  // Fetch inquiries
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['sales-inquiries', searchTerm, statusFilter],
    queryFn: async () => {
      // Since sales_inquiries table doesn't exist yet, return mock data
      return [] as SalesInquiry[];
    },
  });

  // Update inquiry status
  const updateInquiryStatus = async (id: string, status: 'new' | 'in_progress' | 'completed'): Promise<boolean> => {
    try {
      // Mock implementation - replace with actual API call when table exists
      toast({
        title: 'Status Updated',
        description: `Inquiry status updated to ${status}`,
      });
      return true;
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update inquiry status',
      });
      return false;
    }
  };

  const refreshInquiries = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-inquiries'] });
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
    refreshInquiries
  };
};
