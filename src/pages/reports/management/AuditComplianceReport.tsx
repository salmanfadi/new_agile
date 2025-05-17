
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFilters as ReportFiltersType } from '@/types/reports';
import { format } from 'date-fns';

// Mock data for the audit report
const mockAuditActionTrendData = [
  { date: '2025-01', create: 245, update: 520, delete: 32 },
  { date: '2025-02', create: 280, update: 490, delete: 28 },
  { date: '2025-03', create: 310, update: 560, delete: 35 },
  { date: '2025-04', create: 290, update: 580, delete: 30 },
  { date: '2025-05', create: 320, update: 610, delete: 25 },
];

const mockAuditByUserData = [
  { name: 'John Doe', create: 86, update: 145, delete: 12 },
  { name: 'Jane Smith', create: 92, update: 168, delete: 8 },
  { name: 'Robert Johnson', create: 78, update: 132, delete: 14 },
  { name: 'Emily Wilson', create: 64, update: 165, delete: 6 },
];

const mockAuditByModuleData = [
  { name: 'Inventory', count: 456 },
  { name: 'Stock In', count: 324 },
  { name: 'Stock Out', count: 298 },
  { name: 'Transfers', count: 180 },
  { name: 'User Management', count: 95 },
];

// Mock audit actions
const mockAuditActions = [
  {
    id: '1',
    userId: 'user-001',
    userName: 'John Doe',
    action: 'create',
    module: 'inventory',
    timestamp: '2025-05-01T10:30:00Z',
    details: { entity_id: 'inv-001', entity_type: 'inventory_item', description: 'Created new inventory item' }
  },
  {
    id: '2',
    userId: 'user-002',
    userName: 'Jane Smith',
    action: 'update',
    module: 'stock_in',
    timestamp: '2025-05-02T14:15:00Z',
    details: { entity_id: 'si-002', entity_type: 'stock_in_request', description: 'Updated stock-in request status' }
  },
  {
    id: '3',
    userId: 'user-001',
    userName: 'John Doe',
    action: 'update',
    module: 'inventory',
    timestamp: '2025-05-03T09:45:00Z',
    details: { entity_id: 'inv-002', entity_type: 'inventory_item', description: 'Updated inventory quantity' }
  },
  {
    id: '4',
    userId: 'user-003',
    userName: 'Robert Johnson',
    action: 'delete',
    module: 'stock_out',
    timestamp: '2025-05-04T11:20:00Z',
    details: { entity_id: 'so-003', entity_type: 'stock_out_request', description: 'Deleted draft stock-out request' }
  }
];

const AuditComplianceReport: React.FC = () => {
  // In a real implementation, these states and data would come from a hook
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: new Date('2025-05-01'),
      to: new Date('2025-05-31')
    }
  });
  
  const handleExportCsv = () => {
    console.log('Export to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
  };

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const getActionBadgeVariant = (action: string): "default" | "outline" | "secondary" | "destructive" | "success" => {
    switch (action) {
      case 'create': return 'success';
      case 'update': return 'default';
      case 'delete': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <ReportLayout
      title="Audit & Compliance Report"
      description="Track system activity and user actions for compliance"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <ReportFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        showDateRange
        showUser
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,353</div>
            <p className="text-sm text-muted-foreground mt-1">In selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">By Action Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Create</span>
              <span className="text-sm font-medium">320 (23.6%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Update</span>
              <span className="text-sm font-medium">610 (45.1%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Delete</span>
              <span className="text-sm font-medium">25 (1.8%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Read</span>
              <span className="text-sm font-medium">398 (29.4%)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">18</div>
            <p className="text-sm text-muted-foreground mt-1">Users with system activity</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <LineChart
          data={mockAuditActionTrendData}
          keys={['create', 'update', 'delete']}
          title="Audit Actions Trend"
          xAxisKey="date"
          xAxisLabel="Month"
          yAxisLabel="Count"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BarChart
          data={mockAuditByUserData}
          keys={['create', 'update', 'delete']}
          title="Actions by User"
          xAxisLabel="User"
          yAxisLabel="Count"
        />
        
        <BarChart
          data={mockAuditByModuleData}
          keys={['count']}
          title="Actions by Module"
          xAxisLabel="Module"
          yAxisLabel="Count"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAuditActions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      {format(new Date(action.timestamp), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>{action.userName}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(action.action)}>
                        {action.action.charAt(0).toUpperCase() + action.action.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {action.module.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {action.details.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default AuditComplianceReport;
