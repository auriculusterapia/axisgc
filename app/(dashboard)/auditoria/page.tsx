'use client';

import React from 'react';
import AuditLogsView from '@/components/AuditLogsView';
import { useAuth } from '@/lib/AuthContext';
import { Shield } from 'lucide-react';

export default function AuditPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-headline">Acesso Negado</h2>
          <p className="text-on-surface-variant font-medium mt-2">Apenas administradores podem visualizar os logs de auditoria.</p>
        </div>
      </div>
    );
  }

  return (
    <AuditLogsView user={user} />
  );
}
