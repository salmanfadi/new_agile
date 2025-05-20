
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import BarcodePreview from '@/components/barcode/BarcodePreview';
import { Button } from '@/components/ui/button';
import { Printer, RefreshCcw } from 'lucide-react';
import { format } from 'date-fns';

// Types for box details
export interface BoxDetails {
  id: string;
  barcode: string;
  productId: string;
  productName: string;
  productSku?: string;
  quantity: number;
  color?: string;
  size?: string;
  status: 'In Stock' | 'In Transit' | 'Sold' | 'Reserved' | 'Damaged';
  batchId: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationCode: string;
  locationDetails: string;
  createdAt: string;
  lastScanned?: {
    timestamp: string;
    location: string;
    user: {
      name: string;
      role: string;
    };
  };
  scanHistory: ScanHistoryItem[];
  statusHistory: StatusHistoryItem[];
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  location?: string;
  user?: {
    name: string;
    role: string;
  };
  details?: string;
}

export interface StatusHistoryItem {
  id: string;
  timestamp: string;
  status: string;
  user: {
    name: string;
    role: string;
  };
  notes?: string;
}

interface BoxDetailsViewProps {
  box: BoxDetails;
  onRefresh: () => void;
  onPrint: () => void;
}

export const BoxDetailsView: React.FC<BoxDetailsViewProps> = ({ box, onRefresh, onPrint }) => {
  const formatDateTime = (dateString: string): string => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Helper function to map status to appropriate variant
  const getStatusVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (status) {
      case 'In Stock':
        return 'default';
      case 'In Transit':
        return 'secondary';
      case 'Sold':
        return 'success';
      case 'Reserved':
        return 'outline';
      case 'Damaged':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-2xl">Box Details</CardTitle>
              <p className="text-muted-foreground mt-1">Information about box {box.barcode}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCcw className="mr-1 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={onPrint}>
                <Printer className="mr-1 h-4 w-4" />
                Print Barcode
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Box Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Barcode Preview */}
            <div className="flex flex-col items-center justify-center border rounded-md p-4">
              <div className="mb-2">
                <BarcodePreview barcode={box.barcode} width={200} height={80} />
              </div>
              <p className="font-mono text-sm">{box.barcode}</p>
              <Badge className="mt-2" variant={getStatusVariant(box.status)}>
                {box.status}
              </Badge>
            </div>

            {/* Product Details */}
            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Product Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{box.productName}</p>
                </div>
                {box.productSku && (
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{box.productSku}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Quantity</p>
                  <p className="font-medium">{box.quantity}</p>
                </div>
                <div className="flex gap-4">
                  {box.color && (
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p className="font-medium">{box.color}</p>
                    </div>
                  )}
                  {box.size && (
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium">{box.size}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Location Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{box.warehouseName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location Code</p>
                  <p className="font-medium">{box.locationCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Details</p>
                  <p className="font-medium">{box.locationDetails}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Batch ID</p>
                  <p className="font-medium">{box.batchId.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Last Scanned */}
          {box.lastScanned && (
            <div className="border rounded-md p-4">
              <h3 className="font-semibold mb-2">Last Scanned</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{formatDateTime(box.lastScanned.timestamp)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{box.lastScanned.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{box.lastScanned.user.name} <span className="text-xs text-muted-foreground">({box.lastScanned.user.role})</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs for History */}
          <Tabs defaultValue="scan-history" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan-history">Scan History</TabsTrigger>
              <TabsTrigger value="status-history">Status History</TabsTrigger>
            </TabsList>
            <TabsContent value="scan-history" className="mt-4">
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-medium">Time</th>
                        <th className="p-2 text-left font-medium">Action</th>
                        <th className="p-2 text-left font-medium">Location</th>
                        <th className="p-2 text-left font-medium">User</th>
                        <th className="p-2 text-left font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {box.scanHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">
                            No scan history available
                          </td>
                        </tr>
                      ) : (
                        box.scanHistory.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2 text-sm">{formatDateTime(item.timestamp)}</td>
                            <td className="p-2 text-sm font-medium">{item.action}</td>
                            <td className="p-2 text-sm">{item.location || '-'}</td>
                            <td className="p-2 text-sm">
                              {item.user ? (
                                <>
                                  {item.user.name} <span className="text-xs text-muted-foreground">({item.user.role})</span>
                                </>
                              ) : '-'}
                            </td>
                            <td className="p-2 text-sm">{item.details || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="status-history" className="mt-4">
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 text-left font-medium">Time</th>
                        <th className="p-2 text-left font-medium">Status</th>
                        <th className="p-2 text-left font-medium">User</th>
                        <th className="p-2 text-left font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {box.statusHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            No status history available
                          </td>
                        </tr>
                      ) : (
                        box.statusHistory.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2 text-sm">{formatDateTime(item.timestamp)}</td>
                            <td className="p-2 text-sm">
                              <Badge variant="outline">{item.status}</Badge>
                            </td>
                            <td className="p-2 text-sm">
                              {item.user.name} <span className="text-xs text-muted-foreground">({item.user.role})</span>
                            </td>
                            <td className="p-2 text-sm">{item.notes || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between flex-col sm:flex-row gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Created on {formatDateTime(box.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Box ID: {box.id}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};
