'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReportsView from '@/components/ReportsView';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const { user } = useAuth();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [financialTransactions, setFinancialTransactions] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const [
        { data: patsData },
        { data: appsData },
        { data: finData },
        { data: invData }
      ] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('financial_transactions').select('*'),
        supabase.from('inventory_items').select('*')
      ]);

      if (patsData) setPatients(patsData);
      if (appsData) setAppointments(appsData);
      if (finData) setFinancialTransactions(finData);
      if (invData) setInventoryItems(invData);
    } catch (error) {
      console.error('Erro ao buscar dados para relatórios:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ReportsView 
      user={user}
      patients={patients}
      appointments={appointments}
      financialTransactions={financialTransactions}
      inventoryItems={inventoryItems}
    />
  );
}
