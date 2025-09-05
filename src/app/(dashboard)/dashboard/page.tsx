import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { QuickActions } from '@/components/dashboard/quick-actions';

// This would typically receive user data as props or from a context
export default function DashboardPage() {
  // Mock user role - in a real app this would come from authentication
  const userRole = 'owner'; // This should be dynamic based on logged-in user

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats grid */}
      <DashboardStats role={userRole} />

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <RecentActivity limit={8} />
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          <QuickActions userRole={userRole as any} />
        </div>
      </div>
    </div>
  );
}