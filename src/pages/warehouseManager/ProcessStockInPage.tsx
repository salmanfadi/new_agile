
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProcessableStockIn } from '@/types/auth';
import { useToast } from "@/components/ui/use-toast";

interface StockInData {
  stockIn?: ProcessableStockIn | null;
  loading: boolean;
  error: Error | null;
}

interface StockInDetailsProps {
  stockInData: StockInData;
  stockIn: ProcessableStockIn;
  details: any[];
}

// A simple StockInDetails component for now
const StockInDetails: React.FC<StockInDetailsProps> = ({ stockInData, stockIn, details }) => {
  if (stockInData.loading) {
    return <div>Loading...</div>;
  }

  if (!stockIn) {
    return <div>No stock in data found.</div>;
  }

  return (
    <div className="border p-4 rounded-md mb-6">
      <h2 className="text-xl font-semibold mb-2">Stock In #{stockIn.id.substring(0, 8)}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p><strong>Product:</strong> {stockIn.product.name}</p>
          <p><strong>SKU:</strong> {stockIn.product.sku || 'N/A'}</p>
          <p><strong>Category:</strong> {stockIn.product.category || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Boxes:</strong> {stockIn.boxes}</p>
          <p><strong>Status:</strong> {stockIn.status}</p>
          <p><strong>Source:</strong> {stockIn.source}</p>
          <p><strong>Submitted by:</strong> {stockIn.submitter.name} ({stockIn.submitter.username})</p>
        </div>
      </div>
      <div>
        <p><strong>Notes:</strong></p>
        <p>{stockIn.notes || 'No notes provided.'}</p>
      </div>
      {details && details.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Details</h3>
          <ul>
            {details.map((detail, index) => (
              <li key={index} className="mb-1">
                {detail.barcode}: {detail.quantity} units
                {detail.color && ` (${detail.color})`}
                {detail.size && `, Size: ${detail.size}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

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
          // Fix these properties - they're objects, not arrays
          product: {
            id: data.product?.id || '',
            name: data.product?.name || '',
            sku: data.product?.sku || undefined,
            category: data.product?.category || undefined
          },
          submitter: {
            id: data.submitter?.id || '',
            name: data.submitter?.name || '',
            username: data.submitter?.username || ''
          }
        };

        setCurrentStockIn(transformedData);
        setStockInData({ stockIn: transformedData, loading: false, error: null });

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
          stockIn={currentStockIn}
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
