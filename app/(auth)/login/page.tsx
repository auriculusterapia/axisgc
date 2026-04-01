'use client';

import React, { useEffect } from 'react';
import LoginView from '@/components/LoginView';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Se já estiver logado, redireciona para o novo dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Passamos uma função vazia pois o LoginView já usa o AuthContext internamente
  return <LoginView onLogin={() => {}} />;
}
