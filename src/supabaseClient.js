import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://csrtjzdvtuddkehzpexd.supabase.co'
const supabaseAnonKey = 'sb_publishable_NKRjOpQdmbbO4BXAbfxqGg_1swsZQY7'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
