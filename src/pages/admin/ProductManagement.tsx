
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Edit, Plus, Trash2, Package, Image } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  sku: string | null;
  specifications: string | null;
  image_url: string | null;
}

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  specifications: string;
  image_file: File | null;
}

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    specifications: '',
    image_file: null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Fetch products
  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data as Product[];
    },
  });
  
  // Upload image to Supabase storage
  const uploadImage = async (file: File, productId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);
      
    if (error) {
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);
      
    return urlData?.publicUrl || null;
  };
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // First insert the product to get the ID
      const { data: insertResult, error } = await supabase
        .from('products')
        .insert([{
          name: data.name,
          description: data.description || null,
          sku: data.sku || null,
          specifications: data.specifications || null
        }])
        .select();
        
      if (error) throw error;
      
      if (!insertResult || insertResult.length === 0) {
        throw new Error('Failed to insert product');
      }
      
      const newProduct = insertResult[0] as Product;
      
      // If there's an image file, upload it and update the product
      if (data.image_file) {
        const imageUrl = await uploadImage(data.image_file, newProduct.id);
        
        if (imageUrl) {
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', newProduct.id);
            
          if (updateError) throw updateError;
        }
      }
      
      return insertResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Product has been created successfully.',
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
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormData }) => {
      // Check if we need to update the image
      let imageUrl = null;
      if (data.image_file) {
        imageUrl = await uploadImage(data.image_file, id);
      }
      
      // Update the product
      const updateData = {
        name: data.name,
        description: data.description || null,
        sku: data.sku || null,
        specifications: data.specifications || null,
        ...(imageUrl ? { image_url: imageUrl } : {})
      };
      
      const { data: result, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Product has been updated successfully.',
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
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Product has been deleted successfully.',
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    
    if (file) {
      setFormData(prev => ({ ...prev, image_file: file }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Product name is required.',
      });
      return;
    }
    
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        data: formData
      });
    } else {
      createProductMutation.mutate(formData);
    }
  };
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      specifications: product.specifications || '',
      image_file: null
    });
    setPreviewUrl(product.image_url);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    setSelectedProductId(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (selectedProductId) {
      deleteProductMutation.mutate(selectedProductId);
    }
  };
  
  const openCreateDialog = () => {
    setEditingProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sku: '',
      specifications: '',
      image_file: null
    });
    setPreviewUrl(null);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Product Management" 
        description="Create and manage products in the system"
      />
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>
            Manage all products in the inventory system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No products found. Click "Add New Product" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="h-full w-full object-cover rounded-md"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{product.description || '-'}</TableCell>
                      <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-red-600"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                <Input 
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Enter product SKU"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter product description"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specifications">Specifications</Label>
                <Textarea
                  id="specifications"
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  placeholder="Enter product specifications"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <div className="flex items-center space-x-4">
                  <div className="h-24 w-24 bg-gray-100 rounded-md flex items-center justify-center">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Product preview" 
                        className="h-full w-full object-cover rounded-md"
                      />
                    ) : (
                      <Image className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input 
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload a product image (JPEG, PNG, or GIF)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={
                  !formData.name.trim() || 
                  createProductMutation.isPending || 
                  updateProductMutation.isPending
                }
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? 
                  'Saving...' : 
                  editingProduct ? 'Update Product' : 'Create Product'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
