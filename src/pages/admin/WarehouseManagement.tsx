
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Warehouse, Edit, Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Warehouse as WarehouseType } from '@/types/database';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const WarehouseManagement = () => {
  const queryClient = useQueryClient();
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    location: '',
  });
  
  const [locationForm, setLocationForm] = useState({
    floor: 1,
    zone: '',
    warehouseId: '',
  });

  // Fetch warehouses
  const { data: warehouses, isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as WarehouseType[];
    },
  });

  // Fetch warehouse locations
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['warehouseLocations', selectedWarehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .select('*')
        .eq('warehouse_id', selectedWarehouseId)
        .order('floor')
        .order('zone');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedWarehouseId,
  });

  // Create warehouse mutation
  const createWarehouseMutation = useMutation({
    mutationFn: async (newWarehouse: { name: string, location: string }) => {
      const { data, error } = await supabase
        .from('warehouses')
        .insert([newWarehouse])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsWarehouseDialogOpen(false);
      setWarehouseForm({ name: '', location: '' });
      toast({
        title: 'Warehouse created',
        description: 'New warehouse has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Failed to create warehouse',
      });
    },
  });

  // Update warehouse mutation
  const updateWarehouseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<WarehouseType> }) => {
      const { data: response, error } = await supabase
        .from('warehouses')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsWarehouseDialogOpen(false);
      setEditingWarehouse(null);
      toast({
        title: 'Warehouse updated',
        description: 'Warehouse information has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update warehouse',
      });
    },
  });

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (newLocation: { warehouse_id: string, floor: number, zone: string }) => {
      const { data, error } = await supabase
        .from('warehouse_locations')
        .insert([newLocation])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseLocations', selectedWarehouseId] });
      setIsLocationDialogOpen(false);
      setLocationForm({ floor: 1, zone: '', warehouseId: '' });
      toast({
        title: 'Location created',
        description: 'New warehouse location has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Creation failed',
        description: error instanceof Error ? error.message : 'Failed to create location',
      });
    },
  });

  const handleWarehouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWarehouse) {
      updateWarehouseMutation.mutate({
        id: editingWarehouse.id,
        data: warehouseForm
      });
    } else {
      createWarehouseMutation.mutate(warehouseForm);
    }
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLocationMutation.mutate({
      warehouse_id: selectedWarehouseId!,
      floor: locationForm.floor,
      zone: locationForm.zone,
    });
  };

  const handleEditWarehouse = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    setWarehouseForm({
      name: warehouse.name,
      location: warehouse.location || '',
    });
    setIsWarehouseDialogOpen(true);
  };

  const handleAddLocation = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
    setLocationForm(prev => ({ ...prev, warehouseId }));
    setIsLocationDialogOpen(true);
  };

  const handleWarehouseSelect = (warehouseId: string) => {
    setSelectedWarehouseId(warehouseId);
  };

  const openNewWarehouseDialog = () => {
    setEditingWarehouse(null);
    setWarehouseForm({ name: '', location: '' });
    setIsWarehouseDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Warehouse Management" 
        description="Manage warehouses and their locations"
      />

      <div className="flex justify-end mb-6">
        <Button onClick={openNewWarehouseDialog} className="hover-lift">
          <Plus className="h-4 w-4 mr-2" />
          Add Warehouse
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWarehouses ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {warehouses && warehouses.map((warehouse) => (
                  <div 
                    key={warehouse.id}
                    className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedWarehouseId === warehouse.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/60' : ''
                    }`}
                    onClick={() => handleWarehouseSelect(warehouse.id)}
                  >
                    <div>
                      <div className="font-medium">{warehouse.name}</div>
                      <div className="text-sm text-gray-500">{warehouse.location || 'No location'}</div>
                    </div>
                    <div className="flex">
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        handleEditWarehouse(warehouse);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={(e) => {
                        e.stopPropagation();
                        handleAddLocation(warehouse.id);
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!warehouses || warehouses.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    No warehouses found
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedWarehouseId ? 
                `Locations for ${warehouses?.find(w => w.id === selectedWarehouseId)?.name}` : 
                'Select a warehouse to view locations'}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {isLoadingLocations && selectedWarehouseId ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : selectedWarehouseId ? (
              <div className="max-h-[60vh] overflow-y-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Floor</TableHead>
                      <TableHead>Zone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {locations && locations.length > 0 ? (
                      locations.map((location) => (
                        <TableRow key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <TableCell>{location.floor}</TableCell>
                          <TableCell>{location.zone}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-gray-500">
                          No locations found for this warehouse
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a warehouse from the list to view its locations
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={setIsWarehouseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleWarehouseSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Warehouse Name</Label>
                <Input 
                  id="name" 
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, State, Country"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsWarehouseDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createWarehouseMutation.isPending || updateWarehouseMutation.isPending}
              >
                {createWarehouseMutation.isPending || updateWarehouseMutation.isPending ? 
                  'Saving...' : 
                  editingWarehouse ? 'Update Warehouse' : 'Create Warehouse'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleLocationSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input 
                  id="floor" 
                  type="number"
                  min="1"
                  value={locationForm.floor}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Input 
                  id="zone" 
                  value={locationForm.zone}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, zone: e.target.value }))}
                  placeholder="A, B, C, etc."
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsLocationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? 'Adding...' : 'Add Location'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseManagement;
