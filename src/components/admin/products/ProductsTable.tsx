
import React from 'react';
import { Product } from '@/types/database';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye } from 'lucide-react';

interface ProductsTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onView: (product: Product) => void;
  isLoading?: boolean;
}

const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  onEdit,
  onDelete,
  onView,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-200 animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>HSN Code</TableHead>
            <TableHead>GST Rate</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                No products found
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    {product.description && (
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {product.sku ? (
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {product.sku}
                    </code>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.category ? (
                    <Badge variant="outline">{product.category}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.hsn_code ? (
                    <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {product.hsn_code}
                    </code>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {product.gst_rate !== null && product.gst_rate !== undefined ? (
                    <span className="text-sm font-medium">
                      {product.gst_rate}%
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
