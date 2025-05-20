
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ArrowRight, Box, BoxesIcon, Loader, Package, Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BatchItem } from '@/hooks/useProcessedBatchesWithItems';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

interface BatchDetailsViewProps {
  id: string;
  productName: string;
  productSku?: string;
  processorName?: string;
  totalBoxes: number;
  totalQuantity: number;
  warehouseName?: string;
  status: string;
  source?: string;
  notes?: string;
  createdAt: string;
  items: BatchItem[];
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  isLoading?: boolean;
  onPrint?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
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

const getBoxStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'available':
      return 'bg-green-100 text-green-800';
    case 'reserved':
      return 'bg-amber-100 text-amber-800';
    case 'sold':
      return 'bg-purple-100 text-purple-800';
    case 'damaged':
      return 'bg-red-100 text-red-800';
    case 'in_transit':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const BatchDetailsView: React.FC<BatchDetailsViewProps> = ({ 
  id,
  productName,
  productSku,
  processorName,
  totalBoxes,
  totalQuantity,
  warehouseName,
  status,
  source,
  notes,
  createdAt,
  items,
  progress,
  isLoading = false,
  onPrint
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>('all');
  const formattedDate = createdAt ? format(new Date(createdAt), 'PPP') : 'Unknown';
  
  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.status.toLowerCase() === filter.toLowerCase());
  
  const handleViewBoxDetails = (barcode: string) => {
    navigate(`/warehouse/box/${barcode}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batch Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Batch Summary</CardTitle>
              <Badge className={getStatusColor(status)}>
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Product</p>
                  <p className="font-medium">{productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium">{productSku || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Boxes</p>
                  <p className="font-medium">{totalBoxes}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="font-medium">{totalQuantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Processed By</p>
                  <p className="font-medium">{processorName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{formattedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <p className="font-medium">{source || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{warehouseName || 'Multiple'}</p>
                </div>
              </div>
              
              {notes && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm mt-1">{notes}</p>
                </div>
              )}
              
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{progress.completed}/{progress.total} boxes ({progress.percentage}%)</span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={onPrint}
                  className="w-full" 
                  variant="outline"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print All Barcodes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Box Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Box Status</CardTitle>
            <CardDescription>Current status of boxes in this batch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 text-green-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {items.filter(i => i.status.toLowerCase() === 'available').length}
                </div>
                <div className="text-sm mt-1">In Stock</div>
              </div>
              <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {items.filter(i => i.status.toLowerCase() === 'reserved').length}
                </div>
                <div className="text-sm mt-1">Reserved</div>
              </div>
              <div className="bg-purple-50 text-purple-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {items.filter(i => i.status.toLowerCase() === 'sold').length}
                </div>
                <div className="text-sm mt-1">Sold</div>
              </div>
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {items.filter(i => i.status.toLowerCase() === 'damaged').length}
                </div>
                <div className="text-sm mt-1">Damaged</div>
              </div>
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {items.filter(i => i.status.toLowerCase() === 'in_transit').length}
                </div>
                <div className="text-sm mt-1">In Transit</div>
              </div>
              <div className="bg-gray-50 text-gray-800 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold">
                  {totalBoxes}
                </div>
                <div className="text-sm mt-1">Total</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'available' ? 'default' : 'outline'}
                  onClick={() => setFilter('available')}
                >
                  In Stock
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'reserved' ? 'default' : 'outline'}
                  onClick={() => setFilter('reserved')}
                >
                  Reserved
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'sold' ? 'default' : 'outline'}
                  onClick={() => setFilter('sold')}
                >
                  Sold
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'damaged' ? 'default' : 'outline'}
                  onClick={() => setFilter('damaged')}
                >
                  Damaged
                </Button>
                <Button
                  size="sm"
                  variant={filter === 'in_transit' ? 'default' : 'outline'}
                  onClick={() => setFilter('in_transit')}
                >
                  In Transit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Boxes List */}
      <Card>
        <CardHeader>
          <CardTitle>Boxes</CardTitle>
          <CardDescription>
            {filter === 'all' 
              ? `All ${items.length} boxes in this batch` 
              : `${filteredItems.length} ${filter} boxes`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      {filter === 'all' ? 'No boxes found in this batch' : `No ${filter} boxes found`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Box className="h-4 w-4" />
                          {item.barcode}
                        </div>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Badge className={getBoxStatusColor(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase().replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.warehouseName}</TableCell>
                      <TableCell>{item.locationDetails}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBoxDetails(item.barcode)}
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
