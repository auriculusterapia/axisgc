import { User, UserRole, ADMIN_PERMISSIONS, ROLE_PERMISSIONS } from '@/types/auth';

/**
 * Verifica se um usuário possui uma permissão específica.
 * Admins sempre possuem todas as permissões.
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return user.permissions.includes(permission as any);
}

/**
 * Verifica se um usuário possui pelo menos uma de um conjunto de permissões.
 */
export function hasAnyPermission(user: User | null, permissions: string[]): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  return permissions.some(p => user.permissions.includes(p as any));
}

/**
 * Retorna as permissões padrão para um determinado papel.
 */
export function getDefaultPermissions(role: UserRole): string[] {
  if (role === 'ADMIN') return ADMIN_PERMISSIONS as unknown as string[];
  return (ROLE_PERMISSIONS as any)[role] || [];
}

/**
 * Componente Auxiliar para renderização condicional baseada em permissão.
 * Útil para esconder botões ou seções inteiras da UI.
 */
export function Can({ 
  user, 
  perform, 
  children, 
  fallback = null 
}: { 
  user: User | null, 
  perform: string | string[], 
  children: React.ReactNode,
  fallback?: React.ReactNode
}) {
  const permissions = Array.isArray(perform) ? perform : [perform];
  const allowed = hasAnyPermission(user, permissions);
  
  return allowed ? <>{children}</> : <>{fallback}</>;
}
