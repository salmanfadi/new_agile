
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { InventoryStatus } from '@/components/sales/InventoryStatus';

const InventoryView: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Product Inventory" 
        description="View current inventory levels to assist customers with product inquiries"
      />
      
      <InventoryStatus />
    </div>
  );
};

export default InventoryView;
