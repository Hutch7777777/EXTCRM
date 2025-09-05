export type UserRole = 
  | 'owner'
  | 'operations_manager'
  | 'sales_manager'
  | 'estimating_manager'
  | 'estimator'
  | 'field_management';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOrganizationRole {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization: Organization;
  user: User;
}

export interface AuthUser extends User {
  organizations: UserOrganizationRole[];
  current_organization?: Organization;
  current_role?: UserRole;
}

export const ROLE_PERMISSIONS = {
  owner: [
    'manage_organization',
    'manage_users', 
    'view_all_data',
    'manage_settings',
    'view_reports',
    'manage_estimates',
    'manage_jobs',
    'manage_leads',
    'manage_contacts'
  ],
  operations_manager: [
    'view_all_data',
    'manage_jobs',
    'manage_leads', 
    'manage_contacts',
    'view_reports',
    'manage_field_management'
  ],
  sales_manager: [
    'manage_leads',
    'manage_contacts',
    'view_sales_data',
    'manage_estimates'
  ],
  estimating_manager: [
    'manage_estimates',
    'view_estimate_data',
    'manage_jobs'
  ],
  estimator: [
    'create_estimates',
    'view_estimate_data',
    'view_jobs'
  ],
  field_management: [
    'view_assigned_jobs',
    'update_job_status',
    'upload_photos',
    'manage_time_tracking'
  ]
} as const;

export type Permission = typeof ROLE_PERMISSIONS[UserRole][number];