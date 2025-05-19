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

const AdminStockOutManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch paginated stock out requests
  const {
    data: stockOutResult,
    isLoading,
    error
  } = useStockOutRequests({ status: statusFilter }, page, pageSize);

  const stockOutRequests = stockOutResult?.data ?? [];
  const totalCount = stockOutResult?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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
                        <TableCell>{request.requester?.name || 'Unknown'}</TableCell>
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
                        <TableCell>
                          {request.invoice_number || request.packing_slip_number ? (
                            <>
                              {request.invoice_number && <div>Invoice: {request.invoice_number}</div>}
                              {request.packing_slip_number && <div>Packing Slip: {request.packing_slip_number}</div>}
                            </>
                          ) : '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
    </div>
  );
};

export default AdminStockOutManagement;
