
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInventoryFilters = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Reset filters if URL changes
  useEffect(() => {
    // Listen for route changes, then clear filters when on a new page
    return () => {
      // No cleanup needed in this case
    };
  }, []);

  // Fetch batch IDs for filter with more details
  const batchIdsQuery = useQuery({
    queryKey: ['batch-ids'],
    queryFn: async () => {
      console.log('Fetching batch IDs for filter');
      const { data, error } = await supabase
        .from('stock_in')
        .select('id, created_at, source, status')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching batch IDs:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} batch IDs`);
      
      // Map the data to include formatted dates for better readability
      return data?.map(batch => ({
        ...batch,
        formattedDate: new Date(batch.created_at).toLocaleDateString()
      })) || [];
    }
  });

  // Fetch warehouses for filter
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      console.log('Fetching warehouses for filter');
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) {
        console.error('Error fetching warehouses:', error);
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} warehouses`);
      return data;
    }
  });

  // Define available statuses for inventory items
  const availableStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'sold', label: 'Sold' },
    { value: 'damaged', label: 'Damaged' }
  ];

  // Reset all filters
  const resetFilters = () => {
    console.log('Resetting all filters');
    setSearchTerm('');
    setWarehouseFilter('');
    setBatchFilter('');
    setStatusFilter('');
  };

  return {
    filters: {
      searchTerm,
      warehouseFilter,
      batchFilter,
      statusFilter
    },
    setSearchTerm,
    setWarehouseFilter,
    setBatchFilter,
    setStatusFilter,
    resetFilters,
    warehouses: warehousesQuery.data || [],
    batchIds: batchIdsQuery.data || [],
    availableStatuses,
    isLoading: warehousesQuery.isLoading || batchIdsQuery.isLoading
  };
};
