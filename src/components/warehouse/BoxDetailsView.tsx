import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BoxDetails } from '@/types/barcode';

interface BoxDetailsViewProps {
  boxDetails: BoxDetails;
}

export const BoxDetailsView: React.FC<BoxDetailsViewProps> = ({ boxDetails }) => {
  const getBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'success';
      case 'reserved':
        return 'secondary';
      case 'damaged':
        return 'destructive';
      case 'shipped':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getBadgeVariant(boxDetails.status)} className="capitalize">
            {boxDetails.status}
          </Badge>
          
          {/* Additional actions can be added here */}
          <div className="text-sm text-muted-foreground">
            Box with barcode {boxDetails.barcode} contains {boxDetails.quantity} items.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BoxDetailsView;
