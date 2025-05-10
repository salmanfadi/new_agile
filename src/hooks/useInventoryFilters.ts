
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useInventoryFilters = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Fetch batch IDs for filter
  const batchIdsQuery = useQuery({
    queryKey: ['batch-ids'],
    queryFn: async () => {
      console.log('Fetching batch IDs for filter');
      const { data, error } = await supabase
        .from('stock_in')
        .select('id, created_at, source')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching batch IDs:', error);
        return [];
      }
      
      console.log(`Found ${data?.length || 0} batch IDs`);
      return data;
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
