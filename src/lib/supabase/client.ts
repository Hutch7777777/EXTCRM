import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Client-side Supabase client for use in React components
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Singleton client for client-side use
export const supabase = createClient()

export default supabase