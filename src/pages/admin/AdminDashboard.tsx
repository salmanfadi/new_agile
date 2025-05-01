
import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, Package, Users, BarChart3, Box } from 'lucide-react';

// Mock data for the dashboard
const mockStats = [
  { title: 'Total Warehouses', value: 5, icon: <Warehouse className="h-5 w-5" /> },
  { title: 'Total Inventory', value: '12,345 Units', icon: <Box className="h-5 w-5" /> },
  { title: 'Pending Stock In', value: 10, icon: <Package className="h-5 w-5" /> },
  { title: 'Pending Stock Out', value: 8, icon: <Package className="h-5 w-5" /> },
  { title: 'Total Users', value: 18, icon: <Users className="h-5 w-5" /> },
  { title: 'This Week Activity', value: '+24%', icon: <BarChart3 className="h-5 w-5" />, trend: { value: 24, isPositive: true } },
];

const recentActivity = [
  { action: 'Stock In Submitted', user: 'John Doe', timestamp: '2025-05-01 10:30 AM', status: 'pending' },
  { action: 'Stock Out Approved', user: 'Jane Smith', timestamp: '2025-05-01 09:45 AM', status: 'approved' },
  { action: 'Stock In Processed', user: 'Mike Johnson', timestamp: '2025-04-30 04:20 PM', status: 'completed' },
  { action: 'Stock Out Rejected', user: 'Sarah Lee', timestamp: '2025-04-30 02:15 PM', status: 'rejected' },
  { action: 'User Added', user: 'Admin', timestamp: '2025-04-30 11:05 AM', status: 'completed' },
];

const AdminDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admin Dashboard" 
        description="Overview of system status and recent activity"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.action}</TableCell>
                    <TableCell>{activity.user}</TableCell>
                    <TableCell>{activity.timestamp}</TableCell>
                    <TableCell>
                      <StatusBadge status={activity.status as any} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
