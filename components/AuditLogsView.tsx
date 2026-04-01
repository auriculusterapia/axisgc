'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Shield, RefreshCw, Trash2, Calendar, User as UserIcon, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/auth';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

interface AuditLogsViewProps {
  user?: User | null;
}

export default function AuditLogsView({ user }: AuditLogsViewProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const fetchLogs = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filterType !== 'ALL') {
        query = query.eq('entity_type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data as any);
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterType]);

  const handleClearLogs = async () => {
    if (!supabase || user?.role !== 'ADMIN') return;
    const confirm = window.confirm('Tem certeza que deseja apagar permanentemente todos os logs? Esta ação não pode ser desfeita.');
    if (!confirm) return;

    try {
      const { error } = await supabase.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      fetchLogs();
    } catch (err) {
      console.error('Erro ao limpar logs:', err);
      alert('Erro ao limpar logs.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Usuario', 'Email', 'Acao', 'Modulo', 'Detalhes'];
    
    const csvRows = filteredLogs.map(log => {
      const detailsStr = typeof log.details === 'object' ? JSON.stringify(log.details).replace(/"/g, '""') : String(log.details || '').replace(/"/g, '""');
      return [
        log.id,
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.profiles?.name || 'Sistema / Anon',
        log.profiles?.email || 'N/A',
        getActionLabel(log.action),
        log.entity_type,
        detailsStr
      ].map(value => `"${value}"`).join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `auditoria_axisgc_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE': return 'text-rose-600 bg-rose-50';
      case 'CREATE': return 'text-emerald-600 bg-emerald-50';
      case 'UPDATE': return 'text-blue-600 bg-blue-50';
      case 'LOGIN': return 'text-purple-600 bg-purple-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'DELETE': return 'Exclusão';
      case 'CREATE': return 'Criação';
      case 'UPDATE': return 'Atualização';
      case 'LOGIN': return 'Acesso';
      default: return action;
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchStr = searchTerm.toLowerCase();
    const userName = log.profiles?.name?.toLowerCase() || '';
    const detailsStr = JSON.stringify(log.details).toLowerCase();
    
    return userName.includes(searchStr) || detailsStr.includes(searchStr);
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-headline">Acesso Negado</h2>
          <p className="text-on-surface-variant font-medium mt-2">Apenas administradores podem visualizar os logs de auditoria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 space-y-8 relative max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold font-headline text-on-surface">Auditoria de Sistema</h2>
          <p className="text-on-surface-variant text-lg mt-2 font-medium">Histórico de ações críticas e rastreamento de dados.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs}
            className="px-6 py-3 rounded-2xl bg-surface-container-low text-on-surface font-bold hover:bg-surface-container transition-colors flex items-center gap-3"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
          
          <button 
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors flex items-center gap-3 border border-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} /> Exportar CSV
          </button>
          
          <button 
            onClick={handleClearLogs}
            className="px-6 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors flex items-center gap-3 border border-rose-100"
          >
            <Trash2 size={20} /> Limpar Todos
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-primary/5 border border-outline-variant/10 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por usuário ou detalhes..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-container-low rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="flex bg-surface-container-low p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {['ALL', 'FINANCIAL', 'PATIENTS', 'INVENTORY', 'AUTH'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${filterType === type ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {type === 'ALL' ? 'Todos' : type}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-outline-variant/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/20 text-outline text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Módulo</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-outline font-medium">
                    <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
                    Carregando logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-outline font-medium">Nenhum log encontrado.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={log.id} 
                    className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface font-medium text-sm">
                        <Calendar size={16} className="text-outline" />
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold text-on-surface">
                        <UserIcon size={16} className="text-primary" />
                        {log.profiles?.name || 'Sistema / Anon'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-on-surface-variant text-sm">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      <div className="max-w-xs md:max-w-md break-words font-medium">
                        {log.details?.summary || JSON.stringify(log.details)}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
