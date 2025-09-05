'use client';

import { useState } from 'react';
import { Menu, Bell, Search, LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user, currentRole, signOut, loading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Search query:', searchQuery);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || !user) {
    return (
      <header className="crm-header">
        <div className="animate-pulse bg-gray-200 rounded h-8 w-32"></div>
      </header>
    );
  }

  return (
    <header className="crm-header">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="flex flex-1 max-w-lg" onSubmit={handleSearch}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts, leads, jobs..."
              className="pl-10 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge
            variant="destructive"
            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            3
          </Badge>
        </Button>

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
          </Button>

          {/* User dropdown */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-popover p-1 shadow-md">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email}
                  </p>
                  {currentRole && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {currentRole.replace('_', ' ')}
                    </p>
                  )}
                </div>
                
                <div className="h-px bg-border my-1" />
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    // TODO: Navigate to profile page
                  }}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    // TODO: Navigate to settings page
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                
                <div className="h-px bg-border my-1" />
                
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 px-2"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}