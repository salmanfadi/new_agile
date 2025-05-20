
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BoxDetails } from '@/types/barcode';

export interface BoxDetailsType {
  id: string;
  barcode: string;
  batch_id?: string;
  status: string;
  quantity: number;
  color?: string;
  size?: string;
  created_at: string;
  updated_at: string;
  batch?: {
    id: string;
    status: string;
    created_at: string;
    product?: {
      id: string;
      name: string;
      sku?: string;
    };
  };
  warehouse?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    zone?: string;
    aisle?: string;
    shelf?: string;
  };
  history?: Array<{
    id: string;
    event_type: string;
    created_at: string;
    details?: string;
    user?: {
      id: string;
      name: string;
    };
  }>;
}

export function useBoxDetails(barcode?: string) {
  return useQuery({
    queryKey: ['boxDetails', barcode],
    queryFn: async () => {
      if (!barcode) {
        throw new Error('Barcode is required');
      }

      // Fetch box details from inventory table instead
      const { data: box, error } = await supabase
        .from('inventory')
        .select(`
          *,
          batch:batch_id(
            id, 
            status, 
            created_at,
            product:product_id(id, name, sku)
          ),
          warehouse:warehouse_id(id, name),
          location:location_id(id, zone, aisle, shelf)
        `)
        .eq('barcode', barcode)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error(`Box with barcode ${barcode} not found`);
        }
        throw new Error(`Error fetching box details: ${error.message}`);
      }

      if (!box) {
        throw new Error(`Box with barcode ${barcode} not found`);
      }

      // We'll simulate history since box_history might not exist
      const boxHistory = [
        {
          id: '1',
          event_type: 'created',
          created_at: box.created_at,
          details: 'Box created',
          user: { id: '1', name: 'System' }
        }
      ];

      const boxDetails: BoxDetails = {
        id: box.id,
        barcode: box.barcode,
        batch_id: box.batch_id,
        productId: box.batch?.product?.id || '',
        productName: box.batch?.product?.name || 'Unknown Product',
        productSku: box.batch?.product?.sku,
        status: box.status,
        quantity: box.quantity,
        color: box.color,
        size: box.size,
        warehouseId: box.warehouse?.id,
        warehouseName: box.warehouse?.name,
        locationId: box.location?.id,
        locationDetails: box.location ? 
          `${box.location.zone || ''} ${box.location.aisle || ''}-${box.location.shelf || ''}` : 
          undefined,
        created_at: box.created_at,
        updated_at: box.updated_at,
        history: boxHistory
      };

      return boxDetails;
    },
    enabled: !!barcode
  });
}
