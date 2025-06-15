import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Save, X, Package, MapPin, Calendar, User, Barcode } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BatchItemDisplay } from './BatchItemsTable';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BatchDetailViewProps {
  item?: BatchItemDisplay;
  batchId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  onPrintBarcodes?: () => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({ 
  item, 
  batchId,
  open = false,
  onOpenChange,
  onUpdate, 
  onDelete,
  onPrintBarcodes
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState({
    quantity: item?.quantity || 1,
    color: item?.color || '',
    size: item?.size || '',
    status: item?.status || 'available',
  });

  const queryClient = useQueryClient();

  // If no item is provided, show a loading state or fetch by batchId
  if (!item && !batchId) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center text-gray-500">
          No batch item data available
        </div>
      </div>
    );
  }

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Partial<BatchItemDisplay>) => {
      if (!item?.id) throw new Error('No item ID available');
      
      const { error } = await supabase
        .from('batch_items')
        .update(updatedData)
        .eq('id', item.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-items'] });
      setIsEditing(false);
      toast({
        title: 'Item Updated',
        description: 'Batch item has been updated successfully.',
      });
      if (onUpdate) onUpdate();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update item',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!item?.id) throw new Error('No item ID available');
      
      const { error } = await supabase
        .from('batch_items')
        .delete()
        .eq('id', item.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-items'] });
      toast({
        title: 'Item Deleted',
        description: 'Batch item has been deleted successfully.',
      });
      if (onDelete) onDelete();
      if (onOpenChange) onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error instanceof Error ? error.message : 'Failed to delete item',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      quantity: editedItem.quantity,
      color: editedItem.color || null,
      size: editedItem.size || null,
      status: editedItem.status,
    });
  };

  const handleCancel = () => {
    setEditedItem({
      quantity: item?.quantity || 1,
      color: item?.color || '',
      size: item?.size || '',
      status: item?.status || 'available',
    });
    setIsEditing(false);
  };

  const getLocationInfo = () => {
    if (item?.location) {
      return `Floor ${item.location.floor} - Zone ${item.location.zone}`;
    }
    return 'Unknown Location';
  };

  const getWarehouseInfo = () => {
    return item?.warehouse?.name || 'Unknown Warehouse';
  };

  const content = (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Batch Item Details
        </CardTitle>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this item?')) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              {onPrintBarcodes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrintBarcodes}
                  className="flex items-center gap-1"
                >
                  Print Barcodes
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Barcode className="h-4 w-4" />
              Barcode
            </Label>
            <div className="p-2 bg-gray-50 rounded-md font-mono text-sm">
              {item?.barcode || 'No barcode'}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Batch ID</Label>
            <div className="p-2 bg-gray-50 rounded-md font-mono text-sm">
              {item?.batch_id || batchId || 'Unknown'}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            {isEditing ? (
              <Input
                id="quantity"
                type="number"
                min="1"
                value={editedItem.quantity}
                onChange={(e) => setEditedItem({
                  ...editedItem,
                  quantity: parseInt(e.target.value) || 1
                })}
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded-md font-semibold">
                {item?.quantity || 1}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            {isEditing ? (
              <Select
                value={editedItem.status}
                onValueChange={(value) => setEditedItem({
                  ...editedItem,
                  status: value
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={
                item?.status === 'available' ? 'bg-green-500' :
                item?.status === 'reserved' ? 'bg-blue-500' :
                item?.status === 'sold' ? 'bg-purple-500' :
                item?.status === 'damaged' ? 'bg-red-500' : ''
              }>
                {item?.status || 'unknown'}
              </Badge>
            )}
          </div>
        </div>

        {/* Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            {isEditing ? (
              <Input
                id="color"
                value={editedItem.color}
                onChange={(e) => setEditedItem({
                  ...editedItem,
                  color: e.target.value
                })}
                placeholder="Enter color"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded-md">
                {item?.color || 'Not specified'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            {isEditing ? (
              <Input
                id="size"
                value={editedItem.size}
                onChange={(e) => setEditedItem({
                  ...editedItem,
                  size: e.target.value
                })}
                placeholder="Enter size"
              />
            ) : (
              <div className="p-2 bg-gray-50 rounded-md">
                {item?.size || 'Not specified'}
              </div>
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Warehouse</Label>
              <div className="p-2 bg-gray-50 rounded-md">
                {getWarehouseInfo()}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Location</Label>
              <div className="p-2 bg-gray-50 rounded-md">
                {getLocationInfo()}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="space-y-4">
          <h3 className="text-md font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timestamps
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created At</Label>
              <div className="p-2 bg-gray-50 rounded-md text-sm">
                {item?.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown'}
              </div>
            </div>

            {item?.updated_at && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Updated At</Label>
                <div className="p-2 bg-gray-50 rounded-md text-sm">
                  {new Date(item.updated_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // If we have open/onOpenChange props, render as a dialog
  if (open !== undefined && onOpenChange) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Item Details</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise render directly
  return content;
};

export default BatchDetailView;
