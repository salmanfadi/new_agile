
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Your Profile" 
        description="View and manage your account details"
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
              <p className="mt-1">{user.username}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
              <p className="mt-1">{user.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
              <p className="mt-1 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button variant="destructive" onClick={logout}>
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
