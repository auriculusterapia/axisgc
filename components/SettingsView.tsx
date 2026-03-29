'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Database, 
  CreditCard, 
  ChevronRight,
  LogOut,
  Moon,
  Globe,
  Smartphone,
  X,
  Check,
  Download,
  Upload, 
  Building2, 
  Save,
  Plus,
  Trash2,
  Edit2,
  Stethoscope,
  Users,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, UserRole, ROLE_LABELS, ALL_PERMISSIONS, ROLE_PERMISSIONS } from '@/types/auth';
import ConfirmationModal from './ConfirmationModal';

interface Profile {
  name: string;
  specialty: string;
  license: string;
  email: string;
  avatar: string;
}

interface Clinic {
  name: string;
  address: string;
  phone: string;
}

interface ConsultationType {
  id: string;
  name: string;
  price: number;
}

interface SettingsViewProps {
  user: User;
  onLogout: () => void;
}

export default function SettingsView({ user, onLogout }: SettingsViewProps) {
  const [profile, setProfile] = useState<Profile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auriculocare_profile');
      return saved ? JSON.parse(saved) : {
        name: user.name,
        specialty: 'Acupunturista e Especialista em MTC',
        license: 'CRM-SP 123456',
        email: user.email,
        avatar: user.avatar || 'https://picsum.photos/seed/practitioner/200/200'
      };
    }
    return {
      name: user.name,
      specialty: 'Acupunturista e Especialista em MTC',
      license: 'CRM-SP 123456',
      email: user.email,
      avatar: user.avatar || 'https://picsum.photos/seed/practitioner/200/200'
    };
  });

  const [clinic, setClinic] = useState<Clinic>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auriculocare_clinic');
      return saved ? JSON.parse(saved) : {
        name: 'TCM Wellness Center',
        address: 'Av. Paulista, 1000 - São Paulo, SP',
        phone: '(11) 3222-4444'
      };
    }
    return {
      name: 'TCM Wellness Center',
      address: 'Av. Paulista, 1000 - São Paulo, SP',
      phone: '(11) 3222-4444'
    };
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClinicModalOpen, setIsClinicModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAppearanceModalOpen, setIsAppearanceModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  
  const [auditEnabled, setAuditEnabled] = useState(true);
  const [isAuditingLoading, setIsAuditingLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditState() {
      if (!supabase) return;
      const { data } = await supabase.from('system_settings').select('audit_enabled').eq('id', 1).single();
      if (data) setAuditEnabled(data.audit_enabled ?? true);
      setIsAuditingLoading(false);
    }
    fetchAuditState();
  }, []);

  const handleToggleAudit = async () => {
    if (!supabase || user?.role !== 'ADMIN') return;
    const newState = !auditEnabled;
    setAuditEnabled(newState);
    await supabase.from('system_settings').update({ audit_enabled: newState }).eq('id', 1);
  };
  
  const [consultationTypes, setConsultationTypes] = useState<ConsultationType[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auriculocare_consultation_types');
      return saved ? JSON.parse(saved) : [
        { id: 'initial', name: 'Primeira Consulta', price: 250 },
        { id: 'followup', name: 'Retorno', price: 150 },
        { id: 'emergency', name: 'Emergência', price: 300 }
      ];
    }
    return [
      { id: 'initial', name: 'Primeira Consulta', price: 250 },
      { id: 'followup', name: 'Retorno', price: 150 },
      { id: 'emergency', name: 'Emergência', price: 300 }
    ];
  });

  const [editingService, setEditingService] = useState<ConsultationType | null>(null);
  const [serviceFormData, setServiceFormData] = useState({ name: '', price: 0 });
  const [serviceToDelete, setServiceToDelete] = useState<ConsultationType | null>(null);
  
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('Português (Brasil)');
  const [currency, setCurrency] = useState('BRL (R$)');

  useEffect(() => {
    localStorage.setItem('auriculocare_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('auriculocare_clinic', JSON.stringify(clinic));
  }, [clinic]);

  useEffect(() => {
    localStorage.setItem('auriculocare_consultation_types', JSON.stringify(consultationTypes));
  }, [consultationTypes]);

  const handleExportData = () => {
    const data = {
      profile,
      clinic,
      patients: JSON.parse(localStorage.getItem('auriculocare_patients') || '[]'),
      appointments: JSON.parse(localStorage.getItem('auriculocare_appointments') || '[]'),
      consultations: JSON.parse(localStorage.getItem('auriculocare_consultations') || '[]'),
      evaluations: JSON.parse(localStorage.getItem('auriculocare_evaluations') || '[]'),
      protocols: JSON.parse(localStorage.getItem('auriculocare_protocols') || '[]'),
      consultationTypes: JSON.parse(localStorage.getItem('auriculocare_consultation_types') || '[]'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcm_clinic_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.profile) {
          localStorage.setItem('auriculocare_profile', JSON.stringify(data.profile));
        }
        if (data.clinic) {
          localStorage.setItem('auriculocare_clinic', JSON.stringify(data.clinic));
        }
        if (data.patients) localStorage.setItem('auriculocare_patients', JSON.stringify(data.patients));
        if (data.appointments) localStorage.setItem('auriculocare_appointments', JSON.stringify(data.appointments));
        if (data.consultations) localStorage.setItem('auriculocare_consultations', JSON.stringify(data.consultations));
        if (data.evaluations) localStorage.setItem('auriculocare_evaluations', JSON.stringify(data.evaluations));
        if (data.protocols) localStorage.setItem('auriculocare_protocols', JSON.stringify(data.protocols));
        if (data.consultationTypes) localStorage.setItem('auriculocare_consultation_types', JSON.stringify(data.consultationTypes));

        alert('Dados importados com sucesso! A página será recarregada.');
        window.location.reload();
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Erro ao importar dados. Verifique se o arquivo é um backup válido.');
      }
    };
    reader.readAsText(file);
  };

  const sections = [
    {
      title: 'Clínica e Serviços',
      items: [
        { 
          icon: Building2, 
          label: 'Dados da Clínica', 
          description: 'Nome da clínica, endereço e telefone comercial.', 
          color: 'text-emerald-500', 
          bg: 'bg-emerald-50',
          onClick: () => setIsClinicModalOpen(true)
        },
        { 
          icon: Stethoscope, 
          label: 'Tipos de Consulta', 
          description: 'Gerencie os tipos de atendimento e seus valores.', 
          color: 'text-indigo-500', 
          bg: 'bg-indigo-50',
          onClick: () => setIsServicesModalOpen(true)
        },
      ]
    },
    {
      title: 'Conta e Segurança',
      items: [
        { 
          icon: UserIcon, 
          label: 'Informações Pessoais', 
          description: 'Nome, e-mail, foto de perfil e especialidades.', 
          color: 'text-blue-500', 
          bg: 'bg-blue-50',
          onClick: () => setIsProfileModalOpen(true)
        },
        { 
          icon: Shield, 
          label: 'Segurança e Senha', 
          description: 'Autenticação em duas etapas e histórico de login.', 
          color: 'text-rose-500', 
          bg: 'bg-rose-50',
          onClick: () => setIsSecurityModalOpen(true)
        },
      ]
    },
    {
      title: 'Preferências do App',
      items: [
        { 
          icon: Bell, 
          label: 'Notificações', 
          description: notifications ? 'Ativadas' : 'Desativadas', 
          color: 'text-amber-500', 
          bg: 'bg-amber-50',
          onClick: () => setNotifications(!notifications)
        },
        { 
          icon: Moon, 
          label: 'Aparência', 
          description: `Tema atual: ${theme === 'light' ? 'Claro' : 'Escuro'}`, 
          color: 'text-indigo-500', 
          bg: 'bg-indigo-50',
          onClick: () => setIsAppearanceModalOpen(true)
        },
        { 
          icon: Globe, 
          label: 'Idioma e Região', 
          description: `${language} • ${currency}`, 
          color: 'text-cyan-500', 
          bg: 'bg-cyan-50',
          onClick: () => setIsLanguageModalOpen(true)
        },
      ]
    },
    {
      title: 'Dados e Integrações',
      items: [
        { 
          icon: Database, 
          label: 'Backup e Exportação', 
          description: 'Exportar dados de pacientes e histórico clínico.', 
          color: 'text-purple-500', 
          bg: 'bg-purple-50',
          onClick: handleExportData
        },
        { 
          icon: Upload, 
          label: 'Importar Dados', 
          description: 'Restaurar backup de pacientes e configurações.', 
          color: 'text-blue-500', 
          bg: 'bg-blue-50',
          onClick: () => setIsImportModalOpen(true)
        },
        { 
          icon: Smartphone, 
          label: 'Dispositivos Conectados', 
          description: 'Gerencie sessões ativas em outros aparelhos.', 
          color: 'text-slate-500', 
          bg: 'bg-slate-50',
          onClick: () => setIsDevicesModalOpen(true)
        },
      ]
    }
  ];

  if (user?.role === 'ADMIN') {
    sections.push({
      title: 'Auditoria de Sistema',
      items: [
        { 
          icon: Shield, 
          label: 'Gravação de Logs', 
          description: isAuditingLoading ? 'Carregando...' : (auditEnabled ? 'Ativada (Rastreando)' : 'Desativada (Pausada)'), 
          color: auditEnabled ? 'text-emerald-500' : 'text-rose-500', 
          bg: auditEnabled ? 'bg-emerald-50' : 'bg-rose-50',
          onClick: handleToggleAudit
        }
      ]
    });
  }

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full max-w-5xl mx-auto relative">
      {/* Header */}
      <section>
        <h2 className="text-4xl font-bold font-headline text-on-surface">Configurações</h2>
        <p className="text-on-surface-variant text-lg mt-2 font-medium">Personalize sua experiência no Axis GC.</p>
      </section>

      {/* Profile Quick View */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-outline-variant/10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-secondary-container relative">
            <Image 
              src={profile.avatar} 
              alt="Practitioner" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">{profile.name}</h3>
            <p className="text-on-surface-variant text-sm font-medium">{profile.specialty}</p>
            <div className="flex gap-2 mt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-widest">Plano Pro Ativo</span>
              <span className="px-3 py-1 bg-surface-container-high text-outline text-[10px] font-bold rounded-lg uppercase tracking-widest">{profile.license}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="px-6 py-3 rounded-xl border border-outline-variant/30 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-all"
        >
          Editar Perfil
        </button>
      </section>

      {/* Settings Sections */}
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.title} className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline ml-4">{section.title}</h3>
            <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-outline-variant/10">
              {section.items.map((item, i) => (
                <button 
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between p-8 hover:bg-surface-container-low transition-all text-left ${i !== section.items.length - 1 ? 'border-b border-outline-variant/5' : ''}`}
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center`}>
                      <item.icon size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface">{item.label}</p>
                      <p className="text-sm text-on-surface-variant font-medium">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-outline" size={20} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <section className="pt-10 border-t border-outline-variant/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 p-6 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-all"
        >
          <LogOut size={20} /> Sair da Conta
        </button>
        <p className="text-center text-[10px] text-outline mt-6 uppercase tracking-widest font-bold">Axis GC v2.4.0 • Made with ❤️ for Practitioners</p>
      </section>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Editar Perfil</h3>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Especialidade</label>
                  <input 
                    type="text" 
                    value={profile.specialty}
                    onChange={e => setProfile({...profile, specialty: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Registro Profissional (CRM/CRP)</label>
                  <input 
                    type="text" 
                    value={profile.license}
                    onChange={e => setProfile({...profile, license: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
                <button 
                  onClick={() => setIsProfileModalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clinic Modal */}
      <AnimatePresence>
        {isClinicModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClinicModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Dados da Clínica</h3>
                <button onClick={() => setIsClinicModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Nome da Clínica</label>
                  <input 
                    type="text" 
                    value={clinic.name}
                    onChange={e => setClinic({...clinic, name: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Endereço</label>
                  <input 
                    type="text" 
                    value={clinic.address}
                    onChange={e => setClinic({...clinic, address: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Telefone Comercial</label>
                  <input 
                    type="text" 
                    value={clinic.phone}
                    onChange={e => setClinic({...clinic, phone: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
                <button 
                  onClick={() => setIsClinicModalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} /> Salvar Dados
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security Modal */}
      <AnimatePresence>
        {isSecurityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSecurityModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Segurança</h3>
                <button onClick={() => setIsSecurityModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Senha Atual</label>
                  <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Confirmar Nova Senha</label>
                  <input type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium" />
                </div>
                <button 
                  onClick={() => setIsSecurityModalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-rose-500 text-white font-bold shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Shield size={20} /> Atualizar Senha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Appearance Modal */}
      <AnimatePresence>
        {isAppearanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAppearanceModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Aparência</h3>
                <button onClick={() => setIsAppearanceModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Globe size={24} />
                    </div>
                    <span className="font-bold">Tema Claro</span>
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-outline-variant'}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center">
                      <Moon size={24} />
                    </div>
                    <span className="font-bold">Tema Escuro</span>
                  </button>
                </div>
                <button 
                  onClick={() => setIsAppearanceModalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Aplicar Preferências
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Modal */}
      <AnimatePresence>
        {isLanguageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLanguageModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Idioma e Região</h3>
                <button onClick={() => setIsLanguageModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Idioma do Sistema</label>
                  <select 
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none"
                  >
                    <option value="Português (Brasil)">Português (Brasil)</option>
                    <option value="English (US)">English (US)</option>
                    <option value="Español">Español</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Moeda</label>
                  <select 
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none"
                  >
                    <option value="BRL (R$)">BRL (R$)</option>
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                  </select>
                </div>
                <button 
                  onClick={() => setIsLanguageModalOpen(false)}
                  className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Salvar Preferências
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Devices Modal */}
      <AnimatePresence>
        {isDevicesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDevicesModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Dispositivos Conectados</h3>
                <button onClick={() => setIsDevicesModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-4">
                {[
                  { device: 'MacBook Pro 14"', location: 'São Paulo, Brasil', status: 'Sessão Atual', icon: Smartphone, color: 'text-primary' },
                  { device: 'iPhone 15 Pro', location: 'São Paulo, Brasil', status: 'Ativo há 2 horas', icon: Smartphone, color: 'text-outline' },
                  { device: 'iPad Air', location: 'Rio de Janeiro, Brasil', status: 'Ativo há 3 dias', icon: Smartphone, color: 'text-outline' },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-low border border-outline-variant/5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center ${session.color}`}>
                        <session.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{session.device}</p>
                        <p className="text-[10px] text-outline uppercase tracking-widest">{session.location} • {session.status}</p>
                      </div>
                    </div>
                    {i !== 0 && (
                      <button className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Revogar</button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setIsDevicesModalOpen(false)}
                  className="w-full mt-4 py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Services Modal */}
      <AnimatePresence>
        {isServicesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsServicesModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Tipos de Consulta e Valores</h3>
                <button onClick={() => setIsServicesModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                {/* Add/Edit Form */}
                <div className="bg-surface-container-low p-6 rounded-[2rem] space-y-4">
                  <h4 className="text-sm font-bold text-outline uppercase tracking-widest">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-outline uppercase tracking-widest ml-2">Nome do Serviço</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Primeira Consulta"
                        value={serviceFormData.name}
                        onChange={e => setServiceFormData({...serviceFormData, name: e.target.value})}
                        className="w-full px-5 py-3 bg-white rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-outline uppercase tracking-widest ml-2">Valor (R$)</label>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        value={serviceFormData.price}
                        onChange={e => setServiceFormData({...serviceFormData, price: Number(e.target.value)})}
                        className="w-full px-5 py-3 bg-white rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        if (!serviceFormData.name) return;
                        if (editingService) {
                          setConsultationTypes(consultationTypes.map(t => t.id === editingService.id ? { ...t, ...serviceFormData } : t));
                          setEditingService(null);
                        } else {
                          const newType: ConsultationType = {
                            id: `type-${Date.now()}`,
                            ...serviceFormData
                          };
                          setConsultationTypes([...consultationTypes, newType]);
                        }
                        setServiceFormData({ name: '', price: 0 });
                      }}
                      className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      {editingService ? <Check size={18} /> : <Plus size={18} />}
                      {editingService ? 'Atualizar' : 'Adicionar'}
                    </button>
                    {editingService && (
                      <button 
                        onClick={() => {
                          setEditingService(null);
                          setServiceFormData({ name: '', price: 0 });
                        }}
                        className="px-6 py-3 rounded-xl bg-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-highest transition-all"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-outline uppercase tracking-widest ml-2">Serviços Cadastrados</h4>
                  <div className="space-y-3">
                    {consultationTypes.map((type) => (
                      <div key={type.id} className="flex items-center justify-between p-5 bg-white border border-outline-variant/10 rounded-2xl hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            <Stethoscope size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{type.name}</p>
                            <p className="text-sm text-primary font-black">R$ {type.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingService(type);
                              setServiceFormData({ name: type.name, price: type.price });
                            }}
                            className="p-2 text-outline hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setServiceToDelete(type);
                            }}
                            className="p-2 text-outline hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsImportModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">Importar Dados</h3>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 hover:bg-surface-container-low rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="p-10 border-2 border-dashed border-outline-variant/30 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/50 transition-all group relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">Selecione o arquivo de backup</p>
                    <p className="text-sm text-on-surface-variant font-medium mt-1">Apenas arquivos .json exportados pelo Axis GC.</p>
                  </div>
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                
                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                  <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-2">Aviso Importante</p>
                  <p className="text-sm text-amber-700 font-medium">A importação irá substituir todos os dados atuais (pacientes, consultas, protocolos e perfil). Recomendamos fazer um backup antes de prosseguir.</p>
                </div>

                <button 
                  onClick={() => setIsImportModalOpen(false)}
                  className="w-full py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={() => {
          if (serviceToDelete) {
            setConsultationTypes(consultationTypes.filter(t => t.id !== serviceToDelete.id));
            setServiceToDelete(null);
          }
        }}
        title="Excluir Serviço"
        message={`Tem certeza que deseja excluir o serviço "${serviceToDelete?.name}"?`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
}
