
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StockInWizardStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  canGoNext?: boolean;
  canGoBack?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  backLabel?: string;
  isLastStep?: boolean;
}

const StockInWizardStep: React.FC<StockInWizardStepProps> = ({
  title,
  description,
  children,
  onNext,
  onBack,
  canGoNext = true,
  canGoBack = true,
  isSubmitting = false,
  nextLabel = "Continue",
  backLabel = "Back",
  isLastStep = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-xl font-semibold">{title}</h3>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
      
      <div className="flex justify-between pt-4 border-t mt-6">
        {canGoBack && onBack ? (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex items-center gap-2"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
        ) : <div />}
        
        {onNext && (
          <Button
            onClick={onNext}
            disabled={!canGoNext || isSubmitting}
            className="flex items-center gap-2"
            type={isLastStep ? "submit" : "button"}
          >
            {nextLabel}
            {!isLastStep && <ArrowRight className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default StockInWizardStep;
