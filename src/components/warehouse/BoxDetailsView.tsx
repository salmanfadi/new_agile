
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarcodePreview } from '@/components/barcode/BarcodePreview';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Archive, ArrowRight, Clock, MapPin, Package, Printer, RefreshCw, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
  user?: {
    name: string;
    role: string;
  };
  notes?: string;
}

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

interface BoxDetailsViewProps {
  box: BoxDetails;
  isLoading?: boolean;
  onRefresh?: () => void;
  onPrint?: () => void;
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'In Stock':
      return 'bg-green-100 text-green-800';
    case 'In Transit':
      return 'bg-blue-100 text-blue-800';
    case 'Sold':
      return 'bg-purple-100 text-purple-800';
    case 'Reserved':
      return 'bg-amber-100 text-amber-800';
    case 'Damaged':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const BoxDetailsView: React.FC<BoxDetailsViewProps> = ({ 
  box, 
  isLoading = false,
  onRefresh,
  onPrint
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-40 bg-gray-200 rounded"></div>
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Box Details</h2>
          <p className="text-muted-foreground">
            {box.productName} ({box.productSku || 'No SKU'})
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-1" /> Print Barcode
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details & barcode card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-xl">Box {box.barcode}</CardTitle>
              <CardDescription>
                Part of Batch #{box.batchId.substring(0, 8).toUpperCase()}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(box.status)}>
              {box.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 flex flex-col items-center mb-6">
              <BarcodePreview value={box.barcode} height={100} />
              <p className="mt-2 font-mono text-sm">{box.barcode}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Product Information</h4>
                  <p className="font-medium">{box.productName}</p>
                  {box.productSku && <p className="text-sm text-muted-foreground">SKU: {box.productSku}</p>}
                  <p className="mt-1">Quantity: <strong>{box.quantity}</strong></p>
                  {box.color && <p className="text-sm">Color: {box.color}</p>}
                  {box.size && <p className="text-sm">Size: {box.size}</p>}
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Creation Information</h4>
                  <p className="text-sm">Created on {format(new Date(box.createdAt), 'PPP')}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Current Location
                  </h4>
                  <p className="font-medium">{box.warehouseName}</p>
                  <p className="text-sm">{box.locationDetails}</p>
                  <Badge variant="outline" className="mt-1">
                    {box.locationCode}
                  </Badge>
                </div>
                
                {box.lastScanned && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Last Scanned
                    </h4>
                    <p className="text-sm">
                      {format(new Date(box.lastScanned.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p className="text-sm">by {box.lastScanned.user.name}</p>
                    <p className="text-sm text-muted-foreground">{box.lastScanned.location}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="default" className="w-full justify-start">
              <MapPin className="mr-2 h-4 w-4" />
              Move to New Location
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <User className="mr-2 h-4 w-4" />
              Assign to User
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Archive className="mr-2 h-4 w-4" />
              Mark as Damaged
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <ArrowRight className="mr-2 h-4 w-4" />
              Mark as Sold
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive">
              <Package className="mr-2 h-4 w-4" />
              Delete Box
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Timeline cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scan History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scan History</CardTitle>
            <CardDescription>A record of box scans and movements</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {box.scanHistory.length > 0 ? (
                box.scanHistory.map((scan, index) => (
                  <div key={scan.id} className="relative pl-6 pb-4">
                    {/* Timeline line */}
                    {index < box.scanHistory.length - 1 && (
                      <div className="absolute top-2 left-2 h-full w-0.5 -translate-x-1/2 bg-muted"></div>
                    )}
                    {/* Timeline dot */}
                    <div className="absolute top-2 left-2 h-4 w-4 -translate-x-1/2 rounded-full bg-primary"></div>
                    
                    <div>
                      <p className="font-medium">{scan.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(scan.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                      {scan.location && (
                        <p className="text-sm mt-1">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {scan.location}
                        </p>
                      )}
                      {scan.user && (
                        <p className="text-sm">
                          <User className="h-3 w-3 inline mr-1" />
                          {scan.user.name} ({scan.user.role})
                        </p>
                      )}
                      {scan.details && (
                        <p className="text-xs text-muted-foreground mt-1">{scan.details}</p>
                      )}
                    </div>
                    
                    {index < box.scanHistory.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No scan history available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status History</CardTitle>
            <CardDescription>Status changes over time</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {box.statusHistory.length > 0 ? (
                box.statusHistory.map((status, index) => (
                  <div key={status.id} className="relative pl-6 pb-4">
                    {/* Timeline line */}
                    {index < box.statusHistory.length - 1 && (
                      <div className="absolute top-2 left-2 h-full w-0.5 -translate-x-1/2 bg-muted"></div>
                    )}
                    {/* Timeline dot */}
                    <div className="absolute top-2 left-2 h-4 w-4 -translate-x-1/2 rounded-full bg-secondary"></div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(status.status)}`}>
                          {status.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(new Date(status.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                      {status.user && (
                        <p className="text-sm">
                          <User className="h-3 w-3 inline mr-1" />
                          {status.user.name} ({status.user.role})
                        </p>
                      )}
                      {status.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{status.notes}</p>
                      )}
                    </div>
                    
                    {index < box.statusHistory.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No status history available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
