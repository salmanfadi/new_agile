import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Boxes } from 'lucide-react';

export default function InventoryLayout() {
  // Get the current pathname for active tab highlighting
  const { pathname } = useLocation();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
        <p className="text-muted-foreground">
          Manage and view your inventory across all warehouses and locations
        </p>
      </div>
      
      <Tabs defaultValue={pathname.includes('/products') ? 'products' : 'unified'} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="unified" asChild>
            <NavLink to="/inventory/unified" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              <span>Unified View</span>
            </NavLink>
          </TabsTrigger>
          <TabsTrigger value="products" asChild>
            <NavLink to="/inventory/products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Product View</span>
            </NavLink>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Outlet />
    </div>
  );
}
