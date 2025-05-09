
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

const ManageInquiries: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Manage Inquiries" 
        description="View and manage customer inquiries"
      />
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Inquiries List</h3>
          <p className="text-sm text-muted-foreground">This component will display and manage customer inquiries.</p>
        </div>
      </div>
    </div>
  );
};

export default ManageInquiries;
