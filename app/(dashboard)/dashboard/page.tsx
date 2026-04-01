'use client';

import React, { useState, useEffect } from 'react';
import DashboardView from '@/components/DashboardView';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!supabase || !user) return;
      
      try {
        const [
          { data: appointmentsData },
          { data: patientsData },
          { data: evaluationsData }
        ] = await Promise.all([
          supabase.from('appointments').select('*').order('time'),
          supabase.from('patients').select('*'),
          supabase.from('evaluations').select('*')
        ]);

        if (appointmentsData) setAppointments(appointmentsData);
        if (patientsData) setPatients(patientsData);
        if (evaluationsData) setEvaluations(evaluationsData);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <DashboardView 
      user={user}
      appointments={appointments}
      patients={patients}
      evaluations={evaluations}
      onNewAppointment={() => router.push('/agenda')}
      onOpenAgenda={() => router.push('/agenda')}
      onStartConsultation={(id) => router.push(`/pacientes/${id}/consulta`)}
      onViewPatientHistory={(id) => router.push(`/pacientes/${id}`)}
    />
  );
}
