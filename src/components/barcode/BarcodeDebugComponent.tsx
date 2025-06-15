
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BarcodeDebugData {
  barcodeTable?: any;
  batchItemsTable?: any;
  inventoryTable?: any;
}

export const BarcodeDebugComponent: React.FC = () => {
  const [barcode, setBarcode] = useState('');
  const [debugData, setDebugData] = useState<BarcodeDebugData | null>(null);
  const [loading, setLoading] = useState(false);

  const debugBarcode = async () => {
    if (!barcode.trim()) {
      toast({
        variant: 'destructive',
        title: 'Please enter a barcode',
        description: 'Enter a barcode to debug the data'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Debugging barcode:', barcode);

      // Check barcodes table
      const { data: barcodeData, error: barcodeError } = await supabase
        .from('barcodes')
        .select('*')
        .eq('barcode', barcode);

      // Check batch_items table
      const { data: batchItemsData, error: batchItemsError } = await supabase
        .from('batch_items')
        .select('*')
        .eq('barcode', barcode);

      // Check inventory table
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .eq('barcode', barcode);

      console.log('Barcode table data:', barcodeData);
      console.log('Batch items table data:', batchItemsData);
      console.log('Inventory table data:', inventoryData);

      if (barcodeError) console.error('Barcode table error:', barcodeError);
      if (batchItemsError) console.error('Batch items table error:', batchItemsError);
      if (inventoryError) console.error('Inventory table error:', inventoryError);

      setDebugData({
        barcodeTable: barcodeData,
        batchItemsTable: batchItemsData,
        inventoryTable: inventoryData
      });

      toast({
        title: 'Debug data fetched',
        description: `Found data in ${[
          barcodeData?.length && 'barcodes',
          batchItemsData?.length && 'batch_items',
          inventoryData?.length && 'inventory'
        ].filter(Boolean).join(', ')} tables`
      });

    } catch (error) {
      console.error('Error debugging barcode:', error);
      toast({
        variant: 'destructive',
        title: 'Debug failed',
        description: error instanceof Error ? error.message : 'Failed to debug barcode'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Barcode Debug Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter barcode (e.g., 614800522001)"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
          <Button onClick={debugBarcode} disabled={loading}>
            {loading ? 'Debugging...' : 'Debug'}
          </Button>
        </div>

        {debugData && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Barcodes Table:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.barcodeTable, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Batch Items Table:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.batchItemsTable, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Inventory Table:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(debugData.inventoryTable, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
