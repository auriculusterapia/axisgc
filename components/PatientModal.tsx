'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getInitials } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  address: string;
  maritalStatus: string;
  profession: string;
  status: 'Ativo' | 'Inativo';
  lastVisit: string;
  avatar: string;
}

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patientData: any) => void;
  editingPatient: Patient | null;
}

export default function PatientModal({ isOpen, onClose, onSave, editingPatient }: PatientModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Feminino',
    phone: '',
    email: '',
    address: '',
    maritalStatus: 'Solteiro(a)',
    profession: '',
    status: 'Ativo' as 'Ativo' | 'Inativo',
    avatar: ''
  });

  useEffect(() => {
    if (isOpen) {
      console.log('PatientModal opened. editingPatient:', editingPatient);
      setFormData({
        name: editingPatient?.name || '',
        age: editingPatient?.age?.toString() || '',
        gender: editingPatient?.gender || 'Feminino',
        phone: editingPatient?.phone || '',
        email: editingPatient?.email || '',
        address: editingPatient?.address || '',
        maritalStatus: editingPatient?.maritalStatus || 'Solteiro(a)',
        profession: editingPatient?.profession || '',
        status: editingPatient?.status || 'Ativo' as 'Ativo' | 'Inativo',
        avatar: editingPatient?.avatar || ''
      });
    }
  }, [isOpen, editingPatient]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const age = parseInt(formData.age);
    if (isNaN(age)) {
      alert('Por favor, insira uma idade válida.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        age: age,
      });
    } catch (error: any) {
      console.error('PatientModal: Error saving patient:', error);
      alert(error.message || 'Erro ao salvar paciente.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full h-full md:h-auto md:max-w-2xl rounded-none md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="text-2xl font-bold font-headline text-on-surface">
                {editingPatient ? 'Editar Paciente' : 'Novo Cadastro'}
              </h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-container-low rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center justify-center pb-6">
                <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
                  {getInitials(formData.name)}
                </div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest mt-4">Avatar Automático</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-widest">Idade</label>
                    <input 
                      required
                      type="number" 
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                      className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-widest">Gênero</label>
                    <select 
                      value={formData.gender}
                      onChange={e => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none"
                    >
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Telefone</label>
                  <input 
                    required
                    type="text" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">E-mail</label>
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase tracking-widest">Endereço Completo</label>
                <input 
                  required
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  placeholder="Ex: Rua das Flores, 123 - São Paulo, SP"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Estado Civil</label>
                  <select 
                    value={formData.maritalStatus}
                    onChange={e => setFormData({...formData, maritalStatus: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none"
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                    <option value="União Estável">União Estável</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Profissão</label>
                  <input 
                    required
                    type="text" 
                    value={formData.profession}
                    onChange={e => setFormData({...formData, profession: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder="Ex: Designer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-outline uppercase tracking-widest">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'Ativo' | 'Inativo'})}
                  className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className={`flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check size={20} />
                  )}
                  {isSaving ? 'Salvando...' : (editingPatient ? 'Atualizar Cadastro' : 'Salvar Cadastro')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
