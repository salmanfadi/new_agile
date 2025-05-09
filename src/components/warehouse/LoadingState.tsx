
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

export const LoadingState: React.FC = () => {
  return (
    <div className="p-6">
      <PageHeader 
        title="Processing Stock In" 
        description="Loading stock in details..." 
      />
      <div className="mt-8 text-center">Loading...</div>
    </div>
  );
};
