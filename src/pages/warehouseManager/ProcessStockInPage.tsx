import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StockInDetails } from '@/components/StockInDetails';
import { useToast } from "@/components/ui/use-toast"

// Add a type for the processed stockIn data
interface ProcessableStockIn {
  id: string;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  product: {
    id: string;
    name: string;
    sku?: string;
    category?: string;
  };
  submitter: {
    id: string;
    name: string;
    username: string;
  };
}

interface StockInData {
  stockIn?: ProcessableStockIn | null;
  loading: boolean;
  error: Error | null;
}

const ProcessStockInPage: React.FC = () => {
  const { stockInId } = useParams<{ stockInId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast()

  const [stockInData, setStockInData] = useState<StockInData>({
    stockIn: null,
    loading: true,
    error: null,
  });
  const [details, setDetails] = useState<any[]>([]);
  const [currentStockIn, setCurrentStockIn] = useState<ProcessableStockIn | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  useEffect(() => {
    const fetchStockIn = async () => {
      setStockInData({ ...stockInData, loading: true, error: null });
      try {
        if (!stockInId) {
          throw new Error("Stock In ID is missing.");
        }

        const { data: stockIn, error: stockInError } = await supabase
          .from('stock_in')
          .select(`
            id, boxes, status, created_at, source, notes,
            product (id, name, sku, category),
            submitter: submitted_by (id, name, username)
          `)
          .eq('id', stockInId)
          .single();

        if (stockInError) {
          throw stockInError;
        }

        if (!stockIn) {
          throw new Error("Stock In record not found.");
        }

        setCurrentStockIn(stockIn as ProcessableStockIn);
        setStockInData({ stockIn: stockIn as ProcessableStockIn, loading: false, error: null });

      } catch (error: any) {
        console.error('Error fetching stock in:', error);
        setStockInData({ ...stockInData, loading: false, error: error });
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load stock in details."
        })
      }
    };

    fetchStockIn();
  }, [stockInId]);

  const handleApproval = async (approved: boolean) => {
    if (!stockInId) {
      console.error("Stock In ID is missing.");
      return;
    }

    try {
      const { error } = await supabase
        .from('stock_in')
        .update({
          status: approved ? 'approved' : 'rejected',
          notes: approvalNotes,
        })
        .eq('id', stockInId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: `Stock In ${approved ? 'approved' : 'rejected'} successfully.`,
      })
      navigate('/manager/stock-in');
    } catch (error: any) {
      console.error('Error updating stock in status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update stock in status."
      })
    }
  };

  if (stockInData.loading) {
    return <div>Loading stock in details...</div>;
  }

  if (stockInData.error) {
    return <div>Error: {stockInData.error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Process Stock In</h1>
      {currentStockIn && (
        <StockInDetails
          stockInData={stockInData}
          stockIn={currentStockIn as any}
          details={details}
        />
      )}
      <div className="mb-4">
        <Label htmlFor="approvalNotes">Approval Notes</Label>
        <Textarea
          id="approvalNotes"
          placeholder="Enter any notes for approval or rejection"
          value={approvalNotes}
          onChange={(e) => setApprovalNotes(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => handleApproval(true)}>Approve</Button>
        <Button variant="destructive" onClick={() => handleApproval(false)}>Reject</Button>
        <Button variant="ghost" onClick={() => navigate('/manager/stock-in')}>Cancel</Button>
      </div>
    </div>
  );
};

export default ProcessStockInPage;
