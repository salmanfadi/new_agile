
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

const SalesInquiryForm: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="New Sales Inquiry" 
        description="Create a new sales inquiry"
      />
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">Sales Inquiry Form</h3>
          <p className="text-sm text-muted-foreground">This component will display a form to create new sales inquiries.</p>
        </div>
      </div>
    </div>
  );
};

export default SalesInquiryForm;
