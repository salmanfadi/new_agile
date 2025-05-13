import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStockInBoxes, StockInData } from '@/hooks/useStockInBoxes';
import { DefaultValuesForm } from '@/components/warehouse/DefaultValuesForm';
import { BoxesTable } from '@/components/warehouse/BoxesTable';
import { processStockIn } from '@/utils/stockInProcessor';

interface ProcessStockInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStockIn: StockInData | null;
  userId: string | undefined;
}

export const ProcessStockInDialog: React.FC<ProcessStockInDialogProps> = ({
  open,
  onOpenChange,
  selectedStockIn,
  userId,
}) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  
  const {
    boxesData,
    defaultValues,
    setDefaultValues,
    handleBoxUpdate,
    applyDefaultsToAll,
    isMissingRequiredData
  } = useStockInBoxes(selectedStockIn, open);

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
    mutationFn: async () => {
      if (!selectedStockIn?.id || !userId) {
        throw new Error('Missing required data for processing');
      }

      // Add product_id to each box
      const boxesWithProduct = boxesData.map(box => ({
        ...box,
        product_id: selectedStockIn.product?.id || ''
      }));

      return processStockIn(selectedStockIn.id, boxesWithProduct, userId);
    },
    onSuccess: (result) => {
      if (result.barcodeErrors && result.barcodeErrors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Stock In Processed with Warnings',
          description: `${result.barcodeErrors.length} barcode(s) were found to be duplicates and were skipped.`,
        });
      } else {
        toast({
          title: 'Stock In Processed Successfully',
          description: 'All items have been added to inventory',
        });
      }
      
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Failed to process stock in',
      });
    },
  });

  const handleSubmit = () => {
    if (isMissingRequiredData()) {
      toast({
        variant: 'destructive',
        title: 'Missing Required Data',
        description: 'Please fill in all required fields for each box.',
      });
      return;
    }

    processStockInMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isMobile ? 'w-full h-full max-w-full' : 'max-w-4xl'}>
        <DialogHeader>
          <DialogTitle>Process Stock In</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-6 p-4">
            <DefaultValuesForm
              defaultValues={defaultValues}
              setDefaultValues={setDefaultValues}
              warehouses={warehouses}
              locations={locations}
              onApplyToAll={applyDefaultsToAll}
            />
            <BoxesTable
              boxesData={boxesData}
              handleBoxUpdate={handleBoxUpdate}
              warehouses={warehouses}
              locations={locations}
            />
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processStockInMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={processStockInMutation.isPending || isMissingRequiredData()}
          >
            {processStockInMutation.isPending ? 'Processing...' : 'Process Stock In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
