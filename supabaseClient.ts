
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rkajjaxymqdayfcsxkpo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xTDluTIB5CdUm4gAG5N43g_I9oq9O-7';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn("Using hardcoded fallbacks for Supabase. Please set Vercel Environment Variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);



