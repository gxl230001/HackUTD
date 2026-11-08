// Frontend configuration. Only public values belong here: anything prefixed
// with VITE_ is bundled into the browser. Never put the Supabase service-role
// key or any AI API key in a VITE_ variable.
const trim = (value: string | undefined) => (value ?? '').trim()

export const env = {
  apiBaseUrl: trim(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '') || 'http://localhost:8000',
  supabaseUrl: trim(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: trim(import.meta.env.VITE_SUPABASE_ANON_KEY),
}

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey)
