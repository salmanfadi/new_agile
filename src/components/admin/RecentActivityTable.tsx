
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ActivityItem {
  type: string;
  user: string;
  product: string;
  quantity: string;
  status: string;
  date: string;
}

interface RecentActivityTableProps {
  activities: ActivityItem[];
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ activities }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{activity.type}</TableCell>
              <TableCell>{activity.user}</TableCell>
              <TableCell>{activity.product}</TableCell>
              <TableCell>{activity.quantity}</TableCell>
              <TableCell>{activity.date}</TableCell>
              <TableCell>
                <StatusBadge status={activity.status as any} />
              </TableCell>
            </TableRow>
          ))}
          {activities.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                No recent activities
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
