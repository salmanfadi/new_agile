
import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { DefaultValuesForm } from '@/components/warehouse/DefaultValuesForm';
import { BoxesTable } from '@/components/warehouse/BoxesTable';
import { processStockIn } from '@/utils/stockInProcessor';
import { toast } from '@/hooks/use-toast';
import { useStockInBoxes, StockInData } from '@/hooks/useStockInBoxes';

const ProcessStockInPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { stockInId } = useParams<{ stockInId: string }>();
  const { user } = useAuth();

  const [stockInData, setStockInData] = React.useState<StockInData | null>(null);
  
  // Initialize box data with the hook
  const {
    boxesData,
    defaultValues,
    setDefaultValues,
    handleBoxUpdate,
    applyDefaultsToAll,
    isMissingRequiredData
  } = useStockInBoxes(stockInData, true);

  // Fetch stock in data
  const { isLoading: isLoadingStockIn } = useQuery({
    queryKey: ['stock-in', stockInId],
    queryFn: async () => {
      if (!stockInId) return null;
      
      const { data, error } = await supabase
        .from('stock_in')
        .select(`
          id,
          product:product_id(id, name),
          submitted_by,
          boxes,
          status,
          created_at,
          source,
          notes,
          rejection_reason
        `)
        .eq('id', stockInId)
        .single();

      if (error) throw error;
      
      // Fetch submitter information separately to avoid the relationship error
      let submitter = null;
      if (data && data.submitted_by) {
        const { data: submitterData, error: submitterError } = await supabase
          .from('profiles')
          .select('id, name, username')
          .eq('id', data.submitted_by)
          .single();
          
        if (!submitterError && submitterData) {
          submitter = submitterData;
        } else {
          submitter = { name: 'Unknown', username: 'unknown' };
        }
      }
      
      if (data) {
        setStockInData({
          id: data.id,
          product: data.product || { name: 'Unknown Product' },
          submitter: submitter,
          boxes: data.boxes,
          status: data.status,
          created_at: data.created_at,
          source: data.source || 'Unknown Source',
          notes: data.notes,
          rejection_reason: data.rejection_reason
        });
      }
      
      return data;
    },
    enabled: !!stockInId,
  });

  // Fetch warehouses for the dropdown
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('warehouses').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch warehouse locations based on selected warehouse
  const { data: locations } = useQuery({
    queryKey: ['warehouse-locations', defaultValues.warehouse],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', defaultValues.warehouse)
        .order('floor')
        .order('zone');
        
      if (error) throw error;
      return data;
    },
    enabled: !!defaultValues.warehouse,
  });

  // Process stock in mutation
  const processStockInMutation = useMutation({
    mutationFn: async (data: { stockInId: string; boxes: typeof boxesData }) => {
      return processStockIn(data.stockInId, data.boxes, user?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: 'Stock In Processed',
        description: 'The stock in has been processed and added to inventory.',
      });
      // Navigate back to the stock in list
      navigate('/manager/stock-in');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process stock in',
      });
    },
  });

  const handleProcessingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInId || !stockInData) return;

    if (isMissingRequiredData()) {
      toast({
        variant: 'destructive',
        title: 'Incomplete data',
        description: 'Please fill in all required fields for each box.',
      });
      return;
    }

    processStockInMutation.mutate({
      stockInId: stockInId,
      boxes: boxesData,
    });
  };

  if (isLoadingStockIn) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Processing Stock In" 
          description="Loading stock in details..." 
        />
        <div className="mt-8 text-center">Loading...</div>
      </div>
    );
  }

  if (!stockInData) {
    return (
      <div className="p-6">
        <PageHeader 
          title="Error" 
          description="Stock in not found" 
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manager/stock-in')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock In Processing
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title="Process Stock In" 
        description={`Processing stock for ${stockInData.product?.name}`} 
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager/stock-in')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Stock In Processing
      </Button>
      
      <form onSubmit={handleProcessingSubmit}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock In Details</CardTitle>
              <CardDescription>Review the details of this stock in request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="font-medium">Product: {stockInData.product?.name}</div>
                <div className="text-sm text-gray-500">Total Boxes: {stockInData.boxes}</div>
                <div className="text-sm text-gray-500">
                  Submitted By: {stockInData.submitter ? `${stockInData.submitter.name} (${stockInData.submitter.username})` : 'Unknown'}
                </div>
                <div className="text-sm text-gray-500">
                  Source: {stockInData.source}
                </div>
                {stockInData.notes && (
                  <div className="text-sm text-gray-500">
                    Notes: {stockInData.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Default Values</CardTitle>
              <CardDescription>Set default values for all boxes</CardDescription>
            </CardHeader>
            <CardContent>
              <DefaultValuesForm 
                defaultValues={defaultValues}
                setDefaultValues={setDefaultValues}
                applyDefaultsToAll={applyDefaultsToAll}
                warehouses={warehouses}
                locations={locations}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Box Details</CardTitle>
              <CardDescription>Specify details for individual boxes</CardDescription>
            </CardHeader>
            <CardContent>
              <BoxesTable 
                boxesData={boxesData}
                handleBoxUpdate={handleBoxUpdate}
                warehouses={warehouses}
                locations={locations}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/manager/stock-in')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isMissingRequiredData() || processStockInMutation.isPending}
            >
              {processStockInMutation.isPending ? 'Processing...' : 'Accept & Process Stock In'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProcessStockInPage;
