
import React from 'react';
import { cn } from '@/lib/utils';

export type StatusType = 'pending' | 'approved' | 'rejected' | 'completed' | 'processing';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusProps = () => {
    switch (status) {
      case 'pending':
        return {
          className: 'bg-yellow-100 text-yellow-800',
          label: 'Pending'
        };
      case 'approved':
        return {
          className: 'bg-green-100 text-green-800',
          label: 'Approved'
        };
      case 'rejected':
        return {
          className: 'bg-red-100 text-red-800',
          label: 'Rejected'
        };
      case 'completed':
        return {
          className: 'bg-blue-100 text-blue-800',
          label: 'Completed'
        };
      case 'processing':
        return {
          className: 'bg-purple-100 text-purple-800',
          label: 'Processing'
        };
      default:
        return {
          className: 'bg-gray-100 text-gray-800',
          label: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

  const { className: statusClassName, label } = getStatusProps();

  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      statusClassName,
      className
    )}>
      {label}
    </span>
  );
};
