
import React from 'react';
import { ScanResponse } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScanDataDisplayProps {
  scanData: ScanResponse['data'];
}

const ScanDataDisplay: React.FC<ScanDataDisplayProps> = ({ scanData }) => {
  if (!scanData) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in-transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <div>Scan Result</div>
          <Badge 
            variant="outline" 
            className={`${getStatusColor(scanData.status)} font-normal`}
          >
            {scanData.status || 'Unknown Status'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Product Information</h3>
            <div className="mt-1">
              <p className="font-medium">{scanData.product?.name}</p>
              {scanData.product?.sku && (
                <p className="text-sm text-muted-foreground">SKU: {scanData.product.sku}</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Box Details</h3>
            <div className="mt-1 grid grid-cols-2 gap-x-4">
              <div>
                <p className="text-sm">Box ID: <span className="font-mono">{scanData.box_id}</span></p>
                <p className="text-sm">Quantity: {scanData.box_quantity}</p>
              </div>
              <div>
                {scanData.attributes?.color && <p className="text-sm">Color: {scanData.attributes.color}</p>}
                {scanData.attributes?.size && <p className="text-sm">Size: {scanData.attributes.size}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
            <div className="mt-1">
              <p className="text-sm">{scanData.location?.warehouse}</p>
              <p className="text-sm">
                {scanData.location?.position} - {scanData.location?.zone}
              </p>
            </div>
          </div>
          
          {scanData.history && scanData.history.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Activity</h3>
              <div className="mt-1">
                {scanData.history.map((event, index) => (
                  <div key={index} className="text-xs flex justify-between border-b border-gray-100 py-1">
                    <span>{event.action}</span>
                    <span className="text-muted-foreground">{event.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScanDataDisplay;
