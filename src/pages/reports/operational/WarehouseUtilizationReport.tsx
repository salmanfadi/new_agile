
import React, { useState } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock data - in production this would come from a hook like useWarehouseUtilizationReport
const mockWarehouseData = [
  { name: 'Warehouse A', total: 500, used: 350, available: 150 },
  { name: 'Warehouse B', total: 800, used: 620, available: 180 },
  { name: 'Warehouse C', total: 300, used: 270, available: 30 },
  { name: 'Warehouse D', total: 650, used: 400, available: 250 },
];

const mockUtilizationByZone = [
  { name: 'Zone A', used: 85, available: 15 },
  { name: 'Zone B', used: 70, available: 30 },
  { name: 'Zone C', used: 90, available: 10 },
  { name: 'Zone D', used: 60, available: 40 },
];

const mockUtilizationByFloor = [
  { name: 'Floor 1', used: 75, available: 25 },
  { name: 'Floor 2', used: 80, available: 20 },
  { name: 'Floor 3', used: 65, available: 35 },
];

const mockPieData = [
  { name: 'Used Space', value: 1640 },
  { name: 'Available Space', value: 610 }
];

const WarehouseUtilizationReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState('warehouses');
  
  // Mock function for export (would be implemented with actual data in production)
  const handleExportCsv = () => {
    console.log('Export to CSV');
    // Implementation would generate and download CSV file
  };
  
  // Mock function for export (would be implemented with actual data in production)
  const handleExportPdf = () => {
    console.log('Export to PDF');
    // Implementation would generate and download PDF file
  };

  return (
    <ReportLayout
      title="Warehouse Utilization Report"
      description="Analyze space utilization across warehouses, zones, and floors"
      onExportCsv={handleExportCsv}
      onExportPdf={handleExportPdf}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2,250 units</div>
            <p className="text-sm text-muted-foreground mt-1">Across all warehouses</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Used Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,640 units</div>
            <p className="text-sm text-muted-foreground mt-1">72.9% of total capacity</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Available Space</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">610 units</div>
            <p className="text-sm text-muted-foreground mt-1">27.1% of total capacity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PieChart 
          data={mockPieData}
          title="Overall Space Utilization"
          colors={['#3b82f6', '#93c5fd']}
        />

        <BarChart
          data={mockWarehouseData}
          keys={['used', 'available']}
          title="Utilization by Warehouse"
          xAxisLabel="Warehouse"
          yAxisLabel="Space Units"
          colors={['#3b82f6', '#93c5fd']}
        />
      </div>

      <Tabs defaultValue="warehouses" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="warehouses">By Warehouse</TabsTrigger>
          <TabsTrigger value="zones">By Zone</TabsTrigger>
          <TabsTrigger value="floors">By Floor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="warehouses" className="mt-0">
          <BarChart
            data={mockWarehouseData}
            keys={['used', 'available']}
            title="Detailed Warehouse Utilization"
            xAxisLabel="Warehouse"
            yAxisLabel="Space Units"
            colors={['#3b82f6', '#93c5fd']}
          />
        </TabsContent>
        
        <TabsContent value="zones" className="mt-0">
          <BarChart
            data={mockUtilizationByZone}
            keys={['used', 'available']}
            title="Zone Space Utilization"
            xAxisLabel="Zone"
            yAxisLabel="Space Units (%)"
            colors={['#3b82f6', '#93c5fd']}
          />
        </TabsContent>
        
        <TabsContent value="floors" className="mt-0">
          <BarChart
            data={mockUtilizationByFloor}
            keys={['used', 'available']}
            title="Floor Space Utilization"
            xAxisLabel="Floor"
            yAxisLabel="Space Units (%)"
            colors={['#3b82f6', '#93c5fd']}
          />
        </TabsContent>
      </Tabs>
    </ReportLayout>
  );
};

export default WarehouseUtilizationReport;
