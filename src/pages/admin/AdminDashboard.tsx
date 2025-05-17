
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStatsGrid } from '@/components/admin/DashboardStatsGrid';
import { RecentActivityTable } from '@/components/admin/RecentActivityTable';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

const AdminDashboard = () => {
  const { stats, activities, isLoadingStats, isLoadingActivities } = useAdminDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Overview of system status and recent activity"
      />
      
      {isLoadingStats ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <DashboardStatsGrid stats={stats} />
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest stock movements and system events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <RecentActivityTable activities={activities} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
