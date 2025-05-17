import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, LayoutGrid, Package, Users, ClipboardList, ExternalLink, FileBarChart, Boxes, Beaker } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={() => navigate('/admin/users')}>
          Manage Users
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <Card 
          onClick={() => navigate('/admin/inventory')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
            <Package className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View and manage current inventory levels
            </p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => navigate('/admin/stock-in')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Stock-In Requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage incoming stock and process requests
            </p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => navigate('/admin/stock-out')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Stock-Out Requests</CardTitle>
            <LayoutGrid className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage outgoing stock and fulfill orders
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate('/admin/transfers')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inventory Transfers</CardTitle>
            <ExternalLink className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage inventory transfers between warehouses
            </p>
          </CardContent>
        </Card>

        <Card
          onClick={() => navigate('/admin/reports')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Reports</CardTitle>
            <FileBarChart className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Generate and view inventory reports
            </p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => navigate('/admin/users')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </CardContent>
        </Card>
        
        <Card 
          onClick={() => navigate('/admin/test-data')}
          className="cursor-pointer hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Test Data Generator</CardTitle>
            <Beaker className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Generate sample data to test the system functionality
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
