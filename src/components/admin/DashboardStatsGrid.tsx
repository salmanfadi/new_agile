
import React from 'react';
import { StatsCard } from '@/components/ui/StatsCard';

export interface DashboardStats {
  users: number;
  warehouses: number;
  products: number;
  inventory: number;
}

export interface DashboardStatsGridProps {
  stats?: DashboardStats;
  loading?: boolean;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ 
  stats, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Users"
        value={stats?.users?.toString() || '0'}
        description="Active users in system"
      />
      <StatsCard
        title="Warehouses"
        value={stats?.warehouses?.toString() || '0'}
        description="Total warehouse locations"
      />
      <StatsCard
        title="Products"
        value={stats?.products?.toString() || '0'}
        description="Products in catalog"
      />
      <StatsCard
        title="Inventory Items"
        value={stats?.inventory?.toString() || '0'}
        description="Total inventory items"
      />
    </div>
  );
};
