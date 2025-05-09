
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { PackageOpen, FileText } from 'lucide-react';

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={() => navigate('/sales/inventory')} 
          variant="outline" 
          className="h-24 flex items-center justify-center border-dashed border-2"
        >
          <div className="flex flex-col items-center">
            <PackageOpen className="h-8 w-8 mb-2 text-blue-600" />
            <span>View Product Inventory</span>
          </div>
        </Button>
        
        <Button 
          onClick={() => navigate('/sales/inquiries')} 
          variant="outline" 
          className="h-24 flex items-center justify-center border-dashed border-2"
        >
          <div className="flex flex-col items-center">
            <FileText className="h-8 w-8 mb-2 text-blue-600" />
            <span>Manage Customer Inquiries</span>
          </div>
        </Button>
      </div>
      
      <SalesDashboard
        totalInquiries={totalInquiries}
        newInquiries={newInquiries}
        totalProducts={totalProducts}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SalesOperatorDashboard;
