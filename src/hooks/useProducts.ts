
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

// Define a type for the minimum required fields when creating a product
interface CreateProductData {
  name: string; // Name is required by the database schema
  description?: string | null;
  specifications?: string | null;
  sku: string; // Now required by the database schema
  category?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

export function useProducts() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
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

  // Upload image to Supabase storage using the product-images bucket
  const uploadProductImage = async (file: File, productId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        upsert: true,
      });
      
    if (error) {
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
      
    return urlData?.publicUrl || null;
  };

  // Create product
  const createProduct = useMutation({
    mutationFn: async (productData: CreateProductData) => {
      // First insert the product to get the ID
      const { data: insertResult, error } = await supabase
        .from('products')
        .insert({
          ...productData,
          created_by: user?.id || null,
          updated_by: user?.id || null
        })
        .select();
        
      if (error) throw error;
      
      return insertResult[0];
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
        description: error instanceof Error ? 
          (error.message.includes('products_sku_unique') ? 
            'A product with this SKU already exists' : 
            error.message) : 
          'Failed to create product',
      });
    },
  });

  // Update product
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const updateData = {
        ...data,
        updated_by: user?.id || null
      };

      const { data: updatedData, error } = await supabase
        .from('products')
        .update(updateData)
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
        description: error instanceof Error ? 
          (error.message.includes('products_sku_unique') ? 
            'A product with this SKU already exists' : 
            error.message) : 
          'Failed to update product',
      });
    },
  });

  // Delete product
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      // First try to delete the image if it exists
      try {
        await supabase.storage
          .from('product-images')
          .remove([`${id}.jpg`, `${id}.jpeg`, `${id}.png`, `${id}.gif`]);
      } catch (error) {
        console.error('Error deleting product image:', error);
        // Continue with product deletion even if image deletion fails
      }

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
    uploadProductImage
  };
}

export default useProducts;
