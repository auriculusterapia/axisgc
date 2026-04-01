'use client';

import React from 'react';
import SettingsView from '@/components/SettingsView';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <SettingsView 
      user={user} 
      onLogout={handleLogout}
    />
  );
}
