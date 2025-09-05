'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'lead' | 'job' | 'estimate' | 'contact';
  title: string;
  description: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
  status?: 'success' | 'pending' | 'warning' | 'error';
}

interface RecentActivityProps {
  limit?: number;
}

export function RecentActivity({ limit = 5 }: RecentActivityProps) {
  // Mock data - would be fetched from API based on user permissions
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'lead',
      title: 'New lead created',
      description: 'Sarah Johnson - Siding project in Westfield',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      user: { name: 'Mike Peterson' },
      status: 'success',
    },
    {
      id: '2',
      type: 'estimate',
      title: 'Estimate approved',
      description: 'Window replacement - $15,400',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      user: { name: 'Emily Chen' },
      status: 'success',
    },
    {
      id: '3',
      type: 'job',
      title: 'Job status updated',
      description: 'Multi-family project moved to "In Progress"',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      user: { name: 'Carlos Rodriguez' },
      status: 'pending',
    },
    {
      id: '4',
      type: 'contact',
      title: 'Contact updated',
      description: 'ABC Construction - Added new phone number',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      user: { name: 'Lisa Thompson' },
      status: 'success',
    },
    {
      id: '5',
      type: 'job',
      title: 'Job completed',
      description: 'Gutter installation - Maple Street',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      user: { name: 'David Wilson' },
      status: 'success',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'warning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return '👤';
      case 'job':
        return '🔨';
      case 'estimate':
        return '📄';
      case 'contact':
        return '📞';
      default:
        return '📋';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.slice(0, limit).map((activity) => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm">
                {getTypeIcon(activity.type)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                {activity.status && (
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(activity.status)}
                  >
                    {activity.status}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {activity.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  by {activity.user.name}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {activities.length === 0 && (
          <div className="text-center text-muted-foreground py-6">
            No recent activity
          </div>
        )}
      </CardContent>
    </Card>
  );
}