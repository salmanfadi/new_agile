
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
import { ArrowLeftRight } from 'lucide-react';

const TransferHistoryTable: React.FC = () => {
  const { getTransferHistory } = useTransfers();
  const { data: transfers, isLoading, error } = getTransferHistory();
  
  // Group transfers by reference ID
  const groupedTransfers = React.useMemo(() => {
    if (!transfers) return [];
    
    const grouped = new Map();
    for (const transfer of transfers) {
      if (!transfer.transfer_reference_id) continue;
      
      if (!grouped.has(transfer.transfer_reference_id)) {
        grouped.set(transfer.transfer_reference_id, []);
      }
      
      grouped.get(transfer.transfer_reference_id).push(transfer);
    }
    
    // Convert to array of transfer pairs
    return Array.from(grouped.entries()).map(([referenceId, movements]) => {
      const sourceMovement = movements.find(m => 
        m.details && typeof m.details === 'object' && m.details.direction === 'out'
      );
      
      const destinationMovement = movements.find(m => 
        m.details && typeof m.details === 'object' && m.details.direction === 'in'
      );
      
      return {
        referenceId,
        sourceMovement,
        destinationMovement,
        date: sourceMovement?.created_at || '',
        status: sourceMovement?.status || 'unknown'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transfers]);
  
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
  
  if (!transfers || transfers.length === 0 || groupedTransfers.length === 0) {
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
            {groupedTransfers.map(({ referenceId, sourceMovement, destinationMovement, date, status }) => {
              if (!sourceMovement || !destinationMovement) return null;
              
              const product = sourceMovement.products;
              const sourceWarehouse = sourceMovement.warehouses;
              const sourceLocation = sourceMovement.warehouse_locations;
              const destWarehouse = destinationMovement.warehouses;
              const destLocation = destinationMovement.warehouse_locations;
              const quantity = Math.abs(sourceMovement.quantity);
              
              return (
                <TableRow key={referenceId}>
                  <TableCell>{new Date(date).toLocaleDateString()}</TableCell>
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
                  <TableCell>{quantity}</TableCell>
                  <TableCell>
                    <Badge variant={
                      status === 'approved' ? 'success' : 
                      status === 'rejected' ? 'destructive' : 
                      status === 'pending' ? 'outline' : 
                      'secondary'
                    }>
                      {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
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
