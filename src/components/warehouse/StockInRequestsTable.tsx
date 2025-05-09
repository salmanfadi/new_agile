
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface StockInData {
  id: string;
  product: { name: string; id?: string | null };
  submitter: { name: string; username: string; id?: string | null } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  rejection_reason?: string;
}

interface StockInRequestsTableProps {
  stockInRequests: StockInData[];
  isLoading: boolean;
  onProcess: (stockIn: StockInData) => void;
  onReject: (stockIn: StockInData) => void;
  userId: string | undefined;
}

export const StockInRequestsTable: React.FC<StockInRequestsTableProps> = ({
  stockInRequests,
  isLoading,
  onProcess,
  onReject,
  userId,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!stockInRequests || stockInRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pending stock in requests
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Boxes</TableHead>
            <TableHead>Submission Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stockInRequests.map((stockIn) => (
            <TableRow key={stockIn.id} className={stockIn.status === 'pending' ? "bg-green-50" : undefined}>
              <TableCell className="font-medium">{stockIn.product?.name || 'Unknown Product'}</TableCell>
              <TableCell>
                {stockIn.submitter ? (
                  <div className="flex flex-col">
                    <span className="font-medium">{stockIn.submitter.name}</span>
                    <span className="text-sm text-gray-600">@{stockIn.submitter.username}</span>
                  </div>
                ) : (
                  <span className="text-amber-500">Unknown User</span>
                )}
              </TableCell>
              <TableCell>{stockIn.source}</TableCell>
              <TableCell>{stockIn.boxes}</TableCell>
              <TableCell>{new Date(stockIn.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <StatusBadge status={stockIn.status} />
              </TableCell>
              <TableCell className="text-right space-x-2">
                {stockIn.status === 'pending' && (
                  <>
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => onProcess(stockIn)}
                    >
                      Process
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600"
                      onClick={() => onReject(stockIn)}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {stockIn.status === 'rejected' && stockIn.rejection_reason && (
                  <div className="text-xs text-red-600">
                    Reason: {stockIn.rejection_reason}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
