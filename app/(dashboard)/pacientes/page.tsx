'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PatientsView from '@/components/PatientsView';
import PatientModal from '@/components/PatientModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/auditLogService';
import { useRouter } from 'next/navigation';

export default function PatientsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<any>(null);

  const fetchPatients = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*, patient_packages(status)')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setPatients(data.map(p => ({
          ...p,
          maritalStatus: p.marital_status || 'Solteiro(a)',
          avatar: p.avatar_url || '',
          lastVisit: p.last_visit || 'N/A',
          hasActivePackage: Array.isArray(p.patient_packages) && p.patient_packages.some((pkg: any) => pkg.status === 'active')
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSavePatient = async (data: any) => {
    if (!supabase || !user) return;

    try {
      const patientData = {
        name: data.name,
        age: parseInt(data.age) || 0,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        marital_status: data.maritalStatus,
        profession: data.profession,
        status: data.status,
        avatar_url: null // Mantendo a decisão técnica de remover avatares para performance
      };

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tempo limite excedido')), 15000);
      });

      if (editingPatient) {
        const updateCall = supabase
          .from('patients')
          .update({ ...patientData, updated_at: new Date().toISOString() })
          .eq('id', editingPatient.id);

        const { error } = await Promise.race([updateCall, timeoutPromise]) as any;
        if (error) throw error;

        await logAction({
          action: 'UPDATE',
          entityType: 'PATIENTS',
          userId: user.id,
          details: { summary: `Paciente atualizado: ${data.name}`, id: editingPatient.id }
        });
      } else {
        const insertCall = supabase
          .from('patients')
          .insert([{ ...patientData, created_by: user.id }])
          .select()
          .single();

        const { data: newPatient, error } = await Promise.race([insertCall, timeoutPromise]) as any;
        if (error) throw error;

        await logAction({
          action: 'CREATE',
          entityType: 'PATIENTS',
          userId: user.id,
          details: { summary: `Novo paciente cadastrado: ${data.name}`, id: newPatient.id }
        });
      }
      
      await fetchPatients();
      setIsPatientModalOpen(false);
      setEditingPatient(null);
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error);
      alert(error.message || 'Erro ao salvar paciente. Verifique sua conexão.');
    }
  };

  const handleDeletePatient = async () => {
    if (!supabase || !patientToDelete || !user) return;
    try {
      const { error } = await supabase.from('patients').delete().eq('id', patientToDelete.id);
      if (error) throw error;

      await logAction({ 
        action: 'DELETE', 
        entityType: 'PATIENTS', 
        userId: user.id,
        details: { summary: `Paciente excluído: ${patientToDelete.name}`, id: patientToDelete.id } 
      });
      
      await fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Não foi possível excluir o paciente. Verifique se há histórico clínico travado.');
    } finally {
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
    }
  };

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      <PatientsView 
        user={user}
        patients={patients}
        setPatients={setPatients}
        onNewAppointment={() => router.push('/agenda')}
        onOpenEvaluations={(id) => router.push(`/avaliacoes?patientId=${id}`)}
        onOpenDetail={(p) => router.push(`/pacientes/${p.id}`)}
        onOpenPatientModal={(p) => {
          setEditingPatient(p || null);
          setIsPatientModalOpen(true);
        }}
        onDeletePatient={async (id) => {
          const p = patients.find(p => p.id === id);
          if (p) {
            setPatientToDelete(p);
            setIsDeleteModalOpen(true);
          }
        }}
      />

      <PatientModal 
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePatient}
        editingPatient={editingPatient}
      />

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleDeletePatient}
        title="Excluir Paciente"
        message={`Tem certeza que deseja excluir o paciente ${patientToDelete?.name}? Todos os registros clínicos associados serão removidos permanentemente.`}
        confirmText="Excluir"
        type="danger"
      />
    </>
  );
}
