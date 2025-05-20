
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Clock, Eye, Printer } from 'lucide-react';
import { format, formatDistance } from 'date-fns';

interface BatchProgressCardProps {
  id: string;
  productName: string;
  productSku?: string;
  processorName?: string;
  totalBoxes: number;
  progress: number;
  createdAt: string;
  warehouseName?: string;
  status: 'completed' | 'processing' | 'failed' | 'cancelled';
  onViewDetails: (id: string) => void;
  onPrintBarcodes: (id: string) => void;
}

export const BatchProgressCard: React.FC<BatchProgressCardProps> = ({
  id,
  productName,
  productSku,
  processorName,
  totalBoxes,
  progress,
  createdAt,
  warehouseName,
  status,
  onViewDetails,
  onPrintBarcodes
}) => {
  const shortId = id.substring(0, 8).toUpperCase();
  const timeAgo = formatDistance(new Date(createdAt), new Date(), { addSuffix: true });
  const formattedDate = format(new Date(createdAt), 'MMM d, yyyy');
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className={`h-1.5 ${status === 'completed' ? 'bg-green-500' : status === 'processing' ? 'bg-blue-500' : status === 'failed' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-medium">Batch #{shortId}</h3>
            <p className="text-muted-foreground text-sm">{productName}</p>
            {productSku && <p className="text-xs text-muted-foreground">SKU: {productSku}</p>}
          </div>
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Boxes</p>
              <p className="font-medium">{totalBoxes}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Processed By</p>
              <p className="font-medium">{processorName || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium" title={formattedDate}>{timeAgo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Warehouse</p>
              <p className="font-medium">{warehouseName || 'Multiple'}</p>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <Button 
          variant="ghost" 
          size="sm"
          className="text-muted-foreground" 
          onClick={() => onPrintBarcodes(id)}
        >
          <Printer className="h-4 w-4 mr-1" />
          Print
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onViewDetails(id)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Details
        </Button>
      </CardFooter>
    </Card>
  );
};
