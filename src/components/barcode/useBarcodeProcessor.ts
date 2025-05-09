
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScanResponse } from '@/types/auth';
import { BarcodeProcessorOptions } from './types';
import { useQueryClient } from '@tanstack/react-query';
import { isValidBarcode } from '@/utils/barcodeUtils';

export function useBarcodeProcessor({
  user,
  toast,
  onScanComplete,
  onBarcodeScanned
}: BarcodeProcessorOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanData, setScanData] = useState<ScanResponse['data'] | null>(null);
  const queryClient = useQueryClient();

  const processScan = useCallback(async (scannedBarcode: string) => {
    if (!scannedBarcode || scannedBarcode.length < 8) {
      setError('Invalid barcode format');
      toast({
        variant: 'destructive',
        title: 'Invalid Barcode',
        description: 'The barcode format is invalid',
      });
      return;
    }
    
    // Validate barcode format if it's one of our generated barcodes
    if (scannedBarcode.includes('-') && !isValidBarcode(scannedBarcode)) {
      setError('Invalid warehouse barcode format');
      toast({
        variant: 'destructive',
        title: 'Invalid Barcode',
        description: 'The warehouse barcode format is invalid',
      });
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
      // First, log the scan in barcode_logs for tracking
      const scanTime = new Date().toISOString();
      const operationId = Math.random().toString(36).substring(2, 8);
      
      // Create a log entry for this scan
      const { error: logError } = await supabase
        .from('barcode_logs')
        .insert({
          barcode: scannedBarcode,
          action: 'scan',
          user_id: user?.id || '',
          details: {
            timestamp: scanTime,
            operation_id: operationId
          }
        });
        
      if (logError) {
        console.warn('Warning: Failed to create barcode scan log', logError);
        // Non-critical error, continue with processing
      }
      
      console.log(`[${operationId}] Processing barcode scan: ${scannedBarcode}`);
      
      // Call the API to get barcode information
      const { data, error } = await supabase.functions.invoke('scan-barcode', {
        body: {
          barcode: scannedBarcode,
          user_id: user?.id,
          role: user?.role,
          operation_id: operationId
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
        
        // Update barcode log with success status
        await supabase
          .from('barcode_logs')
          .update({
            details: {
              ...response.data,
              timestamp: scanTime,
              operation_id: operationId,
              status: 'success'
            }
          })
          .eq('barcode', scannedBarcode)
          .eq('action', 'scan')
          .eq('user_id', user?.id || '');
        
        // Invalidate relevant queries to update UI data
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['stock-in'] });
        queryClient.invalidateQueries({ queryKey: ['stock-out'] });
        queryClient.invalidateQueries({ queryKey: ['barcode-logs'] });
        
        if (onScanComplete) {
          onScanComplete(response.data);
        }
        
        toast({
          title: 'Barcode Scanned',
          description: `Found ${response.data.product?.name || 'item'}`,
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
  }, [user, toast, onScanComplete, onBarcodeScanned, queryClient]);

  return {
    processScan,
    loading,
    error,
    setError,
    scanData,
    setScanData
  };
}
