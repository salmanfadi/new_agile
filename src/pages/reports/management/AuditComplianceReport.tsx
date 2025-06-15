
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { format } from 'date-fns';
import { ReportFilters as ReportFiltersType } from '@/types/reports';

// Mock data for audit events
const mockAuditEvents = [
  { id: '1', event: 'Stock Adjustment', userId: 'user-1', userName: 'John Smith', timestamp: '2025-05-10T14:30:00', entity: 'Inventory', entityId: 'inv-1234', details: { reason: 'Count discrepancy', quantity: 5 }, severity: 'warning' },
  { id: '2', event: 'User Login', userId: 'user-2', userName: 'Maria Garcia', timestamp: '2025-05-10T09:15:00', entity: 'Auth', entityId: 'session-5678', details: { ip: '192.168.1.100' }, severity: 'info' },
  { id: '3', event: 'Stock Transfer Rejected', userId: 'user-3', userName: 'David Lee', timestamp: '2025-05-09T16:45:00', entity: 'Transfer', entityId: 'transfer-9012', details: { reason: 'Invalid destination' }, severity: 'critical' },
  { id: '4', event: 'Batch Processed', userId: 'user-2', userName: 'Maria Garcia', timestamp: '2025-05-09T11:20:00', entity: 'Batch', entityId: 'batch-3456', details: { items: 45 }, severity: 'info' },
  { id: '5', event: 'Inventory Count', userId: 'user-4', userName: 'Lisa Chen', timestamp: '2025-05-08T15:10:00', entity: 'Inventory', entityId: 'count-7890', details: { discrepancy: true, items: 3 }, severity: 'warning' },
];

// Mock data for event types chart
const mockEventTypesData = [
  { name: 'Stock In', value: 120 },
  { name: 'Stock Out', value: 95 },
  { name: 'Adjustments', value: 45 },
  { name: 'User Activity', value: 230 },
  { name: 'Transfers', value: 65 },
];

// Mock data for severity distribution chart
const mockSeverityData = [
  { name: 'Info', value: 350 },
  { name: 'Warning', value: 85 },
  { name: 'Critical', value: 20 },
];

// Mock data for audit activity trend
const mockAuditTrendData = [
  { date: 'Jan', events: 98, warnings: 12, critical: 3 },
  { date: 'Feb', events: 112, warnings: 15, critical: 2 },
  { date: 'Mar', events: 135, warnings: 18, critical: 4 },
  { date: 'Apr', events: 127, warnings: 14, critical: 3 },
  { date: 'May', events: 145, warnings: 16, critical: 2 },
];

const AuditComplianceReport: React.FC = () => {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: {
      from: new Date(2025, 0, 1),
      to: new Date()
    },
    user: 'all'
  });

  const handleFiltersChange = (newFilters: Partial<ReportFiltersType>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Export functions
  const handleExportCsv = () => {
    console.log('Exporting audit data to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Exporting audit data to PDF');
  };

  return (
    <ReportLayout 
      title="Audit & Compliance Report" 
      description="Audit trail of system activities and compliance metrics"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="mb-6">
        <ReportFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          showDateRange
          showUser
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">617</div>
            <p className="text-sm text-muted-foreground mt-1">Audit events recorded</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Warning Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">85</div>
            <p className="text-sm text-muted-foreground mt-1">13.8% of total events</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Critical Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">20</div>
            <p className="text-sm text-muted-foreground mt-1">3.2% of total events</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockAuditTrendData.map(item => ({
            name: item.date,
            events: item.events,
            warnings: item.warnings,
            critical: item.critical
          }))}
          keys={['events', 'warnings', 'critical']}
          title="Audit Activity Trend"
          xAxisKey="name"
          xAxisLabel="Month"
          yAxisLabel="Events"
        />
        
        <PieChart
          data={mockSeverityData}
          title="Event Severity Distribution"
        />
      </div>

      <div className="mb-6">
        <BarChart
          data={mockEventTypesData}
          keys={['value']}
          title="Event Types"
          xAxisLabel="Event Type"
          yAxisLabel="Count"
          height={300}
        />
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recent Audit Events</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>{event.event}</TableCell>
                  <TableCell>{event.userName}</TableCell>
                  <TableCell>
                    <span className="font-medium">{event.entity}</span>
                    <span className="text-muted-foreground text-xs ml-2">#{event.entityId.split('-')[1]}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      event.severity === 'info' ? 'outline' : 
                      event.severity === 'warning' ? 'outline' : 
                      'destructive'
                    }>
                      {event.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {JSON.stringify(event.details)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportLayout>
  );
};

export default AuditComplianceReport;
