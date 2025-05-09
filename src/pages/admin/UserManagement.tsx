
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';

const UserManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Manage user accounts and permissions"
      />
      
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium">User List</h3>
          <p className="text-sm text-muted-foreground">This component will display and manage system users.</p>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
