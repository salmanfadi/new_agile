import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Package, Plus, Edit, AlertCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  specifications: string;
  category: string;
  image_file: File | null;
  is_active: boolean;
}

const ProductView: React.FC = () => {
  const { 
    products, 
    isLoading, 
    error,
    createProduct,
    updateProduct,
    categories: existingCategories 
  } = useProducts();
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any | null>(null);
  const [skuError, setSkuError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState<ProductFormData>({
    name: '',
    description: '',
    sku: '',
    specifications: '',
    category: '',
    image_file: null,
    is_active: true
  });

  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    setSkuError(null);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    if (!formData.sku.trim()) {
      setSkuError('SKU is required');
      return;
    }
    
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            ...formData,
            image_file: formData.image_file
          }
        });
      } else {
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

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Products Catalog" 
        description="View and manage products in the system"
      />
      
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">
              Error loading products
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-8 w-8 object-cover rounded"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge variant="outline">
                          {product.category}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {product.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                <Label htmlFor="sku">SKU (Stock Keeping Unit)*</Label>
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
    </div>
  );
};

export default ProductView; 