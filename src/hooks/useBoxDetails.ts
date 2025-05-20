
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BoxDetails, ScanHistoryItem, StatusHistoryItem } from '@/components/warehouse/BoxDetailsView';

export interface BoxDetailsResult {
  data: BoxDetails | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch detailed information about a specific box/inventory item
 */
export const useBoxDetails = (barcode: string | null): BoxDetailsResult => {
  const fetchBoxDetails = async (): Promise<BoxDetails | null> => {
    if (!barcode) return null;
    
    try {
      // First, get the inventory item with all its relations
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          id,
          barcode,
          product_id,
          warehouse_id,
          location_id,
          quantity,
          color,
          size,
          status,
          batch_id,
          created_at,
          updated_at,
          products:product_id (
            name,
            sku
          ),
          warehouses:warehouse_id (
            name
          ),
          warehouse_locations:location_id (
            floor,
            zone
          )
        `)
        .eq('barcode', barcode)
        .single();
      
      if (inventoryError) throw inventoryError;
      if (!inventoryData) return null;
      
      // Next, get scan history (from inventory_movements table)
      const { data: movementsData } = await supabase
        .from('inventory_movements')
        .select(`
          id,
          created_at,
          movement_type,
          quantity,
          status,
          details,
          profiles:performed_by (
            name,
            role
          ),
          warehouses:warehouse_id (
            name
          )
        `)
        .eq('details->barcode', barcode)
        .order('created_at', { ascending: false });
      
      // Format scan history
      const scanHistory: ScanHistoryItem[] = (movementsData || []).map(movement => {
        const actionMap: Record<string, string> = {
          'in': 'Box Added to Inventory',
          'out': 'Box Removed from Inventory',
          'transfer': 'Box Transferred',
          'adjustment': 'Box Scanned',
          'reserve': 'Box Reserved',
          'release': 'Box Released from Reservation'
        };
        
        return {
          id: movement.id,
          timestamp: movement.created_at,
          action: actionMap[movement.movement_type] || `${movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)} Action`,
          location: movement.warehouses?.name,
          user: movement.profiles ? {
            name: movement.profiles.name,
            role: movement.profiles.role
          } : undefined,
          details: movement.details?.notes
        };
      });
      
      // For demo purposes, create a basic status history
      // In a real implementation, you'd fetch this from a status_history table
      const statusHistory: StatusHistoryItem[] = [
        {
          id: '1',
          timestamp: inventoryData.created_at,
          status: 'In Stock',
          user: {
            name: 'System',
            role: 'automated'
          },
          notes: 'Initial creation'
        }
      ];
      
      // Create the last scanned info if scan history exists
      const lastScanned = scanHistory.length > 0 ? {
        timestamp: scanHistory[0].timestamp,
        location: scanHistory[0].location || 'Unknown location',
        user: scanHistory[0].user || { name: 'Unknown user', role: 'unknown' }
      } : undefined;
      
      // Map database status to UI-friendly status
      const statusMap: Record<string, 'In Stock' | 'In Transit' | 'Sold' | 'Reserved' | 'Damaged'> = {
        'available': 'In Stock',
        'reserved': 'Reserved',
        'sold': 'Sold',
        'damaged': 'Damaged',
        'in_transit': 'In Transit'
      };

      // Format the location code
      const floor = inventoryData.warehouse_locations?.floor;
      const zone = inventoryData.warehouse_locations?.zone;
      const locationCode = floor && zone ? `${zone}-${floor}` : 'Unknown';
      
      // Construct and return the box details object
      return {
        id: inventoryData.id,
        barcode: inventoryData.barcode,
        productId: inventoryData.product_id,
        productName: inventoryData.products?.name || 'Unknown Product',
        productSku: inventoryData.products?.sku,
        quantity: inventoryData.quantity || 0,
        color: inventoryData.color || undefined,
        size: inventoryData.size || undefined,
        status: statusMap[inventoryData.status] || 'In Stock',
        batchId: inventoryData.batch_id || 'unknown',
        warehouseId: inventoryData.warehouse_id,
        warehouseName: inventoryData.warehouses?.name || 'Unknown Warehouse',
        locationId: inventoryData.location_id,
        locationCode: locationCode,
        locationDetails: `Floor ${floor}, Zone ${zone}`,
        createdAt: inventoryData.created_at,
        lastScanned,
        scanHistory,
        statusHistory
      };
    } catch (error) {
      console.error('Error fetching box details:', error);
      throw error;
    }
  };
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['box-details', barcode],
    queryFn: fetchBoxDetails,
    enabled: !!barcode
  });
  
  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch
  };
};
