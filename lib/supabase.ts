import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

let supabaseInstance: SupabaseClient<Database> | null = null;
let lastInitTime = 0;
const REINIT_THRESHOLD = 1000 * 60 * 30; // 30 minutos

export const getSupabase = (forceNew = false) => {
  const now = Date.now();
  
  // Se já temos uma instância e não forçado, e não passou do threshold, retorna a atual
  if (supabaseInstance && !forceNew && (now - lastInitTime < REINIT_THRESHOLD)) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing.');
    return null;
  }

  console.log(forceNew ? 'Forçando reinicialização do cliente Supabase...' : 'Inicializando cliente Supabase...');
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: { 'x-client-info': 'axis-gc-stable' }
    }
  });
  
  lastInitTime = now;
  return supabaseInstance;
};

/**
 * Verifica se a conexão com o banco de dados está ativa realizando uma consulta simples.
 * @returns Promise<boolean>
 */
export const checkConnection = async (): Promise<boolean> => {
  const client = getSupabase();
  if (!client) return false;
  
  try {
    // Tenta uma consulta mínima que não depende de permissões complexas (health check)
    const { error } = await client.from('patients').select('id', { count: 'exact', head: true }).limit(1);
    if (error) {
      console.warn('Conexão Supabase instável:', error.message);
      // Se for erro de rede ou timeout, retorna falso
      if (error.message.includes('fetch') || error.message.includes('timeout') || error.message.includes('Network')) {
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Erro fatal ao verificar conexão:', err);
    return false;
  }
};

// Exporta um Proxy para que qualquer módulo que importe 'supabase' sempre use a instância ativa
// Isso resolve o problema de referências "congeladas" em módulos que importam a constante no início
export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) return undefined;
    const value = (client as any)[prop];
    // Se for uma função (como .from() ou .auth.getUser()), garante que o contexto 'this' seja o cliente
    return typeof value === 'function' ? value.bind(client) : value;
  }
}) as SupabaseClient<Database>;

// Helper para uso seguro em handlers do cliente
export const getClientSupabase = () => {
  if (typeof window === 'undefined') return null;
  return getSupabase();
};
