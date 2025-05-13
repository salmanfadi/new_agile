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
import { format } from 'date-fns';

interface ActivityItem {
  type: string;
  user: string;
  product: string;
  quantity: string;
  status: 'success' | 'pending' | 'error';
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
            <TableHead scope="col">Action</TableHead>
            <TableHead scope="col">User</TableHead>
            <TableHead scope="col">Product</TableHead>
            <TableHead scope="col">Quantity</TableHead>
            <TableHead scope="col">Timestamp</TableHead>
            <TableHead scope="col">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{activity.type}</TableCell>
              <TableCell>{activity.user}</TableCell>
              <TableCell>{activity.product}</TableCell>
              <TableCell>{activity.quantity}</TableCell>
              <TableCell>{format(new Date(activity.date), 'dd MMM yyyy, HH:mm')}</TableCell>
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
