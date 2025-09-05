'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, FileText, Briefcase, Calendar, Phone } from 'lucide-react';
import { UserRole } from '@/types/auth';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  roles: UserRole[];
}

interface QuickActionsProps {
  userRole: UserRole;
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      label: 'New Lead',
      href: '/leads/new',
      icon: Plus,
      description: 'Add a new potential customer',
      roles: ['owner', 'operations_manager', 'sales_manager'],
    },
    {
      label: 'New Contact',
      href: '/contacts/new',
      icon: Users,
      description: 'Add a new contact to your CRM',
      roles: ['owner', 'operations_manager', 'sales_manager'],
    },
    {
      label: 'Create Estimate',
      href: '/estimates/new',
      icon: FileText,
      description: 'Generate a new project estimate',
      roles: ['owner', 'operations_manager', 'sales_manager', 'estimating_manager', 'estimator'],
    },
    {
      label: 'New Job',
      href: '/jobs/new',
      icon: Briefcase,
      description: 'Start a new job or project',
      roles: ['owner', 'operations_manager', 'sales_manager'],
    },
    {
      label: 'Schedule Meeting',
      href: '/calendar/new',
      icon: Calendar,
      description: 'Book a customer meeting',
      roles: ['owner', 'operations_manager', 'sales_manager', 'field_management'],
    },
    {
      label: 'Log Call',
      href: '/activities/call/new',
      icon: Phone,
      description: 'Record a customer call',
      roles: ['owner', 'operations_manager', 'sales_manager', 'estimator'],
    },
  ];

  const availableActions = quickActions.filter(action => 
    action.roles.includes(userRole)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {availableActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className="h-auto w-full justify-start gap-3 p-4 text-left"
                >
                  <div className="flex-shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
        
        {availableActions.length === 0 && (
          <div className="text-center text-muted-foreground py-6">
            No quick actions available for your role
          </div>
        )}
      </CardContent>
    </Card>
  );
}