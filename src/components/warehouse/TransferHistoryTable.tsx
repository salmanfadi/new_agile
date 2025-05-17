
import React from 'react';
import { useTransfers } from '@/hooks/useTransfers';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TransferStatus } from '@/types/database';

const TransferHistoryTable: React.FC = () => {
  const { getTransferHistory } = useTransfers();
  const { data: transfers, isLoading, error } = getTransferHistory();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>Loading transfer history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription className="text-red-500">
            Error loading transfer history. Please try again.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  if (!transfers || transfers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>No transfer history found</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const getStatusVariant = (status: TransferStatus) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'outline';
      case 'completed':
        return 'success';
      case 'in_transit':
        return 'secondary'; 
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transfer History</CardTitle>
            <CardDescription>View past inventory transfers</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers && transfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {transfer.products?.name || 'Unknown Product'} 
                  {transfer.products?.sku && <span className="text-xs text-gray-500 block">{transfer.products.sku}</span>}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{transfer.source_warehouse?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">
                    Floor {transfer.source_location?.floor || '?'}, Zone {transfer.source_location?.zone || '?'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{transfer.destination_warehouse?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">
                    Floor {transfer.destination_location?.floor || '?'}, Zone {transfer.destination_location?.zone || '?'}
                  </div>
                </TableCell>
                <TableCell>{transfer.quantity}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(transfer.status as TransferStatus)}>
                    {transfer.status ? (transfer.status.charAt(0).toUpperCase() + transfer.status.slice(1)) : 'Unknown'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransferHistoryTable;
