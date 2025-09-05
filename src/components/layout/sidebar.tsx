'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrganizationSwitcher } from './organization-switcher';
import { cn } from '@/lib/utils';
import { getNavigationForRole } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, currentRole, loading } = useAuth();
  
  if (loading || !user || !currentRole) {
    return null;
  }

  const navigationSections = getNavigationForRole(currentRole);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "crm-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile close button */}
        <div className="flex h-16 items-center justify-between px-6 lg:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Organization switcher */}
        <div className="p-4 border-b">
          <OrganizationSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          {navigationSections.map((section) => (
            <div key={section.name} className="space-y-1">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.name}
              </h3>
              
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={onClose} // Close mobile menu on navigation
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User info */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentRole.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}