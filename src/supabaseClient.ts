import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

console.log('=== SUPABASE CLIENT DEBUG ===');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key length:', supabaseAnonKey?.length || 0);
console.log('Supabase Anon Key starts with:', supabaseAnonKey?.substring(0, 10) + '...');
console.log('=== END SUPABASE CLIENT DEBUG ===');

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 