'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, connectionStatus, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-medium">Carregando Sistema 2.0...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Será redirecionado pelo useEffect
  }

  // Notificação de Offline (Simples)
  const isOffline = connectionStatus === 'offline';

  const viewToPath = (view: string) => {
    const mapping: Record<string, string> = {
      dashboard: '/dashboard',
      patients: '/pacientes',
      evaluations: '/avaliacoes',
      calendar: '/agenda',
      auricular: '/mapa-auricular',
      protocols: '/protocolos',
      financial: '/financeiro',
      billing: '/faturamento',
      inventory: '/estoque',
      users: '/usuarios',
      settings: '/configuracoes',
      reports: '/relatorios',
      audit_logs: '/auditoria'
    };
    return mapping[view] || `/${view}`;
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar 
          activeView="dashboard" 
          user={user}
          setActiveView={(view) => router.push(viewToPath(view))} 
          onLogout={signOut} 
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        <TopBar 
          user={user} 
          onLogout={signOut} 
          connectionStatus={connectionStatus}
        />

        {isOffline && (
          <div className="bg-error-container text-on-error-container px-4 py-2 text-sm flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
            <span className="w-2 h-2 bg-error rounded-full animate-pulse" />
            Conexão instável. Algumas funções podem não estar disponíveis.
          </div>
        )}

        <main className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            {children}
          </div>
        </main>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <BottomNav 
            activeView="dashboard" 
            setActiveView={(view) => router.push(viewToPath(view))} 
            user={user}
          />
        </div>
      </div>
    </div>
  );
}
