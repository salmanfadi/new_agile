import React from 'react';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type DataItem = {
  name: string;
  [key: string]: string | number;
};

interface BarChartProps {
  data: DataItem[];
  keys: string[];
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  height?: number;
}

export function BarChart({
  data,
  keys,
  title,
  xAxisLabel,
  yAxisLabel,
  colors = ['#1d4ed8', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'],
  height = 350,
}: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              margin={{ top: 5, right: 30, left: 30, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -15 } : undefined}
              />
              <YAxis 
                label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} 
              />
              <Tooltip />
              <Legend verticalAlign="top" height={36} />
              {keys.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={colors[index % colors.length]} 
                  name={key.charAt(0).toUpperCase() + key.slice(1)} 
                />
              ))}
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
