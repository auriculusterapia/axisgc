'use client';

import React from 'react';
import UsersManagementView from '@/components/UsersManagementView';
import { useAuth } from '@/lib/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <UsersManagementView user={user} />
  );
}
