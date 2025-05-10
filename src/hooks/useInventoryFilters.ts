
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
      const { data, error } = await supabase
        .from('stock_in')
        .select('id')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching batch IDs:', error);
        return [];
      }
      
      return data.map(d => d.id);
    }
  });

  // Fetch warehouses for filter
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*');
        
      if (error) throw error;
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
    warehouses: warehousesQuery.data || [],
    batchIds: batchIdsQuery.data || [],
    availableStatuses,
    isLoading: warehousesQuery.isLoading || batchIdsQuery.isLoading
  };
};
