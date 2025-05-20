
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
      // First, get the inventory item basic info
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, barcode, product_id, warehouse_id, location_id, quantity, color, size, status, batch_id, created_at, updated_at')
        .eq('barcode', barcode)
        .single();
      
      if (inventoryError) throw inventoryError;
      if (!inventoryData) return null;
      
      // Fetch product info separately
      const { data: productData } = await supabase
        .from('products')
        .select('name, sku')
        .eq('id', inventoryData.product_id)
        .single();
      
      // Fetch warehouse info separately
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', inventoryData.warehouse_id)
        .single();
      
      // Fetch location info separately
      const { data: locationData } = await supabase
        .from('warehouse_locations')
        .select('floor, zone')
        .eq('id', inventoryData.location_id)
        .single();
      
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
          performed_by,
          warehouse_id
        `)
        .eq('details->barcode', barcode)
        .order('created_at', { ascending: false });
      
      // Get user info for the movements
      let userMap: { [key: string]: { name: string; role: string } } = {};
      
      if (movementsData && movementsData.length > 0) {
        const userIds = movementsData.map(m => m.performed_by).filter(Boolean);
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('profiles')
            .select('id, name, role')
            .in('id', userIds);
          
          if (usersData) {
            usersData.forEach(user => {
              userMap[user.id] = { name: user.name || 'Unknown', role: user.role || 'unknown' };
            });
          }
        }
      }
      
      // Get warehouse info for the movements
      let warehouseMap: { [key: string]: string } = {};
      
      if (movementsData && movementsData.length > 0) {
        const warehouseIds = movementsData.map(m => m.warehouse_id).filter(Boolean);
        if (warehouseIds.length > 0) {
          const { data: warehousesData } = await supabase
            .from('warehouses')
            .select('id, name')
            .in('id', warehouseIds);
          
          if (warehousesData) {
            warehousesData.forEach(warehouse => {
              warehouseMap[warehouse.id] = warehouse.name;
            });
          }
        }
      }
      
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
        
        const userInfo = movement.performed_by ? userMap[movement.performed_by] : undefined;
        const warehouseName = movement.warehouse_id ? warehouseMap[movement.warehouse_id] : undefined;
        
        return {
          id: movement.id,
          timestamp: movement.created_at,
          action: actionMap[movement.movement_type as string] || `${(movement.movement_type as string).charAt(0).toUpperCase() + (movement.movement_type as string).slice(1)} Action`,
          location: warehouseName,
          user: userInfo,
          details: movement.details && typeof movement.details === 'object' ? 
                  (movement.details as any).notes : 
                  undefined
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
      const floor = locationData ? locationData.floor : 'Unknown';
      const zone = locationData ? locationData.zone : 'Unknown';
      const locationCode = floor && zone ? `${zone}-${floor}` : 'Unknown';
      
      // Construct and return the box details object
      return {
        id: inventoryData.id,
        barcode: inventoryData.barcode,
        productId: inventoryData.product_id,
        productName: productData ? productData.name : 'Unknown Product',
        productSku: productData ? productData.sku : undefined,
        quantity: inventoryData.quantity || 0,
        color: inventoryData.color || undefined,
        size: inventoryData.size || undefined,
        status: statusMap[inventoryData.status] || 'In Stock',
        batchId: inventoryData.batch_id || 'unknown',
        warehouseId: inventoryData.warehouse_id,
        warehouseName: warehouseData ? warehouseData.name : 'Unknown Warehouse',
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
