# Authentication System Integration Guide

## Overview

This guide explains how to integrate and use the comprehensive multi-tenant authentication system implemented for the EXTCRM application.

## System Components

### 1. Supabase Client Configuration

**Files:**
- `src/lib/supabase/client.ts` - Browser client for React components
- `src/lib/supabase/server.ts` - Server clients for SSR and API routes
- `src/lib/supabase/middleware.ts` - Middleware for session management

**Usage:**
```typescript
// In client components
import { createClient } from '@/lib/supabase/client'

// In server components
import { createServerClient } from '@/lib/supabase/server'

// In API routes
import { createRouteClient } from '@/lib/supabase/server'
```

### 2. Authentication Context

**File:** `src/contexts/auth-context.tsx`

**Features:**
- User authentication state management
- Organization switching without re-login
- Role-based permissions
- Session persistence across page loads

**Usage:**
```typescript
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { 
    user, 
    currentOrganization, 
    currentRole, 
    organizations,
    signIn, 
    signOut, 
    switchOrganization,
    hasPermission,
    hasRole,
    isOwner,
    isAdmin,
    loading 
  } = useAuth()

  // Use authentication state and methods
}
```

### 3. Role-Based Access Control

**Files:**
- `src/hooks/use-permissions.ts` - Permission checking hooks
- `src/components/auth/role-gate.tsx` - Conditional rendering based on roles
- `src/components/auth/protected-route.tsx` - Route protection

**Usage:**

#### Permission Hooks
```typescript
import { usePermissions } from '@/hooks/use-permissions'

function MyComponent() {
  const { 
    canManageUsers,
    canCreateLeads,
    hasPermission,
    canViewReports 
  } = usePermissions()

  if (canManageUsers()) {
    // Show user management UI
  }
}
```

#### Role Gate Component
```typescript
import { RoleGate } from '@/components/auth/role-gate'

function AdminPanel() {
  return (
    <RoleGate 
      allowedRoles={['owner', 'operations_manager']}
      fallback={<div>Access denied</div>}
    >
      <AdminContent />
    </RoleGate>
  )
}
```

#### Protected Routes
```typescript
import { ProtectedRoute } from '@/components/auth/protected-route'

function AdminPage() {
  return (
    <ProtectedRoute
      requiredRoles={['owner']}
      redirectTo="/dashboard"
    >
      <AdminPageContent />
    </ProtectedRoute>
  )
}
```

### 4. Multi-Tenant API Client

**File:** `src/lib/api-client.ts`

**Features:**
- Automatic organization context
- Type-safe database operations
- Multi-tenant data isolation

**Usage:**
```typescript
import { createApiClient } from '@/lib/api-client'

// Create client with organization context
const api = createApiClient(organizationId)

// Use CRUD operations
const users = await api.users.list({ role: 'estimator' })
const user = await api.users.get(userId)
await api.users.update(userId, { status: 'active' })

// Generic table operations
const contacts = await api.table('contacts').list()
await api.table('leads').create({ name: 'New Lead', ... })
```

### 5. Authentication Pages

**Files:**
- `src/app/(auth)/login/page.tsx` - Login form
- `src/app/(auth)/signup/page.tsx` - Registration form
- `src/app/(auth)/verify-email/page.tsx` - Email verification
- `src/app/(auth)/layout.tsx` - Auth pages layout

### 6. Server-Side Helpers

**File:** `src/lib/auth-helpers.ts`

**Functions:**
- `getCurrentUser()` - Get authenticated user in server context
- `requireAuth()` - Require authentication (throws if not)
- `requireRole()` - Require specific role
- `hasPermission()` - Check permissions server-side

**Usage:**
```typescript
// In API routes or server components
import { getCurrentUser, requireRole } from '@/lib/auth-helpers'

// Get current user (returns null if not authenticated)
const user = await getCurrentUser()

// Require authentication (throws error if not authenticated)
const user = await requireAuth()

// Require specific role
const ownerUser = await requireRole('owner')
```

## Database Schema

### Required Tables

The system expects these database tables to exist:

1. **organizations** - Multi-tenant foundation
2. **users** - User profiles with organization context
3. **user_organization_roles** - Many-to-many user-organization relationships
4. **role_permissions** - Role-based permission definitions
5. **user_sessions** - Session tracking (optional)

### Key Relationships

- Users belong to an organization (current context)
- Users can have roles in multiple organizations
- Permissions are defined per role
- All data is organization-scoped

## Environment Variables

Create a `.env.local` file with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Integration Steps

### 1. Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials
3. Run database migrations from `database/migrations/`

### 2. Authentication Flow

1. Users visit login page at `/auth/login`
2. After authentication, redirected to `/dashboard`
3. Middleware handles session management automatically
4. Organization context is set from user's current organization

### 3. Adding New Protected Pages

```typescript
// For role-specific pages
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function MyPage() {
  return (
    <ProtectedRoute requiredRoles={['owner', 'manager']}>
      <MyPageContent />
    </ProtectedRoute>
  )
}
```

### 4. Adding New API Routes

```typescript
// src/app/api/my-endpoint/route.ts
import { requireAuth } from '@/lib/auth-helpers'
import { createRouteClient } from '@/lib/supabase/server'

export async function GET() {
  // Require authentication
  const user = await requireAuth()
  
  // Access database with organization context
  const supabase = createRouteClient()
  const { data } = await supabase
    .from('my_table')
    .select('*')
    .eq('organization_id', user.organization_id)
  
  return NextResponse.json({ data })
}
```

### 5. Component Integration

```typescript
'use client'

import { useAuth } from '@/contexts/auth-context'
import { RoleGate } from '@/components/auth/role-gate'

function MyComponent() {
  const { user, loading, hasPermission } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please log in</div>

  return (
    <div>
      <h1>Welcome, {user.first_name}!</h1>
      
      <RoleGate allowedRoles={['owner']}>
        <button>Admin Only Button</button>
      </RoleGate>
      
      {hasPermission('users', 'create') && (
        <button>Create User</button>
      )}
    </div>
  )
}
```

## User Roles & Permissions

### Role Hierarchy

1. **Owner** - Full system access, organization management
2. **Operations Manager** - User management, operations oversight  
3. **Sales Manager** - Sales team and lead management
4. **Estimating Manager** - Estimate and pricing management
5. **Estimator** - Create and manage assigned estimates
6. **Field Management** - Job updates and field operations

### Permission Examples

```typescript
// Permission checks
const canManageUsers = hasRole(['owner', 'operations_manager'])
const canCreateEstimates = hasRole(['owner', 'estimating_manager', 'estimator'])
const canViewAllData = hasRole(['owner', 'operations_manager'])

// Specific permission checks
const canDeleteLeads = hasPermission('leads', 'delete')
const canUpdateJobs = hasPermission('jobs', 'update')
```

## Organization Switching

Users can belong to multiple organizations with different roles:

```typescript
// Switch organization without re-login
await switchOrganization(newOrganizationId)

// Organization context automatically updates
// All subsequent API calls use new organization context
```

## Security Features

1. **Row Level Security** - Database-level tenant isolation
2. **JWT-based authentication** - Secure session management
3. **Role-based permissions** - Granular access control
4. **Organization context** - Multi-tenant data isolation
5. **Session tracking** - Login monitoring and analytics
6. **Middleware protection** - Automatic route protection

## Common Patterns

### Conditional UI Based on Roles

```typescript
import { RoleGate } from '@/components/auth/role-gate'

function Dashboard() {
  return (
    <div>
      <RoleGate allowedRoles={['owner', 'operations_manager']}>
        <AdminSection />
      </RoleGate>
      
      <RoleGate allowedRoles={['sales_manager', 'estimator']}>
        <SalesSection />
      </RoleGate>
      
      <RoleGate allowedRoles={['field_management']}>
        <FieldSection />
      </RoleGate>
    </div>
  )
}
```

### API Data Fetching

```typescript
// Client-side data fetching
import { useApiClient } from '@/lib/api-client'

function UsersList() {
  const api = useApiClient()
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    api.users.list().then(setUsers)
  }, [])
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  )
}
```

### Server-Side Data Fetching

```typescript
// In server components or API routes
import { getCurrentUser } from '@/lib/auth-helpers'
import { createServerClient } from '@/lib/supabase/server'

export async function getServerSideProps() {
  const user = await getCurrentUser()
  
  if (!user) {
    return { redirect: { destination: '/auth/login' } }
  }
  
  const supabase = createServerClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', user.organization_id)
  
  return { props: { contacts } }
}
```

## Troubleshooting

### Common Issues

1. **Environment Variables** - Ensure all Supabase credentials are set
2. **Database Schema** - Run all migration files in order
3. **Cookie Issues** - Check domain settings in production
4. **Role Permissions** - Verify role_permissions table is populated

### Debug Mode

Add debug logging to see authentication flow:

```typescript
// In auth context
console.log('Auth state:', { user, loading, organizations })

// In API routes
console.log('Current user:', await getCurrentUser())
```

This authentication system provides a complete foundation for your multi-tenant CRM with role-based access control, organization switching, and secure data isolation.