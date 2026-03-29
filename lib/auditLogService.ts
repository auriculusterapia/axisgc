import { supabase } from './supabase';

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
  if (!supabase) return;

  try {
    const isEnabled = await isAuditEnabled();
    if (!isEnabled) {
      console.log(`[AuditLog] Ação ${action} em ${entityType} ignorada (Auditoria desativada).`);
      return;
    }

    // Se o usuário não foi passado, tenta pegar o atual
    let finalUserId = userId;
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      finalUserId = user?.id;
    }

    if (!finalUserId) {
      return; // Não registra logs de ações não autenticadas
    }

    // Limpa detalhes de senhas ou dados muito sensíveis (boas práticas)
    const safeDetails = { ...details };
    if (safeDetails.password) delete safeDetails.password;

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: finalUserId,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: safeDetails,
      });

    if (error) {
      console.error('[AuditLog] Erro ao salvar log de auditoria:', error);
    }
  } catch (err) {
    console.error('[AuditLog] Erro crítico ao processar log:', err);
  }
}
