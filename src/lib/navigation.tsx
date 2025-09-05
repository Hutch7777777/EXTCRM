import {
  Home,
  Users,
  UserPlus,
  Briefcase,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  MapPin,
  Phone,
  DollarSign,
} from 'lucide-react';
import { NavigationSection, NavigationItem } from '@/types/navigation';
import { UserRole } from '@/types/auth';

export const navigationSections: NavigationSection[] = [
  {
    name: 'Main',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        roles: ['owner', 'operations_manager', 'sales_manager', 'estimating_manager', 'estimator', 'field_management'],
      },
    ],
  },
  {
    name: 'CRM',
    items: [
      {
        name: 'Contacts',
        href: '/contacts',
        icon: Users,
        roles: ['owner', 'operations_manager', 'sales_manager'],
      },
      {
        name: 'Leads',
        href: '/leads',
        icon: UserPlus,
        roles: ['owner', 'operations_manager', 'sales_manager'],
      },
      {
        name: 'Jobs',
        href: '/jobs',
        icon: Briefcase,
        roles: ['owner', 'operations_manager', 'sales_manager', 'estimating_manager', 'field_management'],
      },
      {
        name: 'Estimates',
        href: '/estimates',
        icon: FileText,
        roles: ['owner', 'operations_manager', 'sales_manager', 'estimating_manager', 'estimator'],
      },
    ],
  },
  {
    name: 'Business',
    items: [
      {
        name: 'Calendar',
        href: '/calendar',
        icon: Calendar,
        roles: ['owner', 'operations_manager', 'sales_manager', 'field_management'],
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['owner', 'operations_manager', 'sales_manager', 'estimating_manager'],
      },
      {
        name: 'Field Management',
        href: '/field',
        icon: MapPin,
        roles: ['owner', 'operations_manager', 'field_management'],
      },
    ],
  },
  {
    name: 'Settings',
    items: [
      {
        name: 'Organization',
        href: '/settings/organization',
        icon: Settings,
        roles: ['owner', 'operations_manager'],
      },
      {
        name: 'Users',
        href: '/settings/users',
        icon: Users,
        roles: ['owner'],
      },
    ],
  },
];

export function getNavigationForRole(role: UserRole): NavigationSection[] {
  return navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.includes(role))
  })).filter(section => section.items.length > 0);
}

export function canAccessRoute(route: string, role: UserRole): boolean {
  const allItems = navigationSections.flatMap(section => section.items);
  const matchingItem = allItems.find(item => route.startsWith(item.href));
  return matchingItem ? matchingItem.roles.includes(role) : false;
}