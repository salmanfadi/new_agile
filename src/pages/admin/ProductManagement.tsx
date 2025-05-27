import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Product } from '@/types/database';
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
import { ArrowLeft, Edit, Plus, Trash2, Package, Image, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useProducts } from '@/hooks/useProducts';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  specifications: string;
  category: string;
  image_file: File | null;
  is_active: boolean;
}

const ProductManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    products, 
    isLoading: productsLoading, 
    createProduct, 
    updateProduct, 
    deleteProduct, 
    uploadProductImage, 
    categories: existingCategories,
    error: productsError,
    refetch 
  } = useProducts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    specifications: '',
    category: '',
    image_file: null,
    is_active: true
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!authLoading && user?.role !== 'admin') {
      navigate('/unauthorized');
      return;
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (formData.sku) {
      setSkuError(null);
    }
  }, [formData.sku]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
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
  
  const checkSkuAvailability = async (sku: string, productId?: string) => {
    const query = supabase
      .from('products')
      .select('id')
      .eq('sku', sku);
      
    if (productId) {
      query.neq('id', productId); // Exclude current product when editing
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Product name is required.',
      });
      return;
    }

    if (!formData.sku.trim()) {
      setSkuError('SKU is required');
      return;
    }
    
    try {
      // Check SKU availability
      const isSkuAvailable = await checkSkuAvailability(
        formData.sku,
        editingProduct?.id
      );
      
      if (!isSkuAvailable) {
        setSkuError('A product with this SKU already exists');
        return;
      }
      
      // Proceed with create/update
      if (editingProduct) {
        // Update existing product
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            ...formData,
            image_file: formData.image_file
          }
        });
      } else {
        // Create new product
        await createProduct.mutateAsync({
          ...formData,
          image_file: formData.image_file
        });
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation callbacks
    }
  };
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      sku: product.sku || '',
      specifications: product.specifications || '',
      category: product.category || '',
      image_file: null,
      is_active: product.is_active
    });
    setPreviewUrl(product.image_url);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    setSelectedProductId(id);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (selectedProductId) {
      try {
        await deleteProduct.mutateAsync(selectedProductId);
        setIsDeleteDialogOpen(false);
        setSelectedProductId(null);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
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
      category: '',
      image_file: null,
      is_active: true
    });
    setPreviewUrl(null);
    setSkuError(null);
  };

  // Add console logs for debugging
  useEffect(() => {
    console.log('ProductManagement mounted');
    console.log('Products:', products);
    console.log('Loading:', productsLoading);
    console.log('User:', user);
  }, [products, productsLoading, user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-medium text-gray-700">Verifying access...</h2>
        </div>
      </div>
    );
  }

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
          {productsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : productsError ? (
            <div className="text-center py-8 text-red-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading products: {productsError instanceof Error ? productsError.message : 'Unknown error'}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetch()}
              >
                Try Again
              </Button>
            </div>
          ) : !products || products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2" />
              <p>No products found. Click "Add New Product" to create one.</p>
              <p className="text-sm text-gray-400 mt-2">
                {JSON.stringify({ productsLength: products?.length, isArray: Array.isArray(products) })}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "success" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
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
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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
                <Label htmlFor="name">Product Name*</Label>
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
                <Label htmlFor="sku">
                  SKU (Stock Keeping Unit)*
                </Label>
                <Input 
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  placeholder="Enter product SKU"
                  className={skuError ? "border-red-500" : ""}
                  required
                />
                {skuError && (
                  <div className="text-sm text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-4 w-4 mr-1" /> {skuError}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  A unique identifier for the product. Required and must be unique.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="Enter product category"
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {existingCategories?.map((category, index) => (
                    <option key={index} value={category} />
                  ))}
                </datalist>
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
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox" 
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="is_active">Product is active</Label>
                </div>
                <p className="text-xs text-gray-500">
                  Inactive products will not be visible to customers.
                </p>
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
                  !formData.sku.trim() || 
                  createProduct.isPending || 
                  updateProduct.isPending ||
                  !!skuError
                }
              >
                {createProduct.isPending || updateProduct.isPending ? 
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this product? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;
