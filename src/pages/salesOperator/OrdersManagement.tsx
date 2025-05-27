import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useOrders } from '@/hooks/useOrders';

const OrdersManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const { data: orders, isLoading, error } = useOrders();

  const filteredOrders = React.useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Orders Management" 
        description="View and manage customer orders"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
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
          ) : error ? (
            <div className="text-red-500 text-center py-4">
              Error loading orders
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
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
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'pending' ? 'secondary' : 'success'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersManagement; 