
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  onNavigateBack: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ onNavigateBack }) => {
  return (
    <div className="p-6">
      <PageHeader 
        title="Error" 
        description="Stock in not found" 
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onNavigateBack}
        className="mt-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Stock In Processing
      </Button>
    </div>
  );
};
