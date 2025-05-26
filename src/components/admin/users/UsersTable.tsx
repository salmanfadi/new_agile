
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, KeyRound, Ban, UserCheck } from 'lucide-react';
import { UserData } from '@/types/userManagement';
import { getRoleBadgeColor } from '@/utils/userManagementUtils';

interface UsersTableProps {
  users: UserData[];
  activeTab: string;
  isLoading: boolean;
  onViewDetails: (user: UserData) => void;
  onEdit: (user: UserData) => void;
  onResetPassword: (user: UserData) => void;
  onToggleStatus: (user: UserData) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  activeTab,
  isLoading,
  onViewDetails,
  onEdit,
  onResetPassword,
  onToggleStatus,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Username</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          {activeTab === 'customers' && (
            <TableHead>Company</TableHead>
          )}
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users && users.length > 0 ? (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>{user.name || '-'}</TableCell>
              <TableCell>
                <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                  {user.role.replace('_', ' ')}
                </Badge>
              </TableCell>
              {activeTab === 'customers' && (
                <TableCell>{user.company_name || '-'}</TableCell>
              )}
              <TableCell>
                <Badge variant={user.active ? 'default' : 'secondary'}>
                  {user.active ? 'Active' : 'Blocked'}
                </Badge>
              </TableCell>
              <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onViewDetails(user)}
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onEdit(user)}
                    title="Edit user"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => onResetPassword(user)}
                    title="Reset password"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant={user.active ? "ghost" : "outline"} 
                    onClick={() => onToggleStatus(user)}
                    className={user.active ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"}
                    title={user.active ? "Block user" : "Activate user"}
                  >
                    {user.active ? <Ban className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={activeTab === 'customers' ? 7 : 6} className="text-center py-8 text-gray-500">
              No users found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};
