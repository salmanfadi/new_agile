
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScanResponse } from '@/types/auth';
import { BarcodeProcessorOptions } from './types';
import { BarcodeLog } from '@/types/inventory';

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
      // First try to find the inventory item directly using our new database function
      const { data: inventoryData, error: inventoryError } = await supabase.rpc(
        'find_inventory_by_barcode',
        { search_barcode: scannedBarcode }
      );
      
      if (inventoryError) {
        console.error('Error finding inventory by barcode:', inventoryError);
      }
      
      // If we found the item directly, process it
      if (inventoryData && inventoryData.length > 0) {
        const item = inventoryData[0];
        
        // Log the scan for tracking purposes using inventory_movements
        const logDetails = { 
          inventory_id: item.inventory_id,
          product_name: item.product_name,
          location: `${item.warehouse_name} - Floor ${item.floor} - Zone ${item.zone}`,
          barcode: scannedBarcode,
          event_type: 'scan'
        };
        
        // Add an inventory movement record instead of using barcode_logs
        await supabase.from('inventory_movements').insert({
          product_id: item.inventory_id,
          // We need to get warehouse and location IDs differently since they're not in the returned structure
          warehouse_id: '', // This will be populated through a separate query or passed in
          location_id: '', // This will be populated through a separate query or passed in
          movement_type: 'adjustment', // Using adjustment for scanning/lookup operations
          quantity: 0, // Zero quantity as this is just a scan, not actual movement
          status: 'approved',
          performed_by: user?.id || 'anonymous',
          details: logDetails
        });
        
        // Format response for the UI
        const formattedResponse: ScanResponse = {
          status: 'success',
          data: {
            box_id: item.barcode,
            product: {
              id: item.inventory_id,
              name: item.product_name,
              sku: item.product_sku || '',
              description: 'Product from inventory'
            },
            box_quantity: item.quantity,
            total_product_quantity: item.quantity,
            location: {
              warehouse: item.warehouse_name,
              zone: item.zone,
              position: `Floor ${item.floor}`
            },
            status: (item.status as any) || 'available',
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
          description: `Found ${item.product_name} in ${item.warehouse_name}`,
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

  return {
    processScan,
    loading,
    error,
    setError,
    scanData,
    setScanData
  };
}
