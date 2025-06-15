import { toast as sonnerToast } from "@/components/ui/use-toast";

type ToastVariant = 'default' | 'destructive';
type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

export const showToast = ({
  title,
  description,
  variant = 'default',
  duration = 5000, // 5 seconds default duration
}: ToastOptions) => {
  // Common styles for all toasts
  const className = "rounded-md border shadow-lg";
  
  sonnerToast({
    title,
    description,
    variant,
    duration,
    className: `${className} ${variant === 'destructive' ? 'border-red-500' : 'border-primary'}`,
  });
};

// Helper functions for common toast types
export const showSuccessToast = (title: string, description?: string) => {
  showToast({
    title,
    description,
    variant: 'default',
    duration: 5000,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  showToast({
    title,
    description: description || 'Please try again or contact support if the issue persists.',
    variant: 'destructive',
    duration: 8000, // Longer duration for errors
  });
};

export const showWarningToast = (title: string, description?: string) => {
  showToast({
    title,
    description,
    variant: 'default',
    duration: 6000,
  });
};
