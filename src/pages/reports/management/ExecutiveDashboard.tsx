
import React, { useState, useCallback } from 'react';
import { ReportLayout } from '@/components/reports/ReportLayout';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/reports/charts/LineChart';
import { BarChart } from '@/components/reports/charts/BarChart';
import { PieChart } from '@/components/reports/charts/PieChart';
import { useExecutiveDashboard } from '@/hooks/reports/useExecutiveDashboard';
import { prepareChartData, formatPercentage } from '@/utils/exportUtils';
import { ReportFilters as ReportFiltersType } from '@/types/reports';
import { subDays } from 'date-fns';
import { ChartColumnBig, ChartColumnStacked, ChartBarBig } from 'lucide-react';

const ExecutiveDashboard = () => {
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateRange: { 
      from: subDays(new Date(), 30), // Last 30 days by default
      to: new Date() 
    }
  });
  
  const { data, timeSeriesData, isLoading, error, setFilters: updateFilters } = useExecutiveDashboard(filters);
  
  const handleFilterChange = useCallback((newFilters: ReportFiltersType) => {
    setFilters(newFilters);
    updateFilters(newFilters);
  }, [updateFilters]);

  return (
    <ReportLayout
      title="Executive Dashboard"
      description="Key performance indicators and business analytics"
      loading={isLoading}
      error={error}
    >
      <ReportFilters 
        onFilterChange={handleFilterChange}
        defaultFilters={filters}
      />
      
      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ChartColumnBig className="h-7 w-7 text-blue-600 mr-2" />
                  <div className="text-3xl font-bold">
                    ${data.inventoryValue.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Turnover Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ChartColumnStacked className="h-7 w-7 text-emerald-600 mr-2" />
                  <div className="text-3xl font-bold">
                    {data.turnoverRate.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Stock In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ChartBarBig className="h-7 w-7 text-green-600 mr-2" />
                  <div className="text-3xl font-bold text-green-600">
                    +{data.stockMovements.in.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-500">Stock Out</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <ChartBarBig className="h-7 w-7 text-red-600 mr-2" />
                  <div className="text-3xl font-bold text-red-600">
                    -{data.stockMovements.out.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Stock Movement Chart */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <LineChart 
              data={timeSeriesData}
              keys={['in', 'out', 'net']}
              title="Stock Movement Trends"
              xAxisKey="date"
              xAxisLabel="Date"
              yAxisLabel="Quantity"
              colors={['#10b981', '#ef4444', '#3b82f6']}
            />
          </div>
          
          {/* Top Products and Warehouse Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Quantity</CardTitle>
              </CardHeader>
              <CardContent>
                <BarChart
                  data={data.topProducts.map(p => ({ name: p.name, quantity: p.quantity }))}
                  keys={['quantity']}
                  title=""
                  height={300}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Warehouse Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart
                  data={Object.entries(data.warehouseUtilization).map(([name, value]) => ({
                    name,
                    value: parseFloat((value * 100).toFixed(1))
                  }))}
                  title=""
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Stock Movement Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-500">Stock In</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{data.stockMovements.in.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Units received</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-500">Stock Out</div>
                  <div className="text-2xl font-bold text-red-600">
                    -{data.stockMovements.out.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Units shipped</div>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-500">Net Change</div>
                  <div className={`text-2xl font-bold ${data.stockMovements.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.stockMovements.net >= 0 ? '+' : ''}{data.stockMovements.net.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Net inventory change</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </ReportLayout>
  );
};

export default ExecutiveDashboard;
