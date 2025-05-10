
import React from 'react';
import { ScanResponse } from '@/types/auth';
import { Package, MapPin, CheckCircle, AlertCircle, Box, Tag } from 'lucide-react';

interface ScanDataDisplayProps {
  scanData: ScanResponse['data'];
}

const ScanDataDisplay: React.FC<ScanDataDisplayProps> = ({ scanData }) => {
  if (!scanData) return null;
  
  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'text-green-600';
      case 'reserved':
        return 'text-amber-600';
      case 'out_of_stock':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'reserved':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'out_of_stock':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };
  
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-primary/10 p-4 rounded-md">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {scanData.product.name}
        </h3>
        <p className="text-sm text-muted-foreground">SKU: {scanData.product.sku}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <Box className="h-4 w-4 text-blue-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Box ID</p>
            <p className="text-sm text-muted-foreground">{scanData.box_id}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Tag className="h-4 w-4 text-purple-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Box Quantity</p>
            <p className="text-sm text-muted-foreground">{scanData.box_quantity} units</p>
          </div>
        </div>
        
        {scanData.total_product_quantity !== undefined && (
          <div className="flex items-start gap-2">
            <Box className="h-4 w-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Total Product Stock</p>
              <p className="text-sm text-muted-foreground">{scanData.total_product_quantity} units</p>
            </div>
          </div>
        )}
        
        {scanData.location && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p className="text-sm text-muted-foreground">
                {`${scanData.location.warehouse} / ${scanData.location.zone}`}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex items-start gap-2">
          {getStatusIcon(scanData.status)}
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className={`text-sm ${getStatusColorClass(scanData.status)}`}>
              {scanData.status.charAt(0).toUpperCase() + scanData.status.slice(1)}
            </p>
          </div>
        </div>
      </div>
      
      {scanData.attributes && Object.keys(scanData.attributes).length > 0 && (
        <div className="border-t pt-3 mt-3">
          <p className="text-sm font-medium mb-2">Attributes</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(scanData.attributes).map(([key, value]) => (
              <div key={key} className="text-xs flex items-center gap-1">
                <span className="font-medium">{key}: </span>
                <span className="text-muted-foreground">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scanData.history && scanData.history.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <p className="text-sm font-medium mb-2">Recent Activity</p>
          <div className="text-xs space-y-1 max-h-[100px] overflow-y-auto">
            {scanData.history.map((item, index) => (
              <div key={index} className="flex justify-between p-1 odd:bg-slate-50 rounded">
                <span>{item.action}</span>
                <span className="text-muted-foreground">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanDataDisplay;
