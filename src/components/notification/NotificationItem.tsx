
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface Notification {
  id: string;
  user_id: string;
  role: string;
  action_type: string;
  metadata: {
    category?: string;
    product_ids?: string[];
    count?: number;
    reason?: string;
    [key: string]: any;
  };
  created_at: string;
  is_read: boolean;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export const Notification: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const formatMetadata = (metadata: any): string => {
    if (!metadata) return 'No details available';
    
    let details: string[] = [];
    
    if (metadata.category) {
      details.push(`Category: ${metadata.category}`);
    }
    
    if (metadata.count !== undefined) {
      details.push(`${metadata.count} items`);
    }
    
    if (metadata.product_ids && metadata.product_ids.length) {
      details.push(`${metadata.product_ids.length} products`);
    }
    
    if (metadata.reason) {
      details.push(`Reason: ${metadata.reason}`);
    }
    
    return details.length ? details.join(', ') : 'No details available';
  };
  
  const getActionTypeBadge = (actionType: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    
    switch (actionType) {
      case 'barcode_generated':
        variant = "default";
        break;
      case 'product_created':
        variant = "secondary";
        break;
      case 'stock_in':
        variant = "outline";
        break;
      case 'stock_out':
        variant = "destructive";
        break;
      default:
        variant = "outline";
    }
    
    return <Badge variant={variant}>{actionType.replace('_', ' ')}</Badge>;
  };
  
  return (
    <TableRow className={!notification.is_read ? 'bg-muted/20' : undefined}>
      <TableCell>{getActionTypeBadge(notification.action_type)}</TableCell>
      <TableCell>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
            {notification.role?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{notification.role}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {formatMetadata(notification.metadata)}
      </TableCell>
      <TableCell>
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
      </TableCell>
      <TableCell className="text-right">
        {notification.is_read ? (
          <Badge variant="outline" className="text-green-500 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Read
          </Badge>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onMarkAsRead(notification.id)}
          >
            Mark as read
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
};
