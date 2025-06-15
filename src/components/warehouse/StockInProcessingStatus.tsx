import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { StockIn, StockInDetail } from '@/types/stockIn';

interface StockInProcessingStatusProps {
  stockIn: StockIn;
  details: StockInDetail[];
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

export const StockInProcessingStatus: React.FC<StockInProcessingStatusProps> = ({
  stockIn,
  details
}) => {
  const totalItems = details.length;
  const completedItems = details.filter(d => d.status === 'completed').length;
  const failedItems = details.filter(d => d.status === 'failed').length;
  const processingItems = details.filter(d => d.status === 'processing').length;
  const pendingItems = details.filter(d => d.status === 'pending').length;

  const progress = (completedItems / totalItems) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Processing Status</span>
          <Badge variant="outline" className={getStatusColor(stockIn.status)}>
            {stockIn.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Items Status</div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Completed
                </span>
                <span>{completedItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Processing
                </span>
                <span>{processingItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Pending
                </span>
                <span>{pendingItems}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Failed
                </span>
                <span>{failedItems}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Processing Details</div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span>Batch ID</span>
                <span className="font-mono">{stockIn.batch_id}</span>
              </div>
              {stockIn.processing_started_at && (
                <div className="flex items-center justify-between text-sm">
                  <span>Started At</span>
                  <span>{new Date(stockIn.processing_started_at).toLocaleString()}</span>
                </div>
              )}
              {stockIn.processing_completed_at && (
                <div className="flex items-center justify-between text-sm">
                  <span>Completed At</span>
                  <span>{new Date(stockIn.processing_completed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {failedItems > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-red-500 mb-2">Failed Items</div>
            <div className="space-y-2">
              {details
                .filter(d => d.status === 'failed')
                .map(detail => (
                  <div key={detail.id} className="text-sm p-2 bg-red-50 rounded-md">
                    <div className="font-medium">Barcode: {detail.barcode}</div>
                    {detail.error_message && (
                      <div className="text-red-600 mt-1">{detail.error_message}</div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 