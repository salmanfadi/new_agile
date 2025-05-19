import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useStockOutRequests } from '@/hooks/useStockOutRequests';

const StockOutApproval: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedStockOut, setSelectedStockOut] = useState<any | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch paginated pending stock out requests
  const {
    data: stockOutResult,
    isLoading,
    error
  } = useStockOutRequests({ status: 'pending' }, page, pageSize);

  const stockOutRequests = stockOutResult?.data ?? [];
  const totalCount = stockOutResult?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Check available inventory for a product
  const getAvailableInventory = async (productId: string) => {
    const { data, error } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', productId);
    if (error) throw error;
    const totalQuantity = data.reduce((sum, item) => sum + item.quantity, 0);
    return totalQuantity;
  };

  // Update stock out status mutation
  const updateStockOutMutation = useMutation({
    mutationFn: async ({ id, status, approved_quantity }: { id: string; status: string; approved_quantity?: number }) => {
      const updateData: any = { 
        status,
        approved_by: user?.id 
      };
      if (approved_quantity !== undefined) {
        updateData.approved_quantity = approved_quantity;
      }
      const { data, error } = await supabase
        .from('stock_out')
        .update(updateData)
        .eq('id', id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      setIsApprovalDialogOpen(false);
      toast({
        title: 'Stock Out Updated',
        description: 'The stock out request has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update stock out status',
      });
    },
  });

  const handleStatusUpdate = (id: string, status: 'rejected') => {
    updateStockOutMutation.mutate({ id, status });
  };

  const handleApprove = async (stockOut: any) => {
    try {
      // Check available inventory
      const availableQuantity = await getAvailableInventory(stockOut.product.id);
      setSelectedStockOut(stockOut);
      setApprovedQuantity(Math.min(stockOut.quantity, availableQuantity));
      setIsApprovalDialogOpen(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error checking inventory',
        description: error instanceof Error ? error.message : 'Failed to check available inventory',
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Out Approval" 
        description="Review and approve stock out requests"
      />
      <Card>
        <CardHeader>
          <CardTitle>Pending Stock Out Requests</CardTitle>
          <CardDescription>Review and approve outgoing stock requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : !stockOutRequests || stockOutRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending stock out requests
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockOutRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.requester?.name || 'Unknown'}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.destination}</TableCell>
                      <TableCell>{item.reason || '-'}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(item)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(item.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Showing page {page} of {totalPages} ({totalCount} requests)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="h-8 w-8"
                    >
                      {'<<'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="h-8 w-8"
                    >
                      {'<'}
                    </Button>
                    <span className="mx-2 text-sm font-medium">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="h-8 w-8"
                    >
                      {'>'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(totalPages)}
                      disabled={page >= totalPages}
                      className="h-8 w-8"
                    >
                      {'>>'}
                    </Button>
                    <select
                      className="ml-4 border rounded px-2 py-1 text-sm"
                      value={pageSize}
                      onChange={e => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 20, 50, 100].map(size => (
                        <option key={size} value={size}>{size} per page</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Stock Out</DialogTitle>
          </DialogHeader>
          {selectedStockOut && (
            <form onSubmit={(e) => {
              e.preventDefault();
              updateStockOutMutation.mutate({
                id: selectedStockOut.id,
                status: 'approved',
                approved_quantity: approvedQuantity
              });
            }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="font-medium">Product: {selectedStockOut.product.name}</div>
                  <div className="text-sm text-gray-500">Requested Quantity: {selectedStockOut.quantity}</div>
                  <div className="text-sm text-gray-500">Destination: {selectedStockOut.destination}</div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approved_quantity">Approved Quantity</Label>
                  <Input 
                    id="approved_quantity"
                    type="number"
                    min={1}
                    max={selectedStockOut.quantity}
                    value={approvedQuantity}
                    onChange={(e) => setApprovedQuantity(parseInt(e.target.value) || 0)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    You can approve up to the requested quantity if inventory is available
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsApprovalDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={approvedQuantity <= 0 || approvedQuantity > selectedStockOut.quantity || updateStockOutMutation.isPending}
                >
                  {updateStockOutMutation.isPending ? 'Processing...' : 'Approve Stock Out'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockOutApproval;
