import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReserveStockList } from '@/components/reserve-stock/ReserveStockList';
import { ReserveStockDetail } from '@/components/reserve-stock/ReserveStockDetail';
import { ReserveStockForm } from '@/components/reserve-stock/ReserveStockForm';
import { ReserveStockWithDetails, CreateReserveStockDTO } from '@/types/reserve-stock';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { reserveStockService } from '@/services/reserveStockService';
import { toast } from '@/components/ui/use-toast';

const ReserveStock = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<ReserveStockWithDetails | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleView = (item: ReserveStockWithDetails) => {
    setSelectedItem(item);
  };

  const handleClose = () => {
    setSelectedItem(null);
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateReserveStockDTO) => reserveStockService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reserve-stocks'] });
      toast({
        title: 'Success',
        description: 'Reserve stock request created successfully.',
      });
      setShowForm(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create reserve stock request. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating reserve stock:', error);
    },
  });

  const handleSubmit = (data: CreateReserveStockDTO) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reserve Stock</h1>
        <Button onClick={() => setShowForm(true)}>
          Create New Request
      </Button>
            </div>

      <ReserveStockList onView={handleView} />

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reserve Stock Details</DialogTitle>
            <DialogDescription>View and manage the details of this reserve stock request.</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <ReserveStockDetail
              id={selectedItem.id}
              onClose={handleClose}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Reserve Stock Request</DialogTitle>
            <DialogDescription>Fill in the details to create a new reserve stock request.</DialogDescription>
          </DialogHeader>
          <ReserveStockForm onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReserveStock; 