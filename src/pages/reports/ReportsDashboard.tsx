
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart2, BarChart, PieChart } from 'lucide-react';
import { ReportCard } from '@/types/reports';

const REPORT_CARDS: ReportCard[] = [
  // Inventory Reports
  {
    id: 'inventory-status',
    title: 'Inventory Status Report',
    description: 'Current inventory levels and stock status across warehouses',
    path: '/reports/inventory/status',
    icon: 'BarChart2',
    access: ['admin', 'warehouse_manager'],
    category: 'inventory'
  },
  {
    id: 'inventory-movement',
    title: 'Inventory Movement Analysis',
    description: 'Track inbound and outbound stock movements over time',
    path: '/reports/inventory/movement',
    icon: 'BarChart',
    access: ['admin', 'warehouse_manager'],
    category: 'inventory'
  },
  {
    id: 'batch-tracking',
    title: 'Batch Tracking Report',
    description: 'Trace batch histories and processing status',
    path: '/reports/inventory/batch-tracking',
    icon: 'PieChart',
    access: ['admin', 'warehouse_manager'],
    category: 'inventory'
  },
  
  // Operational Reports
  {
    id: 'warehouse-utilization',
    title: 'Warehouse Utilization',
    description: 'Space utilization metrics across warehouses',
    path: '/reports/operational/warehouse-utilization',
    icon: 'BarChart',
    access: ['admin', 'warehouse_manager'],
    category: 'operational'
  },
  {
    id: 'stock-processing',
    title: 'Stock Processing Performance',
    description: 'Analysis of stock request processing and approval metrics',
    path: '/reports/operational/stock-processing',
    icon: 'PieChart',
    access: ['admin', 'warehouse_manager'],
    category: 'operational'
  },
  {
    id: 'transfers',
    title: 'Transfer & Movement Report',
    description: 'Inventory transfer patterns and completion rates',
    path: '/reports/operational/transfers',
    icon: 'BarChart2',
    access: ['admin', 'warehouse_manager'],
    category: 'operational'
  },
  
  // Management Reports
  {
    id: 'executive',
    title: 'Executive Dashboard',
    description: 'Key performance indicators and business metrics',
    path: '/reports/management/executive',
    icon: 'BarChart',
    access: ['admin'],
    category: 'management'
  },
  {
    id: 'audit',
    title: 'Audit & Compliance',
    description: 'User activity logs and compliance metrics',
    path: '/reports/management/audit',
    icon: 'PieChart',
    access: ['admin'],
    category: 'management'
  },
];

const ReportsDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Filter reports based on user role
  const filteredReports = REPORT_CARDS.filter(
    card => card.access.includes(user?.role as any)
  );

  // Get appropriate icon component
  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'BarChart2':
        return <BarChart2 className="h-10 w-10 text-blue-600" />;
      case 'BarChart':
        return <BarChart className="h-10 w-10 text-blue-600" />;
      case 'PieChart':
        return <PieChart className="h-10 w-10 text-blue-600" />;
      default:
        return <BarChart2 className="h-10 w-10 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports Dashboard"
        description="Access and generate reports for inventory and warehouse operations"
      />
      
      <Tabs defaultValue="inventory" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="inventory">Inventory Reports</TabsTrigger>
          <TabsTrigger value="operational">Operational Reports</TabsTrigger>
          <TabsTrigger value="management">Management Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports
              .filter(report => report.category === 'inventory')
              .map(report => (
                <Link to={report.path} key={report.id}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
                      {getIcon(report.icon)}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mt-2">{report.description}</CardDescription>
                      <Button variant="outline" className="w-full mt-4">View Report</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="operational" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports
              .filter(report => report.category === 'operational')
              .map(report => (
                <Link to={report.path} key={report.id}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
                      {getIcon(report.icon)}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mt-2">{report.description}</CardDescription>
                      <Button variant="outline" className="w-full mt-4">View Report</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="management" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports
              .filter(report => report.category === 'management')
              .map(report => (
                <Link to={report.path} key={report.id}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-xl font-bold">{report.title}</CardTitle>
                      {getIcon(report.icon)}
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-sm mt-2">{report.description}</CardDescription>
                      <Button variant="outline" className="w-full mt-4">View Report</Button>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsDashboard;
