import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Suppress Supabase Realtime connection warnings if realtime is not enabled on project
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some(arg => typeof arg === 'string' && (arg.includes('Supabase Realtime') || arg.includes('Realtime')))) {
      return;
    }
    originalConsoleError(...args);
  };
}

// Lazy initialization to avoid errors if env vars are missing during setup
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Helper to fetch data safely. Even if Supabase isn't configured, 
 * it won't crash the app.
 */
export async function getFromSupabase<T>(table: string) {
  if (!supabase) return { data: null, error: 'Supabase keys not configured' };
  
  const { data, error } = await supabase
    .from(table)
    .select('*');
    
  return { data: data as T[] | null, error };
}

