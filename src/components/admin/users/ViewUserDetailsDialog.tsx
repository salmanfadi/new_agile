
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserData } from '@/types/userManagement';
import { getRoleBadgeColor, businessTypes } from '@/utils/userManagementUtils';

interface ViewUserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
}

export const ViewUserDetailsDialog: React.FC<ViewUserDetailsDialogProps> = ({
  open,
  onOpenChange,
  user,
}) => {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Basic Information</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="text-sm font-medium">Username:</div>
              <div className="text-sm">{user.username}</div>
              
              <div className="text-sm font-medium">Name:</div>
              <div className="text-sm">{user.name || '-'}</div>
              
              <div className="text-sm font-medium">Role:</div>
              <div className="text-sm">
                <Badge className={getRoleBadgeColor(user.role)} variant="outline">
                  {user.role.replace('_', ' ')}
                </Badge>
              </div>
              
              <div className="text-sm font-medium">Status:</div>
              <div className="text-sm">
                <Badge variant={user.active ? 'default' : 'secondary'}>
                  {user.active ? 'Active' : 'Blocked'}
                </Badge>
              </div>
              
              <div className="text-sm font-medium">Created:</div>
              <div className="text-sm">{new Date(user.created_at).toLocaleString()}</div>
            </div>
          </div>
          
          {user.role === 'customer' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-sm font-medium">Company:</div>
                <div className="text-sm">{user.company_name || '-'}</div>
                
                <div className="text-sm font-medium">GSTIN:</div>
                <div className="text-sm">{user.gstin || '-'}</div>
                
                <div className="text-sm font-medium">Phone:</div>
                <div className="text-sm">{user.phone || '-'}</div>
                
                <div className="text-sm font-medium">Business Type:</div>
                <div className="text-sm">
                  {user.business_type 
                    ? businessTypes.find(t => t.value === user.business_type)?.label || user.business_type
                    : '-'
                  }
                </div>
                
                <div className="text-sm font-medium">Address:</div>
                <div className="text-sm">{user.address || '-'}</div>
                
                <div className="text-sm font-medium">Business Reg #:</div>
                <div className="text-sm">{user.business_reg_number || '-'}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
