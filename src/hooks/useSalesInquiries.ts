
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SalesInquiry } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export const useSalesInquiries = () => {
  const [inquiries, setInquiries] = useState<SalesInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'in_progress' | 'completed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<SalesInquiry | null>(null);

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      // For now, return mock data since customer_inquiries table structure might be different
      setInquiries([]);
    } catch (error: any) {
      console.error('Error fetching inquiries:', error);
      toast({
        variant: "destructive",
        title: "Error Loading Inquiries",
        description: error.message || 'Failed to fetch inquiries'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateInquiryStatus = async (id: string, status: 'new' | 'in_progress' | 'completed') => {
    try {
      // Mock implementation for now
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
    refreshInquiries
  };
};
