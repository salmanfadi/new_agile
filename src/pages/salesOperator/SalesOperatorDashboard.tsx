
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageSearch, MessageSquare, BarChart4, Users } from 'lucide-react';

const SalesOperatorDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [totalInquiries, setTotalInquiries] = useState(0);
  const [newInquiries, setNewInquiries] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // For demo purposes, we'll use mock data
        // In a real app, this would fetch from Supabase
        setTimeout(() => {
          setTotalInquiries(24);
          setNewInquiries(5);
          setTotalProducts(120);
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.name || 'Sales Operator'}`}
        description="Manage customer inquiries and view product information"
      />
      
      <SalesDashboard
        totalInquiries={totalInquiries}
        newInquiries={newInquiries}
        totalProducts={totalProducts}
        isLoading={isLoading}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle>View Products</CardTitle>
            <CardDescription>Browse the product catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access detailed information about all products in our inventory.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/sales/inventory')} 
              variant="default" 
              className="w-full"
            >
              <PackageSearch className="mr-2 h-4 w-4" />
              Product Catalog
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle>Manage Inquiries</CardTitle>
            <CardDescription>Handle customer requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and respond to customer inquiries and track their status.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/sales/inquiries')} 
              variant="default" 
              className="w-full"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Customer Inquiries
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle>Sales Analytics</CardTitle>
            <CardDescription>View performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access sales reports and performance analytics for informed decisions.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/sales')} 
              variant="default" 
              className="w-full"
            >
              <BarChart4 className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SalesOperatorDashboard;
