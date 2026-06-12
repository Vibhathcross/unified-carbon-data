import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isPlaceholder = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder-project')

if (isPlaceholder) {
  console.warn(
    'Supabase environment variables are missing or set to placeholders! ' +
    'Running client in mock/placeholder mode.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)
