
import React from 'react';
import { StatsCard } from '@/components/ui/StatsCard';
import { Warehouse, Package, Users, BarChart } from 'lucide-react';

interface DashboardStats {
  users: number;
  warehouses: number;
  products: number;
  inventory: number;
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => {
  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.users, 
      icon: <Users className="h-5 w-5" />,
    },
    { 
      title: 'Warehouses', 
      value: stats.warehouses, 
      icon: <Warehouse className="h-5 w-5" />,
    },
    { 
      title: 'Products', 
      value: stats.products, 
      icon: <Package className="h-5 w-5" />,
    },
    { 
      title: 'Total Inventory', 
      value: stats.inventory, 
      icon: <BarChart className="h-5 w-5" />,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsCards.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
        />
      ))}
    </div>
  );
};
