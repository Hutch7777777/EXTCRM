import { LucideIcon } from 'lucide-react';
import { UserRole } from './auth';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badge?: string;
  children?: NavigationItem[];
}

export interface NavigationSection {
  name: string;
  items: NavigationItem[];
}