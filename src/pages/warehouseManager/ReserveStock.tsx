import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useReserveStockOut } from '@/hooks/useReserveStockOut';
import { useProducts } from '@/hooks/useProducts';
import { ReserveStockDetails } from '@/components/reserve-stock/ReserveStockDetails';
import type { Product } from '@/types/database';
import type { ReservedItem } from '@/types/reserve-stock';

const getStatusVariant = (status: ReservedItem['status']) => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Expired':
      return 'secondary';
    case 'Cancelled':
      return 'destructive';
    case 'Processing Stock Out':
      return 'outline';
    default:
      return 'default';
  }
};

const ReserveStock: React.FC = () => {
  const navigate = useNavigate();
  const { products, isLoading: isLoadingProducts } = useProducts();
  
  const reserveStockOut = useReserveStockOut((id) => {
    setReservedItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'Processing Stock Out' } : item
    ));
  });

  // State for creating a new reservation
  const [newReservation, setNewReservation] = useState({
    productId: '',
    quantity: 0,
    customer: '',
    startDate: '',
    endDate: '',
  });

  // State for the product name combobox (create form)
  const [productNameInput, setProductNameInput] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // State for the list of reserved items (dummy data)
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([
    {
      id: 'res-1',
      product: { id: 'prod-1', name: 'Laptop Pro X', description: null, created_at: '', updated_at: '' },
      quantity: 5,
      customer: 'John Doe',
      startDate: '2024-07-20',
      endDate: '2024-08-20',
      status: 'Active',
    },
    {
      id: 'res-2',
      product: { id: 'prod-2', name: 'Wireless Mouse', description: null, created_at: '', updated_at: '' },
      quantity: 10,
      customer: 'Jane Smith',
      startDate: '2024-07-10',
      endDate: '2024-07-15',
      status: 'Expired',
    },
  ]);

  // Filter products based on input when productNameInput changes
  React.useEffect(() => {
    if (!products) return;
    
    if (productNameInput) {
      const lowerCaseInput = productNameInput.toLowerCase();
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(lowerCaseInput) ||
        (product.sku && product.sku.toLowerCase().includes(lowerCaseInput))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [productNameInput, products]);

  // Handle input changes for new reservation form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewReservation(prev => ({ ...prev, [name]: value }));
  };

  // Handle product name input change for combobox
  const handleProductNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductNameInput(value);
    setSelectedProduct(null);
    setIsProductDropdownOpen(true);
    setNewReservation(prev => ({ ...prev, productId: '', name: value }));
  };

  // Handle product selection from combobox
  const handleProductSelect = (product: Product) => {
    setProductNameInput(product.name);
    setSelectedProduct(product);
    setNewReservation(prev => ({ ...prev, productId: product.id, name: product.name }));
    setIsProductDropdownOpen(false);
  };

  // Handle form submission
  const handleCreateReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const newItem: ReservedItem = {
      id: `res-${Date.now()}`,
      product: selectedProduct,
      quantity: newReservation.quantity,
      customer: newReservation.customer,
      startDate: newReservation.startDate,
      endDate: newReservation.endDate,
      status: 'Active',
    };

    setReservedItems(prev => [...prev, newItem]);
    
    // Reset form
    setNewReservation({
      productId: '',
      quantity: 0,
      customer: '',
      startDate: '',
      endDate: '',
    });
    setProductNameInput('');
    setSelectedProduct(null);
  };

  // Basic action handlers
  const handleCancelReservation = async (id: string) => {
    const itemToCancel = reservedItems.find(item => item.id === id);
    if (!itemToCancel) return;

    try {
      // Call API to cancel reservation and return items to inventory
      await fetch('/api/reservations/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: id,
          productId: itemToCancel.product.id,
          quantity: itemToCancel.quantity
        })
      });

      // Update local state
      setReservedItems(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'Cancelled' };
        }
        return item;
      }));

      // Close the dialog
      setSelectedItem(null);

    } catch (error) {
      console.error('Failed to cancel reservation:', error);
      // TODO: Show error toast
    }
  };

  const handlePushToStockOut = (id: string) => {
    const itemToPush = reservedItems.find(item => item.id === id);
    if (!itemToPush) return;

    // Navigate to stock out page with pre-selected product
    navigate('/manager/stock-out/new', {
      state: {
        preSelectedProduct: {
          id: itemToPush.product.id,
          name: itemToPush.product.name,
          quantity: itemToPush.quantity,
          destination: itemToPush.customer,
          reservationId: id
        }
      }
    });
  };

  // State for selected item in Details Dialog
  const [selectedItem, setSelectedItem] = useState<ReservedItem | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reserve Stock"
        description="Create and manage reserved stock for specific customers"
      />

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      {/* Create Reservation Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Reservation</CardTitle>
          <CardDescription>Enter Reservation Details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateReservation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productNameInput">Product*</Label>
              <div className="relative">
                <Input
                  id="productNameInput"
                  name="productNameInput"
                  value={productNameInput}
                  onChange={handleProductNameInputChange}
                  onFocus={() => setIsProductDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsProductDropdownOpen(false), 200)}
                  placeholder="Search or select product"
                  required
                  disabled={isLoadingProducts}
                />
                {isProductDropdownOpen && filteredProducts.length > 0 && (
                  <ul className="absolute z-10 w-full bg-popover border border-border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground">
                    {filteredProducts.map(product => (
                      <li
                        key={product.id}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onMouseDown={() => handleProductSelect(product)}
                      >
                        {product.name} {product.sku && `(${product.sku})`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {selectedProduct && (
                <p className="text-sm text-muted-foreground">Selected: {selectedProduct.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity*</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={newReservation.quantity}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer">Customer Name/ID*</Label>
              <Input
                id="customer"
                name="customer"
                value={newReservation.customer}
                onChange={handleInputChange}
                placeholder="Enter customer name or ID"
                required
              />
            </div>

            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="startDate">Start Date*</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={newReservation.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label htmlFor="endDate">End Date*</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={newReservation.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button type="submit">
              Create Reservation
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reserved Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>Reserved Items</CardTitle>
          <CardDescription>List of currently reserved stock items.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reserved For</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No reserved items found.
                    </TableCell>
                  </TableRow>
                ) : (
                  reservedItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.product.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.customer}</TableCell>
                      <TableCell>{format(new Date(item.startDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(item.endDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedItem(item)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <ReserveStockDetails
              item={selectedItem}
              onPushToStockOut={handlePushToStockOut}
              onCancel={handleCancelReservation}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReserveStock; 