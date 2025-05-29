import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';

// Define a type for the minimum required fields when creating a product
interface CreateProductData {
  name: string;
  description?: string | null;
  specifications?: string | null;
  sku: string;
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

  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
        const { data, error } = await supabase
          .from('products')
        .select('id, name, sku')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
  });

  // Add validation for image files
  const validateImage = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
    }

    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
  };

  // Update the createProduct mutation
  const createProduct = useMutation({
    mutationFn: async (productData: CreateProductData & { image_file?: File | null }) => {
      const { image_file, ...data } = productData;
      
      // Validate image if provided
      if (image_file) {
        validateImage(image_file);
      }

      console.log('Creating product with data:', data);

      // Convert empty strings to null
      const cleanedData = {
        ...data,
        specifications: data.specifications?.trim() || null,
        description: data.description?.trim() || null,
        category: data.category?.trim() || null
      };

      // Start a Supabase transaction
      const { data: insertResult, error: insertError } = await supabase
        .from('products')
        .insert({
          ...cleanedData,
          created_by: user?.id,
          updated_by: user?.id,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('Error creating product:', insertError);
        throw new Error(`Failed to create product: ${insertError.message}`);
      }

      if (!insertResult || insertResult.length === 0) {
        throw new Error('No product data returned after creation');
      }
      
      const newProduct = insertResult[0];
      console.log('Product created successfully:', newProduct);

      // If there's an image, upload it
      if (image_file && newProduct.id) {
        try {
          const imageUrl = await uploadProductImage(image_file, newProduct.id);
          if (imageUrl) {
            const { error: updateError } = await supabase
              .from('products')
              .update({ image_url: imageUrl })
              .eq('id', newProduct.id);

            if (updateError) {
              console.error('Error updating product image:', updateError);
              throw updateError;
            }
          }
        } catch (error) {
          console.error('Error handling product image:', error);
          // If image upload fails, delete the product
          await supabase
            .from('products')
            .delete()
            .eq('id', newProduct.id);
          throw new Error('Failed to upload product image. Product creation cancelled.');
        }
      }

      return newProduct;
    },
    onError: (error) => {
      console.error('Product creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
    }
  });

  // Update the uploadProductImage function
  const uploadProductImage = async (file: File, productId: string): Promise<string | null> => {
    const fileExt = file.type.split('/')[1];
    const fileName = `${productId}.${fileExt}`;
    
    // Delete any existing images for this product
    await supabase.storage
      .from('product-images')
      .remove([`${productId}.*`]);
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });
      
    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
      
    return urlData?.publicUrl || null;
  };

  // Update product
  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> & { image_file?: File | null } }) => {
      const { image_file, ...updateData } = data;

      // If there's an image file, upload it first
      let imageUrl = null;
      if (image_file) {
        validateImage(image_file);
        imageUrl = await uploadProductImage(image_file, id);
      }

      const finalUpdateData = {
        ...updateData,
        ...(imageUrl && { image_url: imageUrl }),
        updated_by: user?.id || null,
        updated_at: new Date().toISOString()
      };

      const { data: updatedData, error } = await supabase
        .from('products')
        .update(finalUpdateData)
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
    mutationFn: async (productId: string) => {
      // First, delete the product image if it exists
      const { data: product } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      if (product?.image_url) {
        // Extract filename from URL and delete from storage
        const fileName = product.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('product-images')
            .remove([fileName]);
        }
      }

      // Then delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return productId;
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
        .filter('category', 'neq', null)
        .filter('category', 'neq', '');

      if (error) throw error;
      
      // Get unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      return uniqueCategories.filter(Boolean);
    },
  });

  return {
    products: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
    setSearchQuery,
    setCategoryFilter,
    setStatusFilter,
    searchQuery,
    categoryFilter,
    statusFilter,
    categories
  };
}

export default useProducts;
