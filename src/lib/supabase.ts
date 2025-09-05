// Legacy file - use specific client files instead
// @deprecated - Use @/lib/supabase/client or @/lib/supabase/server

export { supabase as default } from './supabase/client'
export { createClient } from './supabase/client'
export { createServerClient, createRouteClient, createAdminClient } from './supabase/server'

// Re-export database types
export type { Database } from '@/types/database'