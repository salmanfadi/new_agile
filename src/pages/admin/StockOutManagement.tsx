
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StockOutItem {
  id: string;
  product: { name: string; id: string | null };
  requester: { name: string; username: string; id: string | null } | null;
  quantity: number;
  approved_quantity: number | null;
  destination: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  invoice_number: string | null;
  packing_slip_number: string | null;
}

const AdminStockOutManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Fetch stock out requests with filter
  const { data: stockOutRequests, isLoading, error } = useQuery({
    queryKey: ['admin-stock-out-requests', statusFilter],
    queryFn: async () => {
      try {
        // Build query based on filter
        let query = supabase
          .from('stock_out')
          .select(`
            id,
            product_id,
            requested_by,
            quantity,
            approved_quantity,
            status,
            destination,
            reason,
            created_at,
            invoice_number,
            packing_slip_number
          `);
          
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        const { data: stockData, error: stockError } = await query
          .order('created_at', { ascending: false });

        if (stockError) {
          console.error('Error fetching stock out requests:', stockError);
          throw stockError;
        }

        if (!stockData || stockData.length === 0) {
          return [];
        }
        
        // Process each stock out record to fetch related data
        const processedData = await Promise.all(stockData.map(async (item) => {
          // Get product details
          let product = { name: 'Unknown Product', id: null };
          if (item.product_id) {
            const { data: productData } = await supabase
              .from('products')
              .select('id, name')
              .eq('id', item.product_id)
              .single();
            
            if (productData) {
              product = productData;
            }
          }
          
          // Get requester details
          let requester = null;
          if (item.requested_by) {
            try {
              // Get requester details from profiles table
              const { data: requesterData, error: requesterError } = await supabase
                .from('profiles')
                .select('id, name, username')
                .eq('id', item.requested_by)
                .maybeSingle();
              
              if (!requesterError && requesterData) {
                requester = {
                  id: requesterData.id,
                  name: requesterData.name || 'Unknown User',
                  username: requesterData.username
                };
              } else {
                // Fallback if profile not found
                requester = { 
                  id: item.requested_by,
                  name: 'Unknown User',
                  username: item.requested_by.substring(0, 8) + '...'
                };
              }
            } catch (err) {
              console.error(`Error fetching requester for ID: ${item.requested_by}`, err);
              requester = { 
                id: item.requested_by,
                name: 'Unknown User',
                username: 'unknown'
              };
            }
          }
          
          return {
            id: item.id,
            product,
            requester,
            quantity: item.quantity,
            approved_quantity: item.approved_quantity,
            status: item.status,
            created_at: item.created_at,
            destination: item.destination || 'Unknown Destination',
            reason: item.reason,
            invoice_number: item.invoice_number,
            packing_slip_number: item.packing_slip_number
          };
        }));
        
        return processedData;
      } catch (error) {
        console.error('Failed to fetch stock out requests:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        toast({
          variant: 'destructive',
          title: 'Failed to load stock requests',
          description: errorMessage,
        });
        return [];
      }
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Out Management" 
        description="Monitor and manage all stock out requests across warehouses"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/admin')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter:</span>
          <Select 
            value={statusFilter} 
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Status</SelectLabel>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Stock Out Requests</CardTitle>
          <CardDescription>Monitor and manage outgoing stock requests from all warehouses</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-red-500">
              Error loading stock out requests. Please try again.
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : !stockOutRequests || stockOutRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stock out requests found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockOutRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product?.name || 'Unknown Product'}</TableCell>
                      <TableCell>
                        {item.requester ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{item.requester.name}</span>
                            <span className="text-sm text-gray-600">@{item.requester.username}</span>
                          </div>
                        ) : (
                          <span className="text-amber-500">Unknown User</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.quantity}
                        {item.approved_quantity !== null && (
                          <span className="text-sm text-green-600 ml-2">
                            (Approved: {item.approved_quantity})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{item.destination}</TableCell>
                      <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/manager/stock-out-approval/${item.id}`)}
                        >
                          View Details
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
    </div>
  );
};

export default AdminStockOutManagement;
