'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FinancialView from '@/components/FinancialView';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/auditLogService';

export default function FinancialPage() {
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const mapAppointmentFromDB = (app: any) => ({
    id: app.id,
    patientId: app.patient_id,
    patientName: app.patient_name,
    date: app.date,
    time: app.time,
    duration: app.duration,
    type: app.type,
    status: app.status,
    price: Number(app.price || 0),
    paymentStatus: app.payment_status,
    notes: app.notes,
    packageId: app.package_id,
    isPackageSession: app.is_package_session
  });

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('appointments')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      if (data) setAppointments((data as any[]).map(mapAppointmentFromDB));
    } catch (error) {
      console.error('Erro ao buscar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmPayment = async (id: string) => {
    if (!supabase || !user) return;
    try {
      const app = appointments.find(a => a.id === id);
      if (!app) return;

      const { error } = await supabase
        .from('appointments')
        .update({ 
          payment_status: 'pago',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      await logAction({ 
        action: 'UPDATE', 
        entityType: 'APPOINTMENTS', 
        userId: user.id,
        details: { summary: `Pagamento confirmado para: ${app.patient_name || 'Paciente'}`, id } 
      });
      
      await fetchData();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert('Erro ao confirmar pagamento.');
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!supabase || !user) return;
    try {
      const appToDel = appointments.find(a => a.id === id);
      if (!appToDel) return;

      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;

      await logAction({ 
        action: 'DELETE', 
        entityType: 'APPOINTMENTS', 
        userId: user.id,
        details: { summary: `Consulta/Transação excluída: ${appToDel.patient_name || 'Paciente'}`, id } 
      });
      
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir transação.');
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <FinancialView 
      user={user}
      appointments={appointments}
      onConfirmPayment={handleConfirmPayment}
      onDeleteTransaction={handleDeleteAppointment}
    />
  );
}
