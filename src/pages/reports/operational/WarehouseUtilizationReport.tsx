
import React from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { LineChart } from '@/components/reports/charts/LineChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { 
  AppleCard, 
  AppleCardContent, 
  AppleCardHeader, 
  AppleCardTitle 
} from '@/components/ui/apple-card';

// Mock data - in production this would come from a hook like useWarehouseUtilizationReport
const mockUtilizationTrendData = [
  { date: '2025-01', warehouseA: 62, warehouseB: 75, warehouseC: 88 },
  { date: '2025-02', warehouseA: 67, warehouseB: 78, warehouseC: 90 },
  { date: '2025-03', warehouseA: 72, warehouseB: 80, warehouseC: 85 },
  { date: '2025-04', warehouseA: 75, warehouseB: 82, warehouseC: 87 },
  { date: '2025-05', warehouseA: 79, warehouseB: 85, warehouseC: 89 },
];

const mockWarehouseUtilizationData = [
  { name: 'Warehouse A', total: 1250, used: 975, rate: 78 },
  { name: 'Warehouse B', total: 1800, used: 1512, rate: 84 },
  { name: 'Warehouse C', total: 950, used: 855, rate: 90 },
  { name: 'Warehouse D', total: 1100, used: 847, rate: 77 },
];

const mockZoneUtilizationData = [
  { name: 'Available Space', value: 1916 },
  { name: 'Used Space', value: 4189 },
];

const WarehouseUtilizationReport: React.FC = () => {
  // Mock functions for export (would be implemented with actual data in production)
  const handleExportCsv = () => {
    console.log('Export to CSV');
  };
  
  const handleExportPdf = () => {
    console.log('Export to PDF');
  };

  return (
    <ReportLayout
      title="Warehouse Utilization Report"
      description="Analysis of warehouse space usage and efficiency metrics"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AppleCard>
          <AppleCardHeader className="pb-2">
            <AppleCardTitle className="text-lg font-medium">Total Locations</AppleCardTitle>
          </AppleCardHeader>
          <AppleCardContent>
            <div className="text-3xl font-bold">5,100</div>
            <p className="text-sm text-muted-foreground mt-1">Across all warehouses</p>
          </AppleCardContent>
        </AppleCard>
        
        <AppleCard>
          <AppleCardHeader className="pb-2">
            <AppleCardTitle className="text-lg font-medium">Used Locations</AppleCardTitle>
          </AppleCardHeader>
          <AppleCardContent>
            <div className="text-3xl font-bold">4,189</div>
            <p className="text-sm text-muted-foreground mt-1">82.1% of total capacity</p>
          </AppleCardContent>
        </AppleCard>
        
        <AppleCard>
          <AppleCardHeader className="pb-2">
            <AppleCardTitle className="text-lg font-medium">Avg. Utilization</AppleCardTitle>
          </AppleCardHeader>
          <AppleCardContent>
            <div className="text-3xl font-bold">82.1%</div>
            <p className="text-sm text-muted-foreground mt-1">Across all warehouses</p>
          </AppleCardContent>
        </AppleCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <LineChart
          data={mockUtilizationTrendData.map(item => ({
            name: item.date,
            warehouseA: item.warehouseA,
            warehouseB: item.warehouseB,
            warehouseC: item.warehouseC
          }))}
          keys={['warehouseA', 'warehouseB', 'warehouseC']}
          title="Utilization Rate Trend"
          xAxisKey="name"
          xAxisLabel="Month"
          yAxisLabel="Utilization %"
        />

        <PieChart 
          data={mockZoneUtilizationData}
          title="Overall Space Utilization"
        />
      </div>

      <div className="mb-6">
        <BarChart
          data={mockWarehouseUtilizationData}
          keys={['used', 'total']}
          title="Warehouse Capacity Usage"
          xAxisLabel="Warehouse"
          yAxisLabel="Locations"
          height={400}
        />
      </div>
    </ReportLayout>
  );
};

export default WarehouseUtilizationReport;
