import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { useStockOutRequests } from '@/hooks/useStockOutRequests';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const AdminStockOutManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [processingRequest, setProcessingRequest] = useState<any | null>(null);
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [dummyRequests, setDummyRequests] = useState<any[]>([]);
  const [dummyInventory, setDummyInventory] = useState<Record<string, any>>({});
  const [dummyBatches, setDummyBatches] = useState<Record<string, any>>({});
  const [processQuantities, setProcessQuantities] = useState<Record<string, number>>({});
  const [processSummary, setProcessSummary] = useState<string | null>(null);

  // Fetch paginated stock out requests
  const {
    data: stockOutResult,
    isLoading,
    error
  } = useStockOutRequests({ status: statusFilter }, page, pageSize);

  const stockOutRequests = stockOutResult?.data ?? [];
  const totalCount = stockOutResult?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Dummy data for demonstration
  React.useEffect(() => {
    // Only set dummy data once
    if (dummyRequests.length === 0) {
      setDummyRequests([
        {
          id: 'req-1',
          created_at: new Date().toISOString(),
          product: { name: 'Luna Eraser' },
          requester: { name: 'Field Operator' },
          quantity: 10,
          status: 'pending',
          destination: 'client ramesh',
          approvedBy: null,
          invoice_number: null,
          packing_slip_number: null,
          // Dummy items for this request
          items: [
            {
              id: 'item-1',
              product_name: 'Luna Eraser',
              barcode: 'BOX-123',
              batch_id: 'BATCH-001',
              requested_quantity: 10,
              available_quantity: 10,
            },
          ],
        },
      ]);
      setDummyInventory({
        'BOX-123': {
          barcode: 'BOX-123',
          quantity: 10,
          batch_id: 'BATCH-001',
        },
      });
      setDummyBatches({
        'BATCH-001': { batch_id: 'BATCH-001', quantity: 10 },
      });
    }
  }, [dummyRequests.length]);

  const handleOpenProcessDialog = (request: any) => {
    setProcessingRequest(request);
    // Set initial process quantities to requested quantities
    const initialQuantities: Record<string, number> = {};
    request.items.forEach((item: any) => {
      initialQuantities[item.id] = item.requested_quantity;
    });
    setProcessQuantities(initialQuantities);
    setProcessDialogOpen(true);
    setProcessSummary(null);
  };

  const handleProcessQuantityChange = (itemId: string, value: string) => {
    const num = parseInt(value, 10);
    setProcessQuantities((prev) => ({ ...prev, [itemId]: isNaN(num) ? 0 : num }));
  };

  const handleProcessRequest = () => {
    if (!processingRequest) return;
    // Simulate deduction
    const updatedInventory = { ...dummyInventory };
    const updatedBatches = { ...dummyBatches };
    let summary = '';
    processingRequest.items.forEach((item: any) => {
      const qty = processQuantities[item.id] ?? 0;
      // Deduct from inventory
      if (updatedInventory[item.barcode]) {
        updatedInventory[item.barcode].quantity = Math.max(0, updatedInventory[item.barcode].quantity - qty);
      }
      // Deduct from batch
      if (updatedBatches[item.batch_id]) {
        updatedBatches[item.batch_id].quantity = Math.max(0, updatedBatches[item.batch_id].quantity - qty);
      }
      summary += `Processed ${qty} of ${item.product_name} (Box: ${item.barcode}, Batch: ${item.batch_id})\n`;
    });
    // Mark request as completed
    setDummyRequests((prev) =>
      prev.map((req) =>
        req.id === processingRequest.id ? { ...req, status: 'completed' } : req
      )
    );
    setDummyInventory(updatedInventory);
    setDummyBatches(updatedBatches);
    setProcessSummary(summary);
    toast({
      title: 'Stock Out Processed',
      description: 'Stock out request processed (dummy data).',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Out Management" description="Monitor and manage outgoing stock requests from all warehouses" />
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center">
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : dummyRequests.length ? (
                    dummyRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{request.product.name}</TableCell>
                        <TableCell>{request.requester?.name || 'Unknown'}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>{request.destination}</TableCell>
                        <TableCell>{request.approvedBy?.name || '—'}</TableCell>
                        <TableCell>
                          {request.invoice_number || request.packing_slip_number ? (
                            <>
                              {request.invoice_number && <div>Invoice: {request.invoice_number}</div>}
                              {request.packing_slip_number && <div>Packing Slip: {request.packing_slip_number}</div>}
                            </>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          {(request.status === 'pending' || request.status === 'approved') && (
                            <Button size="sm" onClick={() => handleOpenProcessDialog(request)}>
                              Process
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No stock out requests found
                      </TableCell>
                    </TableRow>
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
                {processingRequest.items.map((item: any) => (
                  <div key={item.id} className="mb-3 border-b pb-2 last:border-b-0 last:pb-0">
                    <div><b>Product:</b> {item.product_name}</div>
                    <div><b>Barcode:</b> {item.barcode}</div>
                    <div><b>Batch ID:</b> {item.batch_id}</div>
                    <div><b>Requested Quantity:</b> {item.requested_quantity}</div>
                    <div><b>Available Quantity:</b> {dummyInventory[item.barcode]?.quantity ?? item.available_quantity}</div>
                    {dummyBatches[item.batch_id]?.quantity === processQuantities[item.id] && (
                      <div className="text-yellow-700 text-xs font-semibold">Warning: This will deplete the batch!</div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <label htmlFor={`qty-${item.id}`} className="text-xs">Process Quantity:</label>
                      <Input
                        id={`qty-${item.id}`}
                        type="number"
                        min={1}
                        max={dummyInventory[item.barcode]?.quantity ?? item.available_quantity}
                        value={processQuantities[item.id] ?? item.requested_quantity}
                        onChange={e => handleProcessQuantityChange(item.id, e.target.value)}
                        className="w-24 h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {processSummary && (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-green-800 whitespace-pre-line">
                  <b>Process Summary:</b>\n{processSummary}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessRequest} disabled={!!processSummary}>Process</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStockOutManagement;
