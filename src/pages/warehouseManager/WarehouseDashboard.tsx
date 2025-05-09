
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

const WarehouseDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warehouse Manager Dashboard" 
        description="Overview of warehouse operations and stock status"
      />
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Dashboard Content</h3>
          <p className="text-sm text-muted-foreground">This component will display warehouse manager dashboard content.</p>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;
