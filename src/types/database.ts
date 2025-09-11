// Re-export from generated Supabase types
export type { 
  Database, 
  Json, 
  UserRole, 
  UserStatus, 
  OrganizationStatus 
} from './supabase'

// Additional types that extend the database types
export type ContactType = 
  | 'customer'
  | 'prospect'
  | 'vendor'
  | 'crew'
  | 'internal'

export type LeadSource = 
  | 'referral'
  | 'website'
  | 'advertising'
  | 'social_media'
  | 'direct_mail'
  | 'cold_call'
  | 'trade_show'
  | 'repeat_customer'
  | 'other'

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'proposal_sent'
  | 'follow_up'
  | 'won'
  | 'lost'
  | 'inactive'

export type Division = 
  | 'multi_family'
  | 'single_family'
  | 'repair_remodel'

export type JobStatus = 
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type EstimateStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type CommunicationType = 
  | 'email'
  | 'phone'
  | 'text'
  | 'meeting'
  | 'note'
  | 'file'