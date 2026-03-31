import { supabase, getSupabase } from './supabase';

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT';
export type AuditEntityType = 'AUTH' | 'PATIENTS' | 'FINANCIAL' | 'INVENTORY' | 'APPOINTMENTS' | 'EVALUATIONS' | 'SYSTEM';

interface LogActionParams {
  action: AuditAction;
  entityType: AuditEntityType;
  details?: Record<string, any>;
  entityId?: string;
  userId?: string;
}

// Em memória cache para não consultar o DB a cada ação
let auditEnabledCache: boolean | null = null;
let lastCacheUpdate: number = 0;
const CACHE_TTL = 60000; // 1 minuto

export async function isAuditEnabled(): Promise<boolean> {
  const now = Date.now();
  if (auditEnabledCache !== null && (now - lastCacheUpdate < CACHE_TTL)) {
    return auditEnabledCache;
  }

  try {
    if (!supabase) return false;
    const { data, error } = await supabase
      .from('system_settings')
      .select('audit_enabled')
      .eq('id', 1)
      .single();
    
    if (error || !data) {
      console.error('Erro ao ler configuração de auditoria:', error);
      auditEnabledCache = true; // Fallback par seguro
    } else {
      auditEnabledCache = data.audit_enabled ?? true;
    }
  } catch (err) {
    auditEnabledCache = true;
  }
  
  lastCacheUpdate = now;
  return auditEnabledCache;
}

export async function logAction({ action, entityType, details = {}, entityId, userId }: LogActionParams) {
  try {
    const isEnabled = await isAuditEnabled();
    if (!isEnabled) return;

    // Obtém o cliente atualizado via Proxy ou função (garante que não use instância congelada)
    const client = getSupabase();
    if (!client) return;

    // Se o usuário não foi passado, tenta pegar o atual da sessão
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { user } } = await client.auth.getUser();
      finalUserId = user?.id;
    }

    if (!finalUserId) return;

    // Captura IP (melhores esforços no lado do cliente)
    let ipAddress = 'unknown';
    try {
      const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
      const data = await res.json();
      ipAddress = data.ip;
    } catch (e) {}

    const safeDetails = { ...details };
    if (safeDetails.password) delete safeDetails.password;

    const { error } = await client
      .from('audit_logs')
      .insert({
        user_id: finalUserId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: safeDetails,
        ip_address: ipAddress
      });

    if (error) console.error('[AuditLog] Erro ao salvar log:', error.message);
  } catch (err) {
    console.error('[AuditLog] Erro crítico ao processar log:', err);
  }
}
