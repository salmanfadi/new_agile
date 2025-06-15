
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchItemDisplay } from '@/components/warehouse/BatchItemsTable';

export const useBatchItems = (batchId?: string) => {
  return useQuery({
    queryKey: ['batch-items', batchId],
    queryFn: async (): Promise<BatchItemDisplay[]> => {
      if (!batchId) return [];
      
      console.log('Fetching batch items for batch:', batchId);
      
      // First get the batch items
      const { data: items, error: itemsError } = await supabase
        .from('batch_items')
        .select('*')
        .eq('batch_id', batchId);
      
      if (itemsError) {
        console.error('Error fetching batch items:', itemsError);
        throw itemsError;
      }
      
      if (!items || items.length === 0) {
        return [];
      }
      
      // Get unique warehouse IDs
      const warehouseIds = [...new Set(items.map(item => item.warehouse_id).filter(Boolean))];
      const locationIds = [...new Set(items.map(item => item.location_id).filter(Boolean))];
      
      // Fetch warehouses separately
      let warehouses: any[] = [];
      if (warehouseIds.length > 0) {
        const { data: warehouseData, error: warehouseError } = await supabase
          .from('warehouses')
          .select('id, name')
          .in('id', warehouseIds);
        
        if (warehouseError) {
          console.error('Error fetching warehouses:', warehouseError);
        } else {
          warehouses = warehouseData || [];
        }
      }
      
      // Fetch locations separately
      let locations: any[] = [];
      if (locationIds.length > 0) {
        const { data: locationData, error: locationError } = await supabase
          .from('warehouse_locations')
          .select('id, zone, floor')
          .in('id', locationIds);
        
        if (locationError) {
          console.error('Error fetching locations:', locationError);
        } else {
          locations = locationData || [];
        }
      }
      
      // Create lookup maps
      const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
      const locationMap = new Map(locations.map(l => [l.id, l]));
      
      // Combine the data
      return items.map(item => {
        const warehouse = warehouseMap.get(item.warehouse_id);
        const location = locationMap.get(item.location_id);
        
        return {
          ...item,
          warehouse,
          location,
          warehouseName: warehouse?.name || 'Unknown Warehouse',
          locationDetails: location ? `Floor ${location.floor} - Zone ${location.zone}` : 'Unknown Location'
        } as BatchItemDisplay;
      });
    },
    enabled: !!batchId
  });
};
