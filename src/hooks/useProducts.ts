
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types/database';

// Define a type for the minimum required fields when creating a product
interface CreateProductData {
  name: string; // Name is required by the database schema
  description?: string | null;
  specifications?: string | null;
  sku?: string | null;
  category?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

export function useProducts() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);

  // Fetch products
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', searchQuery, categoryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from('products').select('*');

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      if (categoryFilter) {
        query = query.eq('category', categoryFilter);
      }

      if (statusFilter !== null) {
        query = query.eq('is_active', statusFilter);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data as Product[];
    },
  });

  // Create product
  const createProduct = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select();

      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
      });
    },
  });

  // Update product
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const { data: updatedData, error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .select();

      if (error) throw error;
      return updatedData[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product updated successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product',
      });
    },
  });

  // Delete product
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product',
      });
    },
  });

  // Get product categories
  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return uniqueCategories.filter(Boolean);
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    categories,
  };
}

export default useProducts;
