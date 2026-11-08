import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { env, isSupabaseConfigured } from '@/lib/env'

// The browser uses Supabase for authentication only. All family and event
// data is read through the Owlert backend, which enforces ownership.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null
