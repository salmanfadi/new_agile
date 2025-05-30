import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useStockOut } from '@/hooks/useStockOut';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

const StockOutForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { submitStockOut, isLoading: isSubmitting } = useStockOut();

  // Form state
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    destination: '',
    notes: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    requiredDate: ''
  });

  // Fetch products for dropdown
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch pending stock out requests
  const { data: stockOutRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['stock-out-requests-operator'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          *,
          products (id, name, sku),
          requested_by_profile:profiles!requested_by(name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit requests',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid quantity',
        variant: 'destructive',
      });
      return;
    }

    try {
      await submitStockOut.mutateAsync({
        ...formData,
        quantity,
        userId: user.id,
      });

      // Reset form on success
      setFormData({
        productId: '',
        quantity: '',
        destination: '',
        notes: '',
        priority: 'normal',
        requiredDate: ''
      });

      // Navigate to submissions page
      navigate('/operator/submissions');
    } catch (error) {
      console.error('Error submitting stock out:', error);
    }
  };

  const handleComplete = async (stockOut: any) => {
    try {
      // Update stock out status
      const { error: updateError } = await supabase
        .from('stock_out')
        .update({
          status: 'completed',
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
        })
        .eq('id', stockOut.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Stock out has been completed.',
      });
    } catch (error) {
      console.error('Error completing stock out:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete stock out',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Stock Out Management</h1>
      </div>

      {/* Create Stock Out Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Stock Out Request</CardTitle>
          <CardDescription>Submit a new stock out request</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} {product.sku && `(${product.sku})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredDate">Required Date</Label>
              <Input
                id="requiredDate"
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, requiredDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes"
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Stock Out Requests</CardTitle>
          <CardDescription>Process stock out requests from warehouse managers</CardDescription>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Loading requests...</p>
            </div>
          ) : !stockOutRequests?.length ? (
            <div className="text-center py-4 text-muted-foreground">
              No pending stock out requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Required Date</TableHead>
                  <TableHead>Notes</TableHead>
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
                      <div>{request.products?.name}</div>
                      {request.products?.sku && (
                        <div className="text-sm text-muted-foreground">
                          SKU: {request.products.sku}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>{request.destination}</TableCell>
                    <TableCell>
                      <Badge variant={
                        request.priority === 'urgent' ? 'destructive' :
                        request.priority === 'high' ? 'default' :
                        'secondary'
                      }>
                        {request.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.required_date ? 
                        format(new Date(request.required_date), 'MMM d, yyyy') :
                        'Not specified'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate">
                        {request.notes || 'No notes'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => handleComplete(request)}
                      >
                        Complete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockOutForm;
