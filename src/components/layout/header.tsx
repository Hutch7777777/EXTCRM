'use client';

import { useState } from 'react';
import { Menu, Bell, Search, LogOut, Settings, User, Building2, Command, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const { user, currentRole, currentOrganization, signOut, loading } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality with advanced search modal
    console.log('Search query:', searchQuery);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm';
      case 'operations_manager':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm';
      case 'sales_manager':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm';
      case 'estimating_manager':
        return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm';
      case 'estimator':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-sm';
      case 'field_management':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm';
    }
  };

  if (loading || !user) {
    return (
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center border-b bg-background/80 backdrop-blur-xl px-4 shadow-sm sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded h-8 w-8"></div>
          <div className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded h-6 w-32"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 shadow-lg sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
        onClick={onMenuToggle}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Enhanced search */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="flex flex-1 max-w-2xl" onSubmit={handleSearch}>
          <div className={cn(
            "relative w-full transition-all duration-300 ease-out",
            searchFocused && "scale-[1.02]"
          )}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <Search className={cn(
                "h-4 w-4 transition-all duration-200",
                searchFocused ? "text-blue-500 scale-110" : "text-slate-400"
              )} />
              {!searchQuery && !searchFocused && (
                <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                  <Command className="h-2.5 w-2.5" />
                  K
                </kbd>
              )}
            </div>
            <Input
              type="search"
              placeholder="Search contacts, leads, jobs..."
              className={cn(
                "pl-10 pr-4 h-10 rounded-xl transition-all duration-300 ease-out border-0 shadow-sm",
                "bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50",
                "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                "focus:shadow-lg focus:shadow-blue-500/10 dark:focus:shadow-blue-400/20",
                "focus:bg-white dark:focus:bg-slate-900",
                "focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30",
                searchFocused && "shadow-lg shadow-blue-500/10 dark:shadow-blue-400/20"
              )}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchQuery && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                  onClick={() => setSearchQuery('')}
                >
                  <Command className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-x-3 lg:gap-x-4">
        {/* Organization info - enhanced */}
        {currentOrganization && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gradient-to-r from-slate-50/80 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-800/80 border border-slate-200/60 dark:border-slate-800/60 shadow-sm backdrop-blur-sm hover:shadow-md transition-all duration-200">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate max-w-32">
              {currentOrganization.name}
            </span>
          </div>
        )}

        {/* Enhanced notifications */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 group"
          >
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
            <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">3</span>
            </div>
            {/* Pulse animation */}
            <div className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-red-500/30 animate-ping"></div>
          </Button>
        </div>

        {/* Theme toggle */}
        <ThemeToggle variant="dropdown" className="hidden sm:block" />

        {/* Quick actions */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 group"
        >
          <Zap className="h-5 w-5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors" />
        </Button>

        {/* Enhanced user menu */}
        <div className="relative">
          <Button
            variant="ghost"
            className="relative h-10 w-auto rounded-xl px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 group"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 ring-2 ring-white dark:ring-slate-800 shadow-lg transition-transform duration-200 group-hover:scale-110">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {user.first_name} {user.last_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {currentRole && (
                    <Badge 
                      className={cn(
                        "text-[10px] font-medium capitalize px-1.5 py-0.5 rounded border-0",
                        getRoleBadgeColor(currentRole)
                      )}
                    >
                      {currentRole?.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Button>

          {/* Enhanced user dropdown */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserMenuOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 top-full z-50 mt-3 w-80 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-3 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                {/* User info header */}
                <div className="px-4 py-4 border-b border-slate-200/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 ring-2 ring-slate-200 dark:ring-slate-700 shadow-lg">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <div className="mt-2">
                        {currentRole && (
                          <Badge 
                            className={cn(
                              "text-xs font-medium capitalize px-2 py-1 rounded border-0",
                              getRoleBadgeColor(currentRole)
                            )}
                          >
                            {currentRole?.replace(/_/g, ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Menu items */}
                <div className="py-3 space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-3 h-auto font-normal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // TODO: Navigate to profile page
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Profile Settings</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Manage your account</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-3 h-auto font-normal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // TODO: Navigate to settings page
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-500 group-hover:text-white transition-all duration-200">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">Settings</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">App preferences</div>
                    </div>
                  </Button>
                  
                  <div className="h-px bg-slate-200/60 dark:bg-slate-800/60 my-3 mx-4" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-3 h-auto font-normal text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all duration-200 group"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all duration-200">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">Sign Out</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">End your session</div>
                    </div>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}