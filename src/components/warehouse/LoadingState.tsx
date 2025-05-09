
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Processing Stock In",
  description = "Loading stock in details..."
}) => {
  return (
    <div className="p-6">
      <PageHeader 
        title={title} 
        description={description} 
      />
      <div className="mt-8 flex flex-col items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading data...</p>
      </div>
    </div>
  );
};
