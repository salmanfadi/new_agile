
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
import { Package, LogIn, LogOut } from 'lucide-react';

// Mock data for the dashboard
const mockStats = [
  { title: 'Pending Stock In', value: 5, icon: <LogIn className="h-5 w-5" /> },
  { title: 'Pending Stock Out', value: 3, icon: <LogOut className="h-5 w-5" /> },
  { title: 'Assigned Warehouses', value: 2, icon: <Package className="h-5 w-5" /> },
];

const recentActivity = [
  { action: 'Stock In Processed', product: 'LED Wall Clock', timestamp: '2025-05-01 10:30 AM', status: 'completed' },
  { action: 'Stock Out Approved', product: 'Desktop Clock', timestamp: '2025-05-01 09:45 AM', status: 'approved' },
  { action: 'Stock In Processed', product: 'Table Clock', timestamp: '2025-04-30 04:20 PM', status: 'completed' },
  { action: 'Stock Out Rejected', product: 'Wall Clock', timestamp: '2025-04-30 02:15 PM', status: 'rejected' },
  { action: 'Stock In Processed', product: 'Alarm Clock', timestamp: '2025-04-30 11:05 AM', status: 'completed' },
];

const ManagerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warehouse Manager Dashboard" 
        description="Overview of tasks and inventory"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockStats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
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
                  <TableHead>Product</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivity.map((activity, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{activity.action}</TableCell>
                    <TableCell>{activity.product}</TableCell>
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

export default ManagerDashboard;
