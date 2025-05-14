
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ProcessableStockIn } from '@/types/auth';
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import { createInventoryMovement } from './useInventoryMovements';

export const useStockInProcessing = (stockInId: string | undefined) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stockInData, setStockInData] = useState<{
    stockIn: ProcessableStockIn | null;
    loading: boolean;
    error: Error | null;
  }>({
    stockIn: null,
    loading: true,
    error: null,
  });
  
  const [details, setDetails] = useState<any[]>([]);
  const [currentStockIn, setCurrentStockIn] = useState<ProcessableStockIn | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchStockIn = async () => {
      setStockInData(prev => ({ ...prev, loading: true, error: null }));
      try {
        if (!stockInId) {
          throw new Error("Stock In ID is missing.");
        }

        const { data, error: stockInError } = await supabase
          .from('stock_in')
          .select(`
            id, boxes, status, created_at, source, notes,
            product:product_id (id, name, sku, category),
            submitter:submitted_by (id, name, username)
          `)
          .eq('id', stockInId)
          .single();

        if (stockInError) {
          throw stockInError;
        }

        if (!data) {
          throw new Error("Stock In record not found.");
        }

        // Transform the data into the expected shape
        const transformedData: ProcessableStockIn = {
          id: data.id,
          boxes: data.boxes,
          status: data.status,
          created_at: data.created_at,
          source: data.source,
          notes: data.notes,
          product: {
            id: data.product.id || '',
            name: data.product.name || '',
            sku: data.product.sku || undefined,
            category: data.product.category || undefined
          },
          submitter: {
            id: data.submitter.id || '',
            name: data.submitter.name || '',
            username: data.submitter.username || ''
          }
        };

        setCurrentStockIn(transformedData);
        setStockInData({ stockIn: transformedData, loading: false, error: null });

      } catch (error: any) {
        console.error('Error fetching stock in:', error);
        setStockInData(prev => ({ ...prev, loading: false, error }));
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load stock in details."
        });
      }
    };

    fetchStockIn();
  }, [stockInId, toast]);

  const handleApproval = async (approved: boolean) => {
    if (!stockInId || !currentStockIn) {
      console.error("Stock In ID is missing or data not loaded.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get user ID from session
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;
      
      if (!userId) {
        throw new Error("User not authenticated.");
      }

      // Update the stock_in status
      const newStatus = approved ? 'approved' : 'rejected';
      const { error: updateError } = await supabase
        .from('stock_in')
        .update({
          status: newStatus,
          notes: approvalNotes,
          processed_by: userId
        })
        .eq('id', stockInId);

      if (updateError) {
        throw updateError;
      }
      
      // If approved, create an inventory movement record
      if (approved) {
        // Get first warehouse and location (this would ideally come from a form selection)
        const { data: warehouseData } = await supabase.from('warehouses').select('id').limit(1).single();
        const warehouseId = warehouseData?.id;
        
        if (!warehouseId) {
          throw new Error("No warehouse found to process stock in.");
        }
        
        const { data: locationData } = await supabase
          .from('warehouse_locations')
          .select('id')
          .eq('warehouse_id', warehouseId)
          .limit(1)
          .single();
          
        const locationId = locationData?.id;
        
        if (!locationId) {
          throw new Error("No warehouse location found to process stock in.");
        }
        
        // Create the inventory movement
        await createInventoryMovement(
          currentStockIn.product.id,
          warehouseId,
          locationId,
          currentStockIn.boxes,
          'in',
          'approved',
          'stock_in',
          stockInId,
          userId,
          {
            source: currentStockIn.source,
            notes: approvalNotes || "Stock in approved"
          }
        );
      }

      toast({
        title: "Success",
        description: `Stock In ${approved ? 'approved' : 'rejected'} successfully.`,
      });
      navigate('/manager/stock-in');
    } catch (error: any) {
      console.error('Error updating stock in status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update stock in status."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    stockInData,
    currentStockIn,
    details,
    approvalNotes,
    setApprovalNotes,
    handleApproval,
    isSubmitting,
    navigate
  };
};
