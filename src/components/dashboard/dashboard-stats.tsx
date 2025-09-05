'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  FileText, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatItem {
  label: string;
  value: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ElementType;
}

interface DashboardStatsProps {
  role?: string;
}

export function DashboardStats({ role = 'owner' }: DashboardStatsProps) {
  // Stats would be fetched based on user role and permissions
  const getStatsForRole = (): StatItem[] => {
    const baseStats: StatItem[] = [
      {
        label: 'Total Contacts',
        value: '2,345',
        change: 12,
        changeType: 'increase',
        icon: Users,
      },
      {
        label: 'Active Leads',
        value: '156',
        change: 8,
        changeType: 'increase',
        icon: UserPlus,
      },
      {
        label: 'Jobs in Progress',
        value: '42',
        change: -3,
        changeType: 'decrease',
        icon: Briefcase,
      },
      {
        label: 'Pending Estimates',
        value: '23',
        change: 5,
        changeType: 'increase',
        icon: FileText,
      },
    ];

    // Add role-specific stats
    if (role === 'owner' || role === 'operations_manager') {
      baseStats.push({
        label: 'Monthly Revenue',
        value: '$124,500',
        change: 15,
        changeType: 'increase',
        icon: DollarSign,
      });
    }

    return baseStats;
  };

  const stats = getStatsForRole();

  const getTrendIcon = (changeType?: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendColor = (changeType?: 'increase' | 'decrease' | 'neutral') => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="mobile-grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change !== undefined && (
                <div className="flex items-center space-x-1 text-xs">
                  {getTrendIcon(stat.changeType)}
                  <span className={cn(getTrendColor(stat.changeType))}>
                    {Math.abs(stat.change)}%
                  </span>
                  <span className="text-muted-foreground">from last month</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}