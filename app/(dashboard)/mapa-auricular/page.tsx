'use client';

import React from 'react';
import AuricularMapView from '@/components/AuricularMapView';
import { useAuth } from '@/lib/AuthContext';

export default function AuricularMapPage() {
  const { user } = useAuth();

  return (
    <AuricularMapView 
      user={user}
    />
  );
}
