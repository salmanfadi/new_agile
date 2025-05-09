
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { SalesDashboard } from '@/components/sales/SalesDashboard';
import { useAuth } from '@/context/AuthContext';

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
    </div>
  );
};

export default SalesOperatorDashboard;
