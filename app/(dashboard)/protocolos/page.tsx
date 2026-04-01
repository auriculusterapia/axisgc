'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProtocolsView from '@/components/ProtocolsView';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/auditLogService';

export default function ProtocolsPage() {
  const { user } = useAuth();
  
  const [protocols, setProtocols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('protocols')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        setProtocols(data.map(p => ({
          ...p,
          title: p.name,
          points: p.points || [],
          duration: '20 min',
          usage: 0,
          rating: 5.0,
          color: 'bg-emerald-500' // Pode ser randomizado futuramente
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar protocolos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProtocol = async (data: any) => {
    if (!supabase || !user) return;
    try {
      const protocolData = {
        name: data.title,
        description: data.description,
        points: data.points,
        category: data.category,
        updated_at: new Date().toISOString()
      };

      if (data.id) {
        const { error } = await supabase
          .from('protocols')
          .update(protocolData)
          .eq('id', data.id);
        if (error) throw error;
        
        await logAction({ 
          action: 'UPDATE', 
          entityType: 'SYSTEM', 
          userId: user.id,
          details: { summary: `Protocolo atualizado: ${data.title}`, id: data.id } 
        });
      } else {
        const { data: newProtocol, error } = await supabase
          .from('protocols')
          .insert([{ ...protocolData, created_by: user.id }])
          .select()
          .single();
        if (error) throw error;
        
        if (newProtocol) {
          await logAction({ 
            action: 'CREATE', 
            entityType: 'SYSTEM', 
            userId: user.id,
            details: { summary: `Novo protocolo criado: ${data.title}`, id: newProtocol.id } 
          });
        }
      }
      
      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar protocolo:', error);
      alert('Erro ao salvar protocolo.');
    }
  };

  const handleDeleteProtocol = async (id: string) => {
    if (!supabase || !user) return;
    try {
      const { error } = await supabase.from('protocols').delete().eq('id', id);
      if (error) throw error;
      
      await logAction({ 
        action: 'DELETE', 
        entityType: 'SYSTEM', 
        userId: user.id,
        details: { summary: `Protocolo excluído: ${id}`, id } 
      });
      
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir protocolo:', error);
      alert('Erro ao excluir protocolo.');
    }
  };

  if (loading && protocols.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ProtocolsView 
      user={user}
      protocols={protocols}
      onSaveProtocol={handleSaveProtocol}
      onDeleteProtocol={handleDeleteProtocol}
    />
  );
}
