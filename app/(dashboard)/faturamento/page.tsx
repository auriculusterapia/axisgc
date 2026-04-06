'use client';

import React, { useState, useEffect, useCallback } from 'react';
import BillingView from '@/components/BillingView';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { BillingItem, BillingBatch, Insurer, InsurancePlan, InsurancePrice, MedicalSupply } from '@/types/billing';

export default function BillingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  const [batches, setBatches] = useState<BillingBatch[]>([]);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [prices, setPrices] = useState<InsurancePrice[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [medicalSupplies, setMedicalSupplies] = useState<MedicalSupply[]>([]);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      // 1. Fetch Billing Items with relations
      const { data: itemsData, error: itemsError } = await (supabase as any)
        .from('billing_items')
        .select(`
          *,
          patient:patients(name),
          professional:profiles(name),
          plan:insurance_plans(name),
          procedure:procedures(name, code)
        `)
        .order('service_date', { ascending: false })
        .range(0, 9999);

      if (itemsError) throw itemsError;

      // 2. Fetch Batches
      const { data: batchesData, error: batchesError } = await (supabase as any)
        .from('billing_batches')
        .select('*, insurer:insurers(name)')
        .order('competence', { ascending: false });

      if (batchesError) throw batchesError;

      // 3. Fetch Insurers, Plans & Procedures
      const [
        { data: insurersData, error: insurersError },
        { data: plansData, error: plansError },
        { data: proceduresData, error: proceduresError },
        { data: suppliesData, error: suppliesError }
      ] = await Promise.all([
        (supabase as any).from('insurers').select('*').order('name'),
        (supabase as any).from('insurance_plans').select('*, insurer:insurers(name)').order('name'),
        (supabase as any).from('procedures').select('*').order('name').range(0, 9999),
        (supabase as any).from('medical_supplies').select('*').order('name').range(0, 9999)
      ]);

      if (insurersError) throw insurersError;
      if (plansError) throw plansError;
      if (proceduresError) throw proceduresError;
      if (suppliesError) throw suppliesError;

      // 4. Fetch Prices
      const { data: pricesData, error: pricesError } = await (supabase as any)
        .from('insurance_prices')
        .select(`
          *,
          procedure:procedures(name, code)
        `)
        .range(0, 9999);

      if (pricesError) throw pricesError;

      setBillingItems(itemsData || []);
      setBatches(batchesData || []);
      setInsurers(insurersData || []);
      setPlans(plansData || []);
      setProcedures(proceduresData || []);
      setMedicalSupplies(suppliesData || []);
      setPrices(pricesData || []);

    } catch (error) {
      console.error('Erro ao buscar dados de faturamento:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && billingItems.length === 0 && insurers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BillingView 
      user={user!}
      billingItems={billingItems}
      batches={batches}
      insurers={insurers}
      plans={plans}
      prices={prices}
      procedures={procedures}
      medicalSupplies={medicalSupplies}
      loading={loading}
      onRefresh={fetchData}
    />
  );
}
