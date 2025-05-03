
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockInData {
  id: string;
  product: { name: string };
  submitter: { name: string; username: string } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
}

interface StockInRequestsTableProps {
  stockInRequests: StockInData[] | undefined;
  isLoading: boolean;
  onProcess: (stockIn: StockInData) => void;
  userId: string | undefined;
}

export const StockInRequestsTable: React.FC<StockInRequestsTableProps> = ({
  stockInRequests,
  isLoading,
  onProcess,
  userId,
}) => {
  const queryClient = useQueryClient();
  
  // Update stock in status mutation
  const updateStockInMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "approved" | "rejected" | "completed" | "processing" }) => {
      const { data, error } = await supabase
        .from('stock_in')
        .update({ 
          status,
          processed_by: userId 
        })
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
      toast({
        title: 'Stock In Updated',
        description: 'The stock in request has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update stock in status',
      });
    },
  });

  const handleStatusUpdate = (id: string, status: "pending" | "approved" | "rejected" | "completed" | "processing") => {
    updateStockInMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!stockInRequests || stockInRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pending stock in requests
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Submitted By</TableHead>
            <TableHead>Boxes</TableHead>
            <TableHead>Submission Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockInRequests.map((stockIn) => (
            <TableRow key={stockIn.id} className="bg-green-50">
              <TableCell className="font-medium">{stockIn.product?.name || 'Unknown Product'}</TableCell>
              <TableCell>{stockIn.submitter ? `${stockIn.submitter.name} (${stockIn.submitter.username})` : 'Unknown'}</TableCell>
              <TableCell>{stockIn.boxes}</TableCell>
              <TableCell>{new Date(stockIn.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <StatusBadge status={stockIn.status} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={() => onProcess(stockIn)}
                >
                  Process
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-green-600"
                  onClick={() => handleStatusUpdate(stockIn.id, "approved")}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => handleStatusUpdate(stockIn.id, "rejected")}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
