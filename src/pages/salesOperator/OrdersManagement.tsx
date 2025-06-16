
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Package, Plus, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { useOrders } from '@/hooks/useOrders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateSalesOrderForm } from '@/components/sales/CreateSalesOrderForm';
import { useSalesOrders } from '@/hooks/useSalesOrders';

const OrdersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { salesOrders, isLoading, createSalesOrder, pushToStockOut } = useSalesOrders();

  const filteredOrders = React.useMemo(() => {
    if (!salesOrders) return [];
    return salesOrders.filter(order => 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.sales_order_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesOrders, searchTerm]);

  const handleCreateOrder = async (orderData: any) => {
    try {
      await createSalesOrder.mutateAsync(orderData);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const [orderToPush, setOrderToPush] = useState<any | null>(null);
  const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);

  const handlePushToStockOut = async (order: any) => {
    try {
      await pushToStockOut.mutateAsync(order);
      setIsPushDialogOpen(false);
      setOrderToPush(null);
    } catch (error) {
      console.error('Error pushing to stock-out:', error);
      // Error is handled by the mutation's onError callback
    }
  };
  
  const openPushConfirmation = (order: any) => {
    setOrderToPush(order);
    setIsPushDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Processing</Badge>;
      case 'dispatched':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Dispatched</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canPushToStockOut = (order: any) => {
    return ['pending', 'confirmed', 'processing'].includes(order.status) && !order.pushed_to_stockout;
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Orders Management" 
        description="View and manage sales orders, push them to stock-out processing"
      />
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Sales Orders</CardTitle>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.sales_order_number}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customer_name}</div>
                        <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{order.customer_company}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(order.order_date), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {order.items.length} items
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                      {order.pushed_to_stockout && (
                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700">
                          In Stock-Out
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {canPushToStockOut(order) && (
                        <Button
                          onClick={() => openPushConfirmation(order)}
                          disabled={pushToStockOut.isPending}
                          size="sm"
                          className="flex items-center gap-2"
                          variant="secondary"
                        >
                          <Truck className="h-4 w-4" />
                          {pushToStockOut.isPending && pushToStockOut.variables?.id === order.id 
                            ? 'Processing...' 
                            : 'Push to Stock-Out'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No sales orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
            <DialogDescription>
              Create a new sales order from customer requirements
            </DialogDescription>
          </DialogHeader>
          <CreateSalesOrderForm
            onSubmit={handleCreateOrder}
            onCancel={() => setIsCreateDialogOpen(false)}
            isLoading={createSalesOrder.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Push to Stock-Out Confirmation Dialog */}
      <Dialog open={isPushDialogOpen} onOpenChange={setIsPushDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Push Order to Stock-Out</DialogTitle>
            <DialogDescription>
              This will create a stock-out request for warehouse processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {orderToPush && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="font-medium">Order Number:</div>
                  <div>{orderToPush.sales_order_number}</div>
                  <div className="font-medium">Customer:</div>
                  <div>{orderToPush.customer_name}</div>
                  <div className="font-medium">Company:</div>
                  <div>{orderToPush.customer_company}</div>
                  <div className="font-medium">Items:</div>
                  <div>{orderToPush.items.length} items</div>
                </div>
                <div className="border-t pt-2">
                  <p className="text-sm text-muted-foreground">
                    This action will mark the order as "processing" and create a stock-out request for the warehouse team.
                  </p>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPushDialogOpen(false)} disabled={pushToStockOut.isPending}>
              Cancel
            </Button>
            <Button 
              onClick={() => orderToPush && handlePushToStockOut(orderToPush)}
              disabled={pushToStockOut.isPending}
              className="flex items-center gap-2"
            >
              {pushToStockOut.isPending && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {pushToStockOut.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersManagement;
