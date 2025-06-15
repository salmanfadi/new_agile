
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';

type StockOutStatus = 'pending' | 'approved' | 'rejected' | 'completed';

interface StockOutRequest {
  id: string;
  destination: string;
  notes?: string;
  status: StockOutStatus;
  created_at: string;
  updated_at: string;
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  stock_out_details: Array<{
    id: string;
    quantity: number;
    product_id: string;
    products?: {
      name: string;
      sku?: string;
      hsn_code?: string;
      gst_rate?: number;
    };
  }>;
  profiles?: {
    name?: string;
    username?: string;
  };
}

const StockOutManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | StockOutStatus>('all');

  const { data: stockOutRequests, isLoading } = useQuery({
    queryKey: ['stock-out-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('stock_out')
        .select(`
          id,
          destination,
          notes,
          status,
          created_at,
          updated_at,
          requested_by,
          approved_by,
          approved_at,
          stock_out_details (
            id,
            quantity,
            product_id,
            products (
              name,
              sku,
              hsn_code,
              gst_rate
            )
          ),
          profiles:requested_by (
            name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StockOutRequest[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StockOutStatus }) => {
      const { error } = await supabase
        .from('stock_out')
        .update({ 
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-out-requests'] });
      toast({
        title: 'Status updated',
        description: 'The stock out request status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error updating status',
        description: error instanceof Error ? error.message : 'Failed to update status',
      });
    },
  });

  const handleStatusUpdate = (id: string, status: StockOutStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusIcon = (status: StockOutStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: StockOutStatus) => {
    switch (status) {
      case 'approved':
        return 'default' as const;
      case 'completed':
        return 'default' as const;
      case 'rejected':
        return 'destructive' as const;
      default:
        return 'secondary' as const;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Stock Out Management" 
          description="Manage outgoing stock requests and approvals"
        />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Out Management" 
        description="Manage outgoing stock requests and approvals with HSN compliance"
      />
      
      <div className="flex items-center space-x-4">
        <Select value={statusFilter} onValueChange={(value: 'all' | StockOutStatus) => setStatusFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {stockOutRequests?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No stock out requests found</p>
                <p className="text-sm text-gray-400">
                  {statusFilter !== 'all'
                    ? `No ${statusFilter} requests at the moment`
                    : 'All stock out requests will appear here'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          stockOutRequests?.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Request to {request.destination}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <Badge variant={getStatusVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Requested by</p>
                      <p className="font-medium">
                        {request.profiles?.name || request.profiles?.username || 'Unknown User'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Requested on</p>
                      <p className="font-medium">
                        {format(new Date(request.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>

                  {request.notes && (
                    <div>
                      <p className="text-sm text-gray-500">Notes</p>
                      <p className="text-sm">{request.notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Items with HSN & GST Information</p>
                    <div className="space-y-2">
                      {request.stock_out_details.map((detail) => (
                        <div key={detail.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{detail.products?.name || 'Unknown Product'}</p>
                              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                {detail.products?.sku && (
                                  <span>SKU: {detail.products.sku}</span>
                                )}
                                {detail.products?.hsn_code && (
                                  <span>HSN: {detail.products.hsn_code}</span>
                                )}
                                {detail.products?.gst_rate !== null && detail.products?.gst_rate !== undefined && (
                                  <span>GST: {detail.products.gst_rate}%</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Qty: {detail.quantity}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'approved')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === 'approved' && (
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusUpdate(request.id, 'completed')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default StockOutManagement;
