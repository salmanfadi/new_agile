import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Product } from '@/types/database';

interface StockOutData {
  id: string;
  product: { name: string; id: string };
  requester: { name: string; username: string } | null;
  quantity: number;
  approved_quantity: number | null;
  destination: string;
  reason: string | null;
  status: string;
  created_at: string;
}

const StockOutApproval: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [selectedStockOut, setSelectedStockOut] = useState<StockOutData | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvedQuantity, setApprovedQuantity] = useState<number>(0);

  // Fetch pending stock out requests
  const { data: stockOutRequests, isLoading } = useQuery({
    queryKey: ['stock-out-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          id,
          product:product_id(name, id),
          requester:requested_by(name, username),
          quantity,
          approved_quantity,
          destination,
          reason,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to handle potential embedding errors
      return (data as any[]).map(item => ({
        id: item.id,
        product: item.product || { name: 'Unknown Product', id: '' },
        requester: item.requester && !item.requester.error ? item.requester : { name: 'Unknown', username: 'unknown' },
        quantity: item.quantity,
        approved_quantity: item.approved_quantity,
        destination: item.destination,
        reason: item.reason,
        status: item.status,
        created_at: item.created_at
      })) as StockOutData[];
    },
  });

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

  const handleApprove = async (stockOut: StockOutData) => {
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

  const handleApprovalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockOut) return;

    updateStockOutMutation.mutate({
      id: selectedStockOut.id,
      status: 'approved',
      approved_quantity: approvedQuantity
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Out Approval" 
        description="Review and approve stock out requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
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
                  {stockOutRequests.map((stockOut) => (
                    <TableRow key={stockOut.id} className="bg-blue-50">
                      <TableCell className="font-medium">{stockOut.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell>{stockOut.requester ? `${stockOut.requester.name} (${stockOut.requester.username})` : 'Unknown'}</TableCell>
                      <TableCell>{stockOut.quantity}</TableCell>
                      <TableCell>{stockOut.destination}</TableCell>
                      <TableCell>{stockOut.reason || '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={stockOut.status as any} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600"
                          onClick={() => handleApprove(stockOut)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleStatusUpdate(stockOut.id, 'rejected')}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <form onSubmit={handleApprovalSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="font-medium">Product: {selectedStockOut.product?.name}</div>
                  <div className="text-sm text-gray-500">Requested Quantity: {selectedStockOut.quantity}</div>
                  <div className="text-sm text-gray-500">Destination: {selectedStockOut.destination}</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="approved_quantity">Approved Quantity</Label>
                  <Input 
                    id="approved_quantity"
                    type="number"
                    min="1"
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
