
import React from 'react';
import { ScanResponse } from '@/types/auth';

interface ScanDataDisplayProps {
  scanData: ScanResponse['data'];
}

const ScanDataDisplay: React.FC<ScanDataDisplayProps> = ({ scanData }) => {
  if (!scanData) return null;
  
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-primary/10 p-4 rounded-md">
        <h3 className="font-medium text-lg">{scanData.product.name}</h3>
        <p className="text-sm text-muted-foreground">SKU: {scanData.product.sku}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium">Box ID</p>
          <p className="text-sm text-muted-foreground">{scanData.box_id}</p>
        </div>
        
        <div>
          <p className="text-sm font-medium">Box Quantity</p>
          <p className="text-sm text-muted-foreground">{scanData.box_quantity}</p>
        </div>
        
        {scanData.total_product_quantity !== undefined && (
          <div>
            <p className="text-sm font-medium">Total Product Stock</p>
            <p className="text-sm text-muted-foreground">{scanData.total_product_quantity}</p>
          </div>
        )}
        
        {scanData.location && (
          <div>
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-muted-foreground">
              {`${scanData.location.warehouse} / ${scanData.location.zone}`}
            </p>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium">Status</p>
          <p className={`text-sm ${
            scanData.status === 'available' 
              ? 'text-green-600' 
              : scanData.status === 'reserved' 
                ? 'text-amber-600' 
                : 'text-blue-600'
          }`}>
            {scanData.status.charAt(0).toUpperCase() + scanData.status.slice(1)}
          </p>
        </div>
      </div>
      
      {scanData.attributes && Object.keys(scanData.attributes).length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Attributes</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(scanData.attributes).map(([key, value]) => (
              <div key={key} className="text-xs">
                <span className="font-medium">{key}: </span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {scanData.history && scanData.history.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-1">Recent Activity</p>
          <div className="text-xs space-y-1 max-h-[100px] overflow-y-auto">
            {scanData.history.map((item, index) => (
              <div key={index} className="flex justify-between">
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
