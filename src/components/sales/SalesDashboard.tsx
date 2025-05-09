
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCard } from '@/components/ui/StatsCard';
import { ShoppingCart, Package, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SalesDashboardProps {
  totalInquiries: number;
  newInquiries: number;
  totalProducts: number;
  isLoading: boolean;
}

export const SalesDashboard: React.FC<SalesDashboardProps> = ({
  totalInquiries,
  newInquiries,
  totalProducts,
  isLoading
}) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Inquiries"
          value={isLoading ? "Loading..." : totalInquiries.toString()}
          description="All customer inquiries"
          icon={<ShoppingCart className="h-8 w-8 text-blue-500" />}
        />
        <StatsCard 
          title="New Inquiries"
          value={isLoading ? "Loading..." : newInquiries.toString()}
          description="Awaiting response"
          icon={<Clock className="h-8 w-8 text-yellow-500" />}
        />
        <StatsCard 
          title="Product Catalog"
          value={isLoading ? "Loading..." : totalProducts.toString()}
          description="Active products"
          icon={<Package className="h-8 w-8 text-green-500" />}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Sales Operations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:bg-gray-50">
            <CardContent className="flex flex-col items-center text-center p-6">
              <ShoppingCart className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">Customer Inquiries</h3>
              <p className="text-sm text-gray-500 mb-4">View and respond to customer inquiries</p>
              <Button asChild>
                <Link to="/sales/inquiries">
                  Manage Inquiries <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-gray-50">
            <CardContent className="flex flex-col items-center text-center p-6">
              <Package className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Product Catalog</h3>
              <p className="text-sm text-gray-500 mb-4">Browse available products</p>
              <Button asChild variant="outline">
                <Link to="/products">
                  View Products <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
