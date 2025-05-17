
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
            {transfers.map((transfer) => {
              const product = transfer.products;
              const sourceWarehouse = transfer.source_warehouse;
              const sourceLocation = transfer.source_location;
              const destWarehouse = transfer.destination_warehouse;
              const destLocation = transfer.destination_location;
              
              return (
                <TableRow key={transfer.id}>
                  <TableCell>{new Date(transfer.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {product?.name} 
                    {product?.sku && <span className="text-xs text-gray-500 block">{product.sku}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{sourceWarehouse?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">
                      Floor {sourceLocation?.floor}, Zone {sourceLocation?.zone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{destWarehouse?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">
                      Floor {destLocation?.floor}, Zone {destLocation?.zone}
                    </div>
                  </TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={
                      transfer.status === 'approved' ? 'success' : 
                      transfer.status === 'rejected' ? 'destructive' : 
                      transfer.status === 'pending' ? 'outline' : 
                      'secondary'
                    }>
                      {transfer.status?.charAt(0).toUpperCase() + transfer.status?.slice(1) || 'Unknown'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TransferHistoryTable;
