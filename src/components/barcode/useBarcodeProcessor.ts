
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScanResponse } from '@/types/auth';
import { BarcodeProcessorOptions } from './types';

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
      // Call the API to get barcode information
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
