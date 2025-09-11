'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

export function ThemeToggle({ variant = 'button', className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200",
          className
        )}
      >
        <div className="h-5 w-5 animate-pulse bg-slate-300 dark:bg-slate-600 rounded" />
      </Button>
    );
  }

  const getThemeIcon = (currentTheme: string) => {
    switch (currentTheme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Palette className="h-5 w-5" />;
    }
  };

  const getThemeLabel = (currentTheme: string) => {
    switch (currentTheme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
      default:
        return 'Theme';
    }
  };

  if (variant === 'dropdown') {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 group",
            className
          )}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={getThemeLabel(theme || 'system')}
        >
          <div className="relative">
            {getThemeIcon(theme || 'system')}
            <div className="absolute inset-0 transition-transform duration-200 group-hover:rotate-12">
              {resolvedTheme === 'dark' && theme !== 'dark' && (
                <Moon className="h-5 w-5 opacity-30" />
              )}
            </div>
          </div>
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl p-2 shadow-2xl animate-in slide-in-from-top-4 duration-200">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-3 py-2 h-auto font-normal hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 group",
                    theme === value && "bg-slate-100 dark:bg-slate-800"
                  )}
                  onClick={() => {
                    setTheme(value as 'light' | 'dark' | 'system');
                    setIsOpen(false);
                  }}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200",
                    theme === value 
                      ? "bg-blue-500 text-white" 
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {label}
                  </span>
                  {theme === value && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500" />
                  )}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Simple button variant - cycles through themes
  const handleToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105 group relative overflow-hidden",
        className
      )}
      onClick={handleToggle}
      aria-label={getThemeLabel(theme || 'system')}
    >
      <div className="relative">
        {/* Main icon */}
        <div className="transition-all duration-300 group-hover:rotate-12">
          {getThemeIcon(theme || 'system')}
        </div>
        
        {/* Subtle indicator for system theme when resolved differently */}
        {theme === 'system' && resolvedTheme && (
          <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-sm" />
        )}
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
    </Button>
  );
}