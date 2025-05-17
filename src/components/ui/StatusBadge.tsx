
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getVariant = () => {
    switch (status?.toLowerCase()) {
      case 'available':
        return 'success';
      case 'reserved':
        return 'secondary';
      case 'sold':
        return 'default';
      case 'damaged':
        return 'destructive';
      case 'pending':
        return 'outline';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'success';
      case 'processing':
        return 'secondary';
      case 'in_transit':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatStatus = (status: string): string => {
    return status
      ?.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Unknown';
  };

  return (
    <Badge variant={getVariant() as any}>
      {formatStatus(status)}
    </Badge>
  );
};
