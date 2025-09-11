'use client'

import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { useAuth } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  Sparkles, 
  TrendingUp,
  Bell,
  Settings,
  ChevronRight,
  Zap,
  Star,
  Clock,
  Users,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, currentOrganization, loading } = useAuth()

  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Get current date info
  const getCurrentDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return today.toLocaleDateString('en-US', options);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg';
      case 'operations_manager':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg';
      case 'sales_manager':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg';
      case 'estimating_manager':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg';
      case 'estimator':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg';
      case 'field_management':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0 shadow-lg';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-xl"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Loading Dashboard</h3>
            <p className="text-slate-500 dark:text-slate-400">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <div className="text-center space-y-6 max-w-md p-8 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl">
          <div className="relative">
            <div className="h-20 w-20 mx-auto rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl">
              <Settings className="h-10 w-10 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-xl"></div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Setup Required
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Please complete your registration to access the dashboard and start managing your exterior finishing business.
            </p>
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <Sparkles className="h-4 w-4 mr-2" />
            Complete Setup
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-slate-950/50 dark:via-slate-900 dark:to-slate-800/30">
      <div className="space-y-8 p-6 lg:p-8">
        {/* Enhanced Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-slate-900/90 dark:via-blue-950/20 dark:to-purple-950/10 border border-slate-200/60 dark:border-slate-800/60 shadow-2xl">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] via-transparent to-purple-500/[0.03]" />
          <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl" />
          <div className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/10 to-blue-400/10 blur-3xl" />
          
          {/* Content */}
          <div className="relative px-8 py-10 lg:px-12 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-6">
                {/* Greeting section */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-600/30 blur-xl scale-110"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                      {getGreeting()}, {user.first_name}!
                    </h1>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-medium">{getCurrentDate()}</span>
                    </div>
                  </div>
                </div>
                
                {/* User info badges */}
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge 
                    className={cn(
                      "text-sm font-semibold capitalize px-4 py-2 rounded-xl",
                      getRoleBadgeColor(user.role)
                    )}
                  >
                    <Star className="h-3 w-3 mr-1.5" />
                    {user.role?.replace(/_/g, ' ')}
                  </Badge>
                  
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                      <Users className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {currentOrganization.name}
                    </span>
                  </div>
                </div>
                
                {/* Welcome message */}
                <div className="space-y-3 max-w-2xl">
                  <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    Welcome to your command center for exterior finishes management.
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    Track projects, manage leads, and grow your business with powerful tools designed specifically for contractors like you.
                  </p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <Button 
                  size="lg" 
                  className="gap-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  <BarChart3 className="h-5 w-5" />
                  View Reports
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="gap-3 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <Bell className="h-5 w-5" />
                  Latest Updates
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Key Metrics
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Real-time insights into your business performance
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
            >
              <TrendingUp className="h-4 w-4" />
              View All Metrics
            </Button>
          </div>
          
          <DashboardStats role={user.role} user={user} organization={currentOrganization} />
        </div>

        {/* Main content grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Recent activity - takes up more space */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Recent Activity
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Stay up to date with your latest business activities
                </p>
              </div>
            </div>
            
            <RecentActivity limit={8} organizationId={currentOrganization.id} />
          </div>
          
          {/* Sidebar content */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Common tasks and shortcuts
                  </p>
                </div>
              </div>
              
              <QuickActions userRole={user.role} user={user} />
            </div>
            
            {/* Upcoming tasks or calendar preview */}
            <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Today&apos;s Schedule
                </h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Site inspection</p>
                    <p className="text-slate-500 dark:text-slate-400">123 Oak Street - 10:00 AM</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Client meeting</p>
                    <p className="text-slate-500 dark:text-slate-400">Johnson residence - 2:30 PM</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100">Estimate review</p>
                    <p className="text-slate-500 dark:text-slate-400">Downtown project - 4:00 PM</p>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                View Full Calendar
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}