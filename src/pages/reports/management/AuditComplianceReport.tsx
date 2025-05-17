
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Mock data - in production this would come from a hook like useAuditComplianceReport
const mockActionTrendData = [
  { date: '2025-01-01', login: 245, inventory: 120, stockIn: 85, stockOut: 65 },
  { date: '2025-01-08', login: 260, inventory: 135, stockIn: 92, stockOut: 70 },
  { date: '2025-01-15', login: 255, inventory: 140, stockIn: 88, stockOut: 75 },
  { date: '2025-01-22', login: 270, inventory: 145, stockIn: 95, stockOut: 68 },
  { date: '2025-01-29', login: 280, inventory: 150, stockIn: 100, stockOut: 80 },
];

const mockActionTypeData = [
  { name: 'Login/Logout', count: 1310 },
  { name: 'Inventory View', count: 690 },
  { name: 'Stock In', count: 460 },
  { name: 'Stock Out', count: 358 },
  { name: 'User Management', count: 124 },
  { name: 'System Settings', count: 87 },
];

const mockUserActivityData = [
  { name: 'Admin Users', login: 320, inventory: 180, stock: 250, other: 95 },
  { name: 'Warehouse Managers', login: 450, inventory: 380, stock: 420, other: 65 },
  { name: 'Field Operators', login: 380, inventory: 105, stock: 85, other: 25 },
  { name: 'Sales Operators', login: 160, inventory: 25, stock: 15, other: 10 },
];

const mockComplianceData = [
  { name: 'Compliant', value: 92 },
  { name: 'Non-Compliant', value: 8 }
];

const AuditComplianceReport: React.FC = () => {
  // Mock functions for export (would be implemented with actual data in production)
  const handleExportCsv = () => {
    console.log('Export to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
  };

  return (
    <ReportLayout
      title="Audit & Compliance Report"
      description="System usage, user activity, and compliance metrics"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3,029</div>
            <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
            <p className="text-sm text-muted-foreground mt-1">Across all roles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">92%</div>
            <p className="text-sm text-muted-foreground mt-1">Based on policy adherence</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Exceptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">23</div>
            <p className="text-sm text-muted-foreground mt-1">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockActionTrendData}
          keys={['login', 'inventory', 'stockIn', 'stockOut']}
          title="System Activity Trend"
          xAxisKey="date"
          xAxisLabel="Week"
          yAxisLabel="Actions"
        />

        <PieChart 
          data={mockComplianceData}
          title="Compliance Distribution"
          colors={['#10b981', '#ef4444']}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={mockActionTypeData}
          keys={['count']}
          title="Actions by Type"
          xAxisLabel="Action Type"
          yAxisLabel="Count"
        />

        <BarChart
          data={mockUserActivityData}
          keys={['login', 'inventory', 'stock', 'other']}
          title="Activity by User Role"
          xAxisLabel="User Role"
          yAxisLabel="Actions"
        />
      </div>
    </ReportLayout>
  );
};

export default AuditComplianceReport;
