# Layout Components Documentation

This document describes the foundational layout components created for the multi-tenant exterior finishing CRM.

## Overview

The layout system provides a complete foundation for building the CRM interface with mobile-first responsive design, role-based navigation, and multi-tenant organization switching.

## Component Architecture

### Core UI Components (`/src/components/ui/`)

- **Button** - Reusable button component with multiple variants (default, destructive, outline, secondary, ghost, link) and sizes
- **Card** - Container component with header, content, and footer sections
- **Input** - Form input component with consistent styling
- **Badge** - Status and category indicator component
- **Avatar** - User profile image component with fallback initials
- **DropdownMenu** - Basic dropdown menu components

### Layout Components (`/src/components/layout/`)

- **AppLayout** - Main application layout wrapper that orchestrates all layout components
- **Sidebar** - Collapsible navigation sidebar with role-based menu items
- **Header** - Top navigation bar with search, notifications, and user menu
- **OrganizationSwitcher** - Multi-tenant organization selection component

### Dashboard Components (`/src/components/dashboard/`)

- **DashboardStats** - Key metrics display with role-based visibility
- **RecentActivity** - Activity feed showing recent CRM actions
- **QuickActions** - Role-based quick action buttons for common tasks

## Key Features

### Multi-Tenant Support
- Organization switcher in sidebar shows all organizations user has access to
- Current organization context drives data filtering
- Organization logos and branding support

### Role-Based Navigation
- Navigation items filtered by user role (Owner, Operations Manager, Sales Manager, etc.)
- Different quick actions available based on permissions
- Statistics and data visibility controlled by role

### Mobile-First Responsive Design
- Sidebar collapses to mobile overlay on smaller screens
- Touch-friendly navigation elements
- Responsive grid layouts for dashboard components
- Mobile-optimized header with hamburger menu

### Navigation Structure
- **Dashboard** - Overview with stats, recent activity, and quick actions
- **CRM Section** - Contacts, Leads, Jobs, Estimates
- **Business Section** - Calendar, Reports, Field Management  
- **Settings Section** - Organization and User management

## User Roles & Permissions

### Owner
- Full access to all features and data
- Organization and user management
- All reports and analytics

### Operations Manager  
- All data visibility
- Job and lead management
- Field management oversight

### Sales Manager
- Lead and contact management
- Sales data and estimates
- Customer-focused features

### Estimating Manager
- Estimate creation and management
- Job oversight
- Estimating reports

### Estimator
- Create and edit estimates
- View job information
- Limited data access

### Field Management
- Mobile-focused interface
- Job status updates
- Photo uploads and time tracking

## Technology Stack

- **Next.js 14** - App Router with server components
- **React 18** - Latest React features
- **TypeScript** - Type safety throughout
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Component design system
- **Lucide React** - Icon library
- **date-fns** - Date formatting

## File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Dashboard layout with mock data
│   │   └── dashboard/
│   │       └── page.tsx         # Dashboard page
│   ├── globals.css              # Global styles with Tailwind setup
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Root redirect to dashboard
├── components/
│   ├── ui/                      # Core UI components
│   ├── layout/                  # Layout components
│   ├── dashboard/               # Dashboard-specific components
│   └── index.ts                 # Component exports
├── lib/
│   ├── navigation.tsx           # Navigation configuration
│   └── utils.ts                 # Utility functions
└── types/
    ├── auth.ts                  # User and organization types
    └── navigation.ts            # Navigation types
```

## Design Decisions

### Mobile-First Approach
- All components designed for mobile screens first
- Progressive enhancement for larger screens
- Touch-friendly interaction areas
- Collapsible navigation for space efficiency

### Role-Based Architecture
- Navigation and features dynamically filtered by user role
- Permission system built into component props
- Scalable role definition system

### Multi-Tenant Foundation
- Organization context baked into all components
- Easy switching between organizations
- Isolated data views by organization

### Clean, Professional Design
- Minimal cognitive load with clear hierarchy
- Consistent spacing and typography
- Professional color scheme suitable for business use
- Accessible design patterns

## Next Steps

1. **Authentication Integration** - Connect to Supabase auth
2. **Data Integration** - Replace mock data with real API calls
3. **Page Components** - Build individual CRM pages (contacts, leads, jobs, estimates)
4. **Forms and Validation** - Add form components for data entry
5. **Real-time Updates** - Integrate Supabase real-time features
6. **Mobile Optimization** - Further optimize for field management users
7. **Testing** - Add component and integration tests

## Usage Example

```tsx
import { AppLayout } from '@/components/layout/app-layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      user={user}
      organizations={organizations}
      currentOrganization={currentOrganization}
      onOrganizationChange={handleOrgChange}
      onLogout={handleLogout}
    >
      {children}
    </AppLayout>
  );
}
```

The layout system provides a solid foundation for building out the complete CRM functionality while maintaining consistency and usability across all user roles and device types.