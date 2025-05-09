
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

const NotificationCenter: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notification Center" 
        description="Manage and view system notifications"
      />
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">System Notifications</h3>
          <p className="text-sm text-muted-foreground">This component will display and manage system notifications.</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
