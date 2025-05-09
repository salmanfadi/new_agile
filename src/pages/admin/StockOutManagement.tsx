
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface StockOutItem {
  id: string;
  product: { name: string; id: string };
  requestedBy: { name: string; id: string; username: string } | null;
  approvedBy: { name: string; id: string; username: string } | null;
  quantity: number;
  approvedQuantity: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  destination: string;
  reason: string;
  created_at: string;
  invoice_number: string | null;
  packing_slip_number: string | null;
}

const AdminStockOutManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch stock out requests with filter
  const { data: stockOutRequests, isLoading, error } = useQuery({
    queryKey: ['admin-stock-out-requests', statusFilter],
    queryFn: async () => {
      console.log('Fetching stock out requests with filter:', statusFilter);
      try {
        // Build query based on filter
        let query = supabase
          .from('stock_out')
          .select(`
            id,
            product_id,
            requested_by,
            approved_by,
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
          query = query.eq('status', statusFilter as "pending" | "approved" | "rejected" | "completed" | "processing");
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
          let product = { name: 'Unknown Product', id: item.product_id || '' };
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
          let requestedBy = null;
          if (item.requested_by) {
            const { data: requesterData } = await supabase
              .from('profiles')
              .select('id, name, username')
              .eq('id', item.requested_by)
              .maybeSingle();
            
            if (requesterData) {
              requestedBy = {
                id: requesterData.id,
                name: requesterData.name || 'Unknown User',
                username: requesterData.username
              };
            } else {
              requestedBy = { 
                id: item.requested_by,
                name: 'Unknown User',
                username: item.requested_by.substring(0, 8) + '...'
              };
            }
          }
          
          // Get approver details if exists
          let approvedBy = null;
          if (item.approved_by) {
            const { data: approverData } = await supabase
              .from('profiles')
              .select('id, name, username')
              .eq('id', item.approved_by)
              .maybeSingle();
            
            if (approverData) {
              approvedBy = {
                id: approverData.id,
                name: approverData.name || 'Unknown Approver',
                username: approverData.username
              };
            } else {
              approvedBy = { 
                id: item.approved_by,
                name: 'Unknown Approver',
                username: item.approved_by.substring(0, 8) + '...'
              };
            }
          }
          
          return {
            id: item.id,
            product,
            requestedBy,
            approvedBy,
            quantity: item.quantity,
            approvedQuantity: item.approved_quantity || 0,
            status: item.status,
            destination: item.destination,
            reason: item.reason,
            created_at: item.created_at,
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
          title: 'Failed to load stock out requests',
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead>Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : stockOutRequests?.length ? (
                    stockOutRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{request.product.name}</TableCell>
                        <TableCell>{request.requestedBy?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          {request.status === 'approved' || request.status === 'completed' ? 
                            `${request.approvedQuantity} / ${request.quantity}` : 
                            request.quantity
                          }
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>{request.destination}</TableCell>
                        <TableCell>{request.approvedBy?.name || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {request.invoice_number ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-1">
                              INV: {request.invoice_number}
                            </span>
                          ) : null}
                          {request.packing_slip_number ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              PS: {request.packing_slip_number}
                            </span>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No stock out requests found
                      </TableCell>
                    </TableRow>
                  )}
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
