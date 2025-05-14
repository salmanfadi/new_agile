
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InventoryLedgerItem } from '@/types/inventory';

interface LedgerFilters {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  minStock?: number;
  searchTerm?: string;
}

export const useInventoryLedger = (filters: LedgerFilters = {}) => {
  const fetchInventoryLedger = async () => {
    try {
      // Call the get_inventory_levels database function we created
      const { data, error } = await supabase.rpc('get_inventory_levels');
      
      if (error) {
        console.error('Error fetching inventory ledger:', error);
        throw error;
      }
      
      // Process and transform the data
      let ledgerItems = data as InventoryLedgerItem[];
      
      // Apply client-side filters
      if (filters.productId) {
        ledgerItems = ledgerItems.filter(item => item.product_id === filters.productId);
      }
      
      if (filters.warehouseId) {
        ledgerItems = ledgerItems.filter(item => item.warehouse_id === filters.warehouseId);
      }
      
      if (filters.locationId) {
        ledgerItems = ledgerItems.filter(item => item.location_id === filters.locationId);
      }
      
      if (filters.minStock !== undefined) {
        ledgerItems = ledgerItems.filter(item => item.stock_level >= filters.minStock);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        ledgerItems = ledgerItems.filter(item => 
          item.product_name.toLowerCase().includes(term) ||
          (item.product_sku && item.product_sku.toLowerCase().includes(term)) ||
          item.warehouse_name.toLowerCase().includes(term) ||
          item.location_name.toLowerCase().includes(term)
        );
      }
      
      return ledgerItems;
    } catch (error) {
      console.error('Failed to fetch inventory ledger:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch inventory data.',
      });
      throw error;
    }
  };
  
  return useQuery({
    queryKey: ['inventory-ledger', filters],
    queryFn: fetchInventoryLedger,
  });
};
