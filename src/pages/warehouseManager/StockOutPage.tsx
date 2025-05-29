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
import CreateStockOutForm from '@/components/warehouse/CreateStockOutForm';
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
          product:products(*),
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleProcess = (stockOut: any) => {
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
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockOutRequests.map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>{request.product?.name}</div>
                      {request.product?.sku && (
                        <div className="text-sm text-gray-500">
                          SKU: {request.product.sku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>
                      {request.customer ? (
                        <div>
                          <div>{request.customer.name}</div>
                          {request.customer.company && (
                            <div className="text-sm text-gray-500">
                              {request.customer.company}
                            </div>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>{request.destination}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === 'pending_operator'
                            ? 'default'
                            : request.status === 'approved'
                            ? 'success'
                            : 'destructive'
                        }
                      >
                        {request.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        request.priority === 'urgent' ? 'destructive' :
                        request.priority === 'high' ? 'default' :
                        request.priority === 'normal' ? 'secondary' :
                        'outline'
                      }>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending_operator' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleProcess(request)}
                          >
                            Process
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(request)}
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