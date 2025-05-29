import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { Loader2, Plus } from 'lucide-react';
import { useStockOutRequests } from '@/hooks/useStockOutRequests';
import { useProcessStockOut } from '@/hooks/useProcessStockOut';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import ProcessStockOutForm from '@/components/warehouse/ProcessStockOutForm';
import CreateStockOutForm from '@/components/warehouse/CreateStockOutForm';
import { Badge } from '@/components/ui/badge';

const AdminStockOutManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [processingRequest, setProcessingRequest] = useState<any | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [processQuantities, setProcessQuantities] = useState<Record<string, number>>({});
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStockOut, setSelectedStockOut] = useState<any | null>(null);
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch paginated stock out requests
  const {
    data: stockOutResult,
    isLoading,
    error,
    refetch: refetchStockOutRequests
  } = useQuery({
    queryKey: ['stock-out-requests', dateRange, statusFilter, searchQuery, page, pageSize],
    queryFn: async () => {
      let query = supabase
        .from('stock_out')
        .select(`
          *,
          requester:profiles!requester_id(*),
          approver:profiles!approved_by(*),
          processor:profiles!processed_by(*),
          warehouse:warehouses(*)
        `, { count: 'exact' });

      // Apply date range filter
      if (dateRange?.from) {
        query = query.gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        query = query.lte('created_at', format(dateRange.to, 'yyyy-MM-dd'));
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.or(`
          customer_name.ilike.%${searchQuery}%,
          customer_company.ilike.%${searchQuery}%,
          destination.ilike.%${searchQuery}%
        `);
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        data,
        totalCount: count || 0
      };
    },
  });

  const { mutate: processStockOut, isPending: isProcessing } = useProcessStockOut({
    onSuccess: () => {
      toast({
        title: 'Stock Out Processed',
        description: 'Stock out request has been successfully processed.',
      });
      setProcessDialogOpen(false);
      refetchStockOutRequests();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process stock out request.',
        variant: 'destructive',
      });
    },
  });

  const stockOutRequests = stockOutResult?.data ?? [];
  const totalCount = stockOutResult?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle automatic opening of process dialog based on URL params
  useEffect(() => {
    const requestId = searchParams.get('requestId');
    const openProcess = searchParams.get('openProcess');

    if (requestId && openProcess === 'true') {
      // If we have data but can't find the request, refetch to get latest
      if (stockOutRequests.length > 0) {
        const request = stockOutRequests.find(req => req.id === requestId);
        if (request) {
          handleOpenProcessDialog(request);
          // Clear the URL params after processing
          navigate(location.pathname, { replace: true });
        } else {
          // If we can't find the request in current data, refetch
          refetchStockOutRequests();
        }
      } else if (!isLoading) {
        // If we have no data and not loading, refetch
        refetchStockOutRequests();
      }
    }
  }, [searchParams, stockOutRequests, navigate, location.pathname, isLoading, refetchStockOutRequests]);

  const handleOpenProcessDialog = (request: any) => {
    setProcessingRequest(request);
    // Set initial process quantities to requested quantities
    const initialQuantities: Record<string, number> = {};
    request.details.forEach((detail: any) => {
      initialQuantities[detail.id] = detail.quantity;
    });
    setProcessQuantities(initialQuantities);
    setProcessDialogOpen(true);
  };

  const handleProcessQuantityChange = (itemId: string, value: string) => {
    const num = parseInt(value, 10);
    setProcessQuantities((prev) => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleProcessRequest = async () => {
    if (!processingRequest) {
      console.error('No processing request found');
      return;
    }

    console.log('Processing request:', {
      id: processingRequest.id,
      status: processingRequest.status,
      details: processingRequest.details
    });

    // Validate details exist
    if (!processingRequest.details || !Array.isArray(processingRequest.details)) {
      console.error('Invalid details array:', processingRequest.details);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Invalid request details',
      });
      return;
    }

    // Validate quantities
    const invalidDetails = processingRequest.details.find(detail => {
      const quantity = processQuantities[detail.id] ?? 0;
      console.log('Checking quantity for detail:', {
        detailId: detail.id,
        processQuantity: quantity,
        requestedQuantity: detail.quantity,
        availableQuantity: detail.available_quantity
      });
      
      if (quantity <= 0) {
        toast({
          variant: 'destructive',
          title: 'Invalid Quantity',
          description: `Process quantity must be greater than 0`,
        });
        return true;
      }

      if (detail.available_quantity !== undefined && quantity > detail.available_quantity) {
        toast({
          variant: 'destructive',
          title: 'Invalid Quantity',
          description: `Process quantity (${quantity}) cannot exceed available quantity (${detail.available_quantity})`,
        });
        return true;
      }

      return false;
    });

    if (invalidDetails) {
      console.error('Invalid quantities found:', {
        quantities: processQuantities,
        details: processingRequest.details
      });
      return;
    }

    const itemsToProcess = processingRequest.details.map((detail: any) => ({
      id: detail.id,
      quantity: processQuantities[detail.id] ?? 0,
    }));

    console.log('Items to process:', {
      requestId: processingRequest.id,
      items: itemsToProcess,
      quantities: processQuantities
    });

    try {
      await processStockOut({
        requestId: processingRequest.id,
        items: itemsToProcess,
      });
    } catch (error) {
      console.error('Error in handleProcessRequest:', error);
    }
  };

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

  const columns = [
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: ({ row }) => format(new Date(row.original.created_at), 'yyyy-MM-dd HH:mm'),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusVariant(row.original.status)}>{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: 'warehouse.name',
      header: 'Warehouse',
    },
    {
      accessorKey: 'destination',
      header: 'Destination',
    },
    {
      accessorKey: 'customer_name',
      header: 'Customer',
    },
    {
      accessorKey: 'customer_company',
      header: 'Company',
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={getPriorityVariant(row.original.priority)}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'requester.name',
      header: 'Requested By',
    },
    {
      accessorKey: 'processor.name',
      header: 'Processed By',
      cell: ({ row }) => {
        const processedBy = row.original.processed_by;
        return processedBy ? (
          <span>{row.original.processor?.name || 'Unknown'}</span>
        ) : (
          <span className="text-gray-400">Not processed</span>
        );
      },
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending_operator':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'secondary';
      case 'normal':
        return 'default';
      case 'high':
        return 'secondary';
      case 'urgent':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <PageHeader 
          title="Stock Out Management" 
          description="Monitor and manage outgoing stock requests"
        />
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Out Requests</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : stockOutRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        No stock out requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockOutRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{format(new Date(request.created_at), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{request.customer_name}</TableCell>
                        <TableCell>{request.customer_company || '—'}</TableCell>
                        <TableCell>{request.product?.name}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>{request.warehouse?.name}</TableCell>
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
                        <TableCell>{request.destination}</TableCell>
                        <TableCell>
                          {request.invoice_number || request.packing_slip_number ? (
                            <div className="space-y-1">
                              {request.invoice_number && (
                                <div className="text-sm">Invoice: {request.invoice_number}</div>
                              )}
                              {request.packing_slip_number && (
                                <div className="text-sm">Packing: {request.packing_slip_number}</div>
                              )}
                            </div>
                          ) : (
                            '—'
                          )}
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
                    ))
                  )}
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
      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Stock Out Request</DialogTitle>
            <DialogDescription>Review and process the items for this stock out request.</DialogDescription>
          </DialogHeader>
          {processingRequest && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <div><b>Date:</b> {format(new Date(processingRequest.created_at), 'MMM d, yyyy')}</div>
                <div><b>User:</b> {processingRequest.requester?.name}</div>
                <div><b>Destination:</b> {processingRequest.destination}</div>
              </div>
              <div className="border rounded-md p-3">
                <div className="font-semibold mb-2">Items to Process</div>
                {processingRequest.details.map((detail: any) => (
                  <div key={detail.id} className="mb-3 border-b pb-2 last:border-b-0 last:pb-0">
                    <div><b>Product:</b> {detail.product_name}</div>
                    <div><b>Barcode:</b> {detail.barcode || '—'}</div>
                    <div><b>Batch ID:</b> {detail.batch_id || '—'}</div>
                    <div><b>Requested Quantity:</b> {detail.quantity}</div>
                    <div><b>Available Quantity:</b> {detail.available_quantity || 0}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <label htmlFor={`qty-${detail.id}`} className="text-xs">Process Quantity:</label>
                      <Input
                        id={`qty-${detail.id}`}
                        type="number"
                        min={1}
                        max={detail.available_quantity || detail.quantity}
                        value={processQuantities[detail.id] ?? detail.quantity}
                        onChange={e => handleProcessQuantityChange(detail.id, e.target.value)}
                        className={cn(
                          "w-24 h-8 text-sm",
                          (!detail.available_quantity || detail.available_quantity < detail.quantity) && "border-yellow-500"
                        )}
                      />
                      {(!detail.available_quantity || detail.available_quantity < detail.quantity) && (
                        <div className="text-xs text-yellow-500">
                          Warning: Available quantity is less than requested
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleProcessRequest} 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

export default AdminStockOutManagement;
