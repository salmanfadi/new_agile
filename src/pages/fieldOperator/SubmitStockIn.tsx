
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

const SubmitStockIn: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Submit Stock In Request" 
        description="Create new stock in requests for processing"
      />
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Stock In Form</h3>
          <p className="text-sm text-muted-foreground">This component will display a form to submit stock in requests.</p>
        </div>
      </div>
    </div>
  );
};

export default SubmitStockIn;
