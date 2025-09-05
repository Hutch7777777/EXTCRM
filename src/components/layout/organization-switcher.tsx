'use client';

import { useState } from 'react';
import { Check, ChevronDown, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

interface OrganizationSwitcherProps {
  className?: string;
}

export function OrganizationSwitcher({
  className,
}: OrganizationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  
  const { 
    currentOrganization, 
    organizations, 
    switchOrganization,
    loading 
  } = useAuth();

  const getOrganizationInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleOrganizationChange = async (organizationId: string) => {
    if (!currentOrganization || organizationId === currentOrganization.id) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await switchOrganization(organizationId);
      setIsOpen(false);
    } catch (error) {
      console.error('Error switching organization:', error);
      // Could add toast notification here
    } finally {
      setSwitching(false);
    }
  };

  if (loading || !currentOrganization) {
    return (
      <div className={cn("flex items-center gap-2 p-2", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="ghost"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between bg-background hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
      >
        <div className="flex items-center gap-2 min-w-0">
          {switching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentOrganization.logo_url || undefined} />
              <AvatarFallback className="text-xs">
                {getOrganizationInitials(currentOrganization.name)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="truncate text-sm font-medium">
            {currentOrganization.name}
          </span>
        </div>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-1 shadow-md">
            {organizations?.map((org) => {
              const isSelected = org.id === currentOrganization.id;
              
              return (
                <div
                  key={org.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent",
                    isSelected && "bg-accent",
                    switching && "pointer-events-none opacity-50"
                  )}
                  onClick={() => handleOrganizationChange(org.id)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getOrganizationInitials(org.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {org.name}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {org.role.replace('_', ' ')}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <Check className="h-4 w-4" />
                  )}
                </div>
              );
            })}
            
            {(!organizations || organizations.length === 0) && (
              <div className="px-2 py-6 text-center text-sm">
                No organizations found.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}