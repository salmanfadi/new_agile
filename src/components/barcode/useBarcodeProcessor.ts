
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScanResponse } from '@/types/auth';
import { BarcodeProcessorOptions } from './types';
import { MovementType } from '@/types/inventory';

export function useBarcodeProcessor({
  user,
  toast,
  onScanComplete,
  onBarcodeScanned
}: BarcodeProcessorOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanResponse['data'] | null>(null);

  const processScan = useCallback(async (scannedBarcode: string) => {
    if (!scannedBarcode || scannedBarcode.length < 8) {
      setError('Invalid barcode format');
      return;
    }
    
    // If an external handler is provided, call it and optionally stop processing
    if (onBarcodeScanned) {
      await onBarcodeScanned(scannedBarcode);
      return; // Let the parent component handle the barcode
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First try to find the inventory item directly by querying the inventory table
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          quantity,
          barcode,
          color,
          size,
          batch_id,
          status,
          warehouse_id,
          location_id,
          products!inner(id, name, sku, description),
          warehouses!inner(id, name),
          warehouse_locations!inner(id, zone, floor)
        `)
        .eq('barcode', scannedBarcode)
        .limit(1);
      
      if (inventoryError) {
        console.error('Error finding inventory by barcode:', inventoryError);
      }
      
      // If we found the item directly, process it
      if (inventoryData && Array.isArray(inventoryData) && inventoryData.length > 0) {
        const item = inventoryData[0];
        
        // Get warehouse and location IDs
        const warehouseId = await getWarehouseId(item.warehouses?.name || '');
        const locationId = await getLocationId(
          parseInt(item.warehouse_locations?.floor || '1'), 
          item.warehouse_locations?.zone || ''
        );
        
        // Log the scan for tracking purposes using inventory_movements
        const logDetails = { 
          inventory_id: item.id,
          product_name: item.products?.name || 'Unknown Product',
          location: `${item.warehouses?.name} - Floor ${item.warehouse_locations?.floor} - Zone ${item.warehouse_locations?.zone}`,
          barcode: scannedBarcode,
          event_type: 'scan'
        };
        
        if (warehouseId && locationId) {
          // Add an inventory movement record instead of using barcode_logs
          await supabase.from('inventory_movements').insert({
            inventory_id: item.id,
            movement_type: 'adjustment' as MovementType,
            quantity: 0, // Zero quantity as this is just a scan, not actual movement
            performed_by: user?.id || null,
            notes: JSON.stringify(logDetails)
          });
        }
        
        // Format response for the UI
        const formattedResponse: ScanResponse = {
          status: 'success',
          data: {
            box_id: item.barcode || '',
            product: {
              id: item.product_id,
              name: item.products?.name || 'Unknown Product',
              sku: item.products?.sku || '',
              description: item.products?.description || 'Product from inventory'
            },
            box_quantity: item.quantity,
            total_product_quantity: item.quantity,
            location: {
              warehouse: item.warehouses?.name || 'Unknown Warehouse',
              zone: item.warehouse_locations?.zone || 'Unknown Zone',
              position: `Floor ${item.warehouse_locations?.floor || '1'}`
            },
            status: item.status || 'available',
            attributes: {
              color: item.color,
              size: item.size,
              batch_id: item.batch_id
            },
            history: [{
              action: 'Lookup',
              timestamp: new Date().toLocaleString()
            }]
          }
        };
        
        setScanData(formattedResponse.data);
        if (onScanComplete) {
          onScanComplete(formattedResponse.data);
        }
        
        toast({
          title: 'Item Found',
          description: `Found ${item.products?.name} in ${item.warehouses?.name}`,
        });
      } else {
        // If no direct match, try the serverless function for more complex lookup logic
        const { data, error } = await supabase.functions.invoke('scan-barcode', {
          body: {
            barcode: scannedBarcode,
            user_id: user?.id,
            role: user?.role
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        const response = data as ScanResponse;
        
        if (response.status === 'error' || !response.data) {
          setError(response.error || 'Failed to retrieve product information');
          toast({
            variant: 'destructive',
            title: 'Scan Failed',
            description: response.error || 'Failed to retrieve product information',
          });
        } else {
          setScanData(response.data);
          if (onScanComplete) {
            onScanComplete(response.data);
          }
          toast({
            title: 'Barcode Scanned',
            description: `Found ${response.data.product.name}`,
          });
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      toast({
        variant: 'destructive',
        title: 'Scan Error',
        description: err instanceof Error ? err.message : 'Failed to process barcode scan',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast, onScanComplete, onBarcodeScanned]);

  // Helper function to get warehouse ID from warehouse name
  const getWarehouseId = async (warehouseName: string): Promise<string> => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('id')
      .eq('name', warehouseName)
      .single();
    
    if (error || !data) {
      console.error('Error getting warehouse ID:', error);
      return '';
    }
    
    return data.id;
  };
  
  // Helper function to get location ID from floor and zone
  const getLocationId = async (floor: number, zone: string): Promise<string> => {
    const { data, error } = await supabase
      .from('warehouse_locations')
      .select('id')
      .eq('floor', floor.toString())
      .eq('zone', zone)
      .single();
    
    if (error || !data) {
      console.error('Error getting location ID:', error);
      return '';
    }
    
    return data.id;
  };

  return {
    processScan,
    loading,
    error,
    setError,
    scanData,
    setScanData
  };
}
