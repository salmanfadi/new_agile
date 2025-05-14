
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { StockInDetails } from '@/components/warehouse/StockInDetails';
import { supabase } from '@/integrations/supabase/client';
import { StockIn, StockInDetail, StockInStatus } from '@/types/stockIn';
import { StockInData } from '@/hooks/useStockInBoxes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export const StockInDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockIn, setStockIn] = useState<StockIn | null>(null);
  const [details, setDetails] = useState<StockInDetail[]>([]);
  const [stockInData, setStockInData] = useState<StockInData | null>(null);

  useEffect(() => {
    const fetchStockInData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stock in data
        const { data: stockInData, error: stockInError } = await supabase
          .from('stock_in')
          .select(`
            *,
            product:products(*),
            submitter:profiles!stock_in_submitted_by_fkey(*),
            processor:profiles!stock_in_processed_by_fkey(*)
          `)
          .eq('id', id)
          .single();

        if (stockInError) throw stockInError;
        if (!stockInData) throw new Error('Stock in not found');

        // Create StockIn object with properly typed status
        const typedStockIn: StockIn = {
          id: stockInData.id,
          product_id: stockInData.product_id,
          source: stockInData.source,
          notes: stockInData.notes || '',
          status: stockInData.status as StockInStatus,
          submitted_by: stockInData.submitted_by,
          processed_by: stockInData.processed_by,
          batch_id: stockInData.batch_id,
          processing_started_at: stockInData.processing_started_at,
          processing_completed_at: stockInData.processing_completed_at,
          created_at: stockInData.created_at,
          updated_at: stockInData.updated_at
        };
        
        setStockIn(typedStockIn);

        // Fetch stock in details
        const { data: detailsData, error: detailsError } = await supabase
          .from('stock_in_details')
          .select('*')
          .eq('stock_in_id', id)
          .order('processing_order', { ascending: true });

        if (detailsError) throw detailsError;
        setDetails((detailsData || []).map((d: any) => ({
          ...d,
          status: d.status || 'pending',
          batch_number: d.batch_number || null,
          processing_order: d.processing_order || null,
          processed_at: d.processed_at || null,
          error_message: d.error_message || null
        })));

        // Transform data for StockInData type
        const transformedData: StockInData = {
          id: stockInData.id,
          product: stockInData.product,
          boxes: stockInData.boxes,
          source: stockInData.source,
          notes: stockInData.notes,
          submitter: stockInData.submitter,
          status: stockInData.status,
          created_at: stockInData.created_at
        };

        setStockInData(transformedData);
      } catch (err) {
        console.error('Error fetching stock in data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStockInData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stockIn || !stockInData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Not Found</AlertTitle>
        <AlertDescription>Stock in request not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Stock In Details</h1>
      <StockInDetails
        stockInData={stockInData}
        stockIn={stockIn}
        details={details}
      />
    </div>
  );
};
