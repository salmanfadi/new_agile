
import React from 'react';
import { Button } from '@/components/ui/button';

interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  isContinueDisabled: boolean;
}

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  onBack,
  onNext,
  isContinueDisabled
}) => {
  return (
    <div className="flex justify-between pt-4">
      <Button type="button" variant="outline" onClick={onBack}>
        Back
      </Button>
      <Button type="button" disabled={isContinueDisabled} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
};

export default NavigationButtons;
