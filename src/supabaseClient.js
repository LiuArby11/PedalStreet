import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Palitan ang "export default" ng "export const"
export const supabase = createClient(supabaseUrl, supabaseAnonKey)