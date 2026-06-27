// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = 'https://bskrrojwkbqhcrxbxnnm.supabase.co';
// const supabaseAnonKey = 'sb_publishable_toT4u9tLw0HjTSbA36RjYA_yUISVOm-';

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// lib/supabase.ts ou similar
const supabaseUrl = `https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);