import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { StockInDetail } from '@/types/stockIn';

interface StockInDetailItemProps {
  detail: StockInDetail;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'processing':
      return 'bg-blue-500';
    case 'failed':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'processing':
      return <Clock className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return null;
  }
};

export const StockInDetailItem: React.FC<StockInDetailItemProps> = ({ detail }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Barcode:</span>
              <span className="font-mono">{detail.barcode}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Quantity:</span>
              <span>{detail.quantity}</span>
            </div>
            {detail.color && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Color:</span>
                <span>{detail.color}</span>
              </div>
            )}
            {detail.size && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Size:</span>
                <span>{detail.size}</span>
              </div>
            )}
            {detail.batch_number && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Batch:</span>
                <span className="font-mono text-sm">{detail.batch_number}</span>
              </div>
            )}
            {detail.processed_at && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Processed:</span>
                <span className="text-sm">
                  {new Date(detail.processed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className={getStatusColor(detail.status)}>
              <span className="flex items-center gap-1">
                {getStatusIcon(detail.status)}
                {detail.status.toUpperCase()}
              </span>
            </Badge>
            {detail.error_message && (
              <div className="text-sm text-red-600 max-w-[200px] text-right">
                {detail.error_message}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 