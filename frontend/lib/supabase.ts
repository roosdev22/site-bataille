// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bskrrojwkbqhcrxbxnnm.supabase.co';
const supabaseAnonKey = 'sb_publishable_toT4u9tLw0HjTSbA36RjYA_yUISVOm-';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);