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
          id,
          created_at,
          status,
          customer_name,
          customer_company,
          customer_email,
          destination,
          shipping_method,
          required_date,
          priority,
          notes,
          reference_number,
          requested_by,
          stock_out_details!inner (
            id,
            quantity,
            product_id,
            barcode,
            products (
              id,
              name
            )
          ),
          requester:requested_by (
            id,
            name,
            email
          ),
          warehouses (
            id,
            name
          )
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

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

      return {
        data: data?.map(item => ({
          ...item,
          customer_name: item.customer_name || 'Unknown',
          customer_company: item.customer_company || null,
          destination: item.destination || '',
          status: item.status || 'pending',
          quantity: item.stock_out_details?.reduce((sum, detail) => sum + (detail.quantity || 0), 0) || 0,
          requester: item.requester || null,
          product: item.stock_out_details?.[0]?.products || null,
          warehouse: item.warehouses || null
        })) || [],
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
      accessorKey: 'product',
      header: 'Product Details',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.product?.name}</div>
          <div className="text-sm text-muted-foreground">Qty: {row.original.quantity}</div>
          {row.original.type && (
            <div className="text-xs text-muted-foreground">
              Type: {row.original.type}
              {row.original.batch_id && ` (Batch: ${row.original.batch_id})`}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer Information',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.customer_name}</div>
          {row.original.customer_company && (
            <div className="text-sm">{row.original.customer_company}</div>
          )}
          {row.original.customer_email && (
            <div className="text-xs text-muted-foreground">{row.original.customer_email}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'shipping',
      header: 'Shipping Details',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium">{row.original.destination}</div>
          {row.original.shipping_method && (
            <div className="text-sm">{row.original.shipping_method}</div>
          )}
          {row.original.required_date && (
            <div className="text-xs text-muted-foreground">
              Required: {format(new Date(row.original.required_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <Badge variant={getPriorityVariant(row.original.priority)}>{row.original.priority}</Badge>
      ),
    },
    {
      accessorKey: 'requestInfo',
      header: 'Request Information',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm">
            By: {row.original.requester?.name || 'Unknown'}
          </div>
          {row.original.reference_number && (
            <div className="text-xs">Ref: {row.original.reference_number}</div>
          )}
          {row.original.notes && (
            <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={row.original.notes}>
              Note: {row.original.notes}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => handleProcess(row.original)}
              >
                Process
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleReject(row.original)}
              >
                Reject
              </Button>
            </>
          )}
          {row.original.status === 'processing' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleProcess(row.original)}
            >
              Continue Processing
            </Button>
          )}
        </div>
      ),
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'rejected':
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
                    {columns.map((column) => (
                      <TableHead key={column.accessorKey}>{column.header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : stockOutRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                        No stock out requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    stockOutRequests.map((request) => (
                      <TableRow key={request.id}>
                        {columns.map((column) => (
                          <TableCell key={column.accessorKey}>
                            {column.cell({ row: { original: request } })}
                          </TableCell>
                        ))}
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
