import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
    return null;
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// Sempre usa getSupabase() para garantir que o cliente seja inicializado no contexto correto
// O singleton no módulo pode ser null se for avaliado no servidor (SSR)
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

// Helper para uso seguro em handlers do cliente
export const getClientSupabase = () => {
  if (typeof window === 'undefined') return null;
  return getSupabase();
};
