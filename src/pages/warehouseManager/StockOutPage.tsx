
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProcessStockOutForm from '@/components/warehouse/ProcessStockOutForm';
import { CreateStockOutForm } from '@/components/warehouse/CreateStockOutForm';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';

const StockOutPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStockOut, setSelectedStockOut] = useState<any | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch stock out requests
  const { data: stockOutRequests, isLoading } = useQuery({
    queryKey: ['stock-out-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          *,
          stock_out_details(*, product:products(*))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to make it easier to work with
      return data?.map(stockOut => ({
        ...stockOut,
        // Extract the first product for display in the table
        // (We'll handle multiple products in the ProcessStockOutForm)
        product: stockOut.stock_out_details?.[0]?.product || null,
        quantity: stockOut.stock_out_details?.[0]?.quantity || 0
      })) || [];
    },
  });

  const handleProcess = (stockOut: any) => {
    // Make sure we pass the full stock_out_details to the form
    setSelectedStockOut(stockOut);
    setIsProcessingDialogOpen(true);
  };

  const handleReject = async (stockOut: any) => {
    try {
      const { error } = await supabase
        .from('stock_out')
        .update({
          status: 'rejected',
          rejected_by: user?.id,
          rejected_at: new Date().toISOString(),
        })
        .eq('id', stockOut.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Stock out request has been rejected.',
      });
    } catch (error) {
      console.error('Error rejecting stock out:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reject stock out request',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Out Requests</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>
            Review and process stock out requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : !stockOutRequests?.length ? (
            <div className="text-center py-4">No pending stock out requests</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockOutRequests.map((stockOut: any) => (
                  <TableRow key={stockOut.id}>
                    <TableCell>
                      {format(new Date(stockOut.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>{stockOut.destination}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stockOut.status === 'pending'
                            ? 'default'
                            : stockOut.status === 'approved'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {stockOut.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{stockOut.notes || 'N/A'}</TableCell>
                    <TableCell>
                      {stockOut.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcess(stockOut)}
                          >
                            Process
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(stockOut)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProcessStockOutForm
        open={isProcessingDialogOpen}
        onOpenChange={setIsProcessingDialogOpen}
        stockOut={selectedStockOut}
        userId={user?.id}
      />

      <CreateStockOutForm
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={user?.id}
      />
    </div>
  );
};

export default StockOutPage;
