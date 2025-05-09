
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProcessingActionsProps {
  onCancel: () => void;
  isSubmitting: boolean;
  isDisabled: boolean;
}

export const ProcessingActions: React.FC<ProcessingActionsProps> = ({
  onCancel,
  isSubmitting,
  isDisabled,
}) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button 
        type="submit"
        disabled={isDisabled || isSubmitting}
      >
        {isSubmitting ? 'Processing...' : 'Accept & Process Stock In'}
      </Button>
    </div>
  );
};
