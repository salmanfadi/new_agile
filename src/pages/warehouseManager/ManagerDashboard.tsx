
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/StatsCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, BoxesIcon, ArrowDownToLine, ArrowUpFromLine, 
  Truck, Warehouse, Barcode, LayoutDashboard 
} from 'lucide-react';

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const userName = user?.name || 'Warehouse Manager';

  return (
    <div className="p-6 space-y-6">
      <PageHeader 
        title={`Welcome, ${userName}`} 
        description="Manage warehouse operations and inventory"
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Pending Stock In"
          value="5"
          description="Awaiting processing"
          icon={<ArrowDownToLine />}
        />
        <StatsCard
          title="Pending Stock Out"
          value="3"
          description="Awaiting approval"
          icon={<ArrowUpFromLine />}
        />
        <StatsCard
          title="Active Inventory"
          value="1,234"
          description="Items in stock"
          icon={<BoxesIcon />}
        />
        <StatsCard
          title="Warehouses"
          value="2"
          description="Under management"
          icon={<Warehouse />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Stock In</CardTitle>
            <CardDescription>Process incoming inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review and process incoming stock requests from field operators and suppliers.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/manager/stock-in">
                <Package className="mr-2 h-4 w-4" />
                Process Stock In
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Out</CardTitle>
            <CardDescription>Manage outgoing inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Approve and process outgoing stock requests for shipment or distribution.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/manager/stock-out-approval">
                <Truck className="mr-2 h-4 w-4" />
                Approve Stock Out
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>View current inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Check stock levels, locations, and details across all warehouses.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/manager/inventory">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                View Inventory
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barcode Scanner</CardTitle>
            <CardDescription>Scan product barcodes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Scan barcodes to quickly identify and locate products in the warehouse.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/scan">
                <Barcode className="mr-2 h-4 w-4" />
                Open Scanner
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
