
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
      // Use the existing get_inventory_summary function instead
      const { data, error } = await supabase.rpc('get_inventory_summary');
      
      if (error) {
        console.error('Error fetching inventory ledger:', error);
        throw error;
      }
      
      // Transform the data to match InventoryLedgerItem interface
      let ledgerItems: InventoryLedgerItem[] = (data || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name || 'Unknown Product',
        product_sku: item.product_sku || '',
        warehouse_id: 'default', // Since summary doesn't have warehouse info
        warehouse_name: 'All Warehouses',
        location_id: 'default',
        location_name: 'All Locations',
        stock_level: item.total_quantity || 0,
        last_updated: item.last_updated || new Date().toISOString(),
      }));
      
      // Apply client-side filters
      if (filters.productId) {
        ledgerItems = ledgerItems.filter(item => item.product_id === filters.productId);
      }
      
      if (filters.minStock !== undefined) {
        ledgerItems = ledgerItems.filter(item => item.stock_level >= filters.minStock);
      }
      
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        ledgerItems = ledgerItems.filter(item => 
          item.product_name.toLowerCase().includes(term) ||
          (item.product_sku && item.product_sku.toLowerCase().includes(term))
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
