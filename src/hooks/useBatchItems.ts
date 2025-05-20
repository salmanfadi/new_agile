
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BatchItem } from '@/components/warehouse/BatchItemsTable';

export const useBatchItems = (batchId?: string) => {
  return useQuery({
    queryKey: ['batch-items', batchId],
    queryFn: async (): Promise<BatchItem[]> => {
      if (!batchId) return [];

      try {
        const { data, error } = await supabase
          .from('batch_items')
          .select(`
            *,
            warehouses (
              name
            ),
            warehouse_locations (
              floor,
              zone
            )
          `)
          .eq('batch_id', batchId);

        if (error) {
          console.error('Error fetching batch items:', error);
          throw new Error(error.message);
        }

        return (data || []).map(item => {
          // Extract warehouse name safely
          const warehouseName = item.warehouses?.name || 'Unknown Warehouse';
          
          // Extract location details safely
          let locationDetails = 'Unknown Location';
          if (item.warehouse_locations) {
            const floor = item.warehouse_locations.floor;
            const zone = item.warehouse_locations.zone;
            if (floor !== undefined && zone !== undefined) {
              locationDetails = `Floor ${floor}, Zone ${zone}`;
            }
          }
          
          return {
            id: item.id,
            batch_id: item.batch_id,
            barcode: item.barcode,
            quantity: item.quantity,
            color: item.color || undefined,
            size: item.size || undefined,
            warehouse_id: item.warehouse_id,
            warehouseName,
            location_id: item.location_id,
            locationDetails,
            status: item.status || 'available',
            created_at: item.created_at || new Date().toISOString()
          };
        });
      } catch (err) {
        console.error('Error in useBatchItems:', err);
        throw err;
      }
    },
    enabled: !!batchId
  });
};
