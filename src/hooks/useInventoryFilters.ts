
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useInventoryFilters = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Reset filters if URL changes
  useEffect(() => {
    console.log('Initializing inventory filters');
    
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
      try {
        const { data, error } = await supabase
          .from('stock_in')
          .select('id, created_at, source, status')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching batch IDs:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} batch IDs`);
        
        // Map the data to include formatted dates for better readability
        const formattedData = data?.map(batch => ({
          id: batch.id,
          formattedDate: new Date(batch.created_at).toLocaleDateString(),
          displayDate: new Date(batch.created_at).toLocaleDateString('en-US', { 
            month: '2-digit', 
            day: '2-digit', 
            year: 'numeric' 
          }),
          source: batch.source || 'Unknown Source',
          status: batch.status,
          created_at: batch.created_at
        })) || [];
        
        console.log('Formatted batch data:', formattedData.slice(0, 3)); // Log a sample to debug
        
        return formattedData;
      } catch (error) {
        console.error('Failed to fetch batch data:', error);
        toast({
          title: 'Error',
          description: 'Could not load batch filter data',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

  // Fetch warehouses for filter
  const warehousesQuery = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      console.log('Fetching warehouses for filter');
      try {
        const { data, error } = await supabase
          .from('warehouses')
          .select('*')
          .order('name', { ascending: true });
          
        if (error) {
          console.error('Error fetching warehouses:', error);
          throw error;
        }
        
        console.log(`Found ${data?.length || 0} warehouses`);
        return data || [];
      } catch (error) {
        console.error('Failed to fetch warehouse data:', error);
        toast({
          title: 'Error',
          description: 'Could not load warehouse filter data',
          variant: 'destructive'
        });
        return [];
      }
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
    isLoadingBatches: batchIdsQuery.isLoading,
    isLoadingWarehouses: warehousesQuery.isLoading,
    availableStatuses,
    isLoading: warehousesQuery.isLoading || batchIdsQuery.isLoading
  };
};
