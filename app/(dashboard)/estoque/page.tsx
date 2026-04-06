'use client';

import React, { useState, useEffect, useCallback } from 'react';
import InventoryView from '@/components/InventoryView';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { logAction } from '@/lib/auditLogService';

const COLORS_ARRAY = ['bg-emerald-500', 'bg-indigo-500', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'];

export default function InventoryPage() {
  const { user } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name')
        .range(0, 9999);
      
      if (error) throw error;
      if (data) {
        setItems(data.map(i => ({
          ...i,
          color: COLORS_ARRAY[Math.floor(Math.random() * COLORS_ARRAY.length)]
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar itens de estoque:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSaveItem = async (data: any) => {
    if (!supabase || !user) return;
    try {
      const itemData = {
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        min_quantity: data.min_quantity,
        unit: data.unit,
        category: data.category,
        expiry_date: data.expiry_date || null,
        unit_cost: data.unit_cost || 0,
        batch: data.batch || null,
        manufacturer: data.manufacturer || null,
        updated_at: new Date().toISOString()
      };

      if (data.id) {
        const { error } = await supabase.from('inventory_items').update(itemData).eq('id', data.id);
        if (error) throw error;
        
        await logAction({ 
          action: 'UPDATE', 
          entityType: 'INVENTORY', 
          userId: user.id,
          details: { summary: `Produto atualizado: ${data.name}`, id: data.id } 
        });
      } else {
        const { data: newItem, error } = await supabase
          .from('inventory_items')
          .insert([{ ...itemData, created_by: user.id }])
          .select()
          .single();
        if (error) throw error;
        
        if (newItem) {
          await logAction({ 
            action: 'CREATE', 
            entityType: 'INVENTORY', 
            userId: user.id,
            details: { summary: `Novo produto cadastrado: ${data.name}`, id: newItem.id } 
          });
        }
      }
      
      await fetchItems();
    } catch (error: any) {
      console.error('Erro ao salvar item de estoque:', error);
      throw error;
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!supabase || !user) return;
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;

      await logAction({ 
        action: 'DELETE', 
        entityType: 'INVENTORY', 
        userId: user.id,
        details: { summary: `Produto excluído: ${id}`, id } 
      });
      
      await fetchItems();
    } catch (error) {
      console.error('Erro ao excluir item de estoque:', error);
      alert('Erro ao excluir produto.');
    }
  };

  const handleAddTransaction = async (data: any) => {
    if (!supabase || !user) return;
    try {
      const item = items.find(i => i.id === data.item_id);
      if (!item) throw new Error('Item não encontrado.');

      let financialId: string | null = null;
      let newQty = Number(item.quantity) || 0;
      let newAvgCost = Number(item.unit_cost || 0);

      const Q_curr = Number(item.quantity) || 0;
      const C_curr = Number(item.unit_cost || 0);
      const Q_trans = Number(data.quantity) || 0;
      const C_trans = Number(data.unit_price || 0);

      if (data.category === 'PURCHASE') {
        newAvgCost = (Q_curr + Q_trans) > 0 ? ((Q_curr * C_curr) + (Q_trans * C_trans)) / (Q_curr + Q_trans) : C_trans;
        newQty = Q_curr + Q_trans;

        if (C_trans > 0) {
          const { data: finData, error: financialError } = await (supabase as any)
            .from('financial_transactions')
            .insert([{
              type: 'EXPENSE',
              description: `Compra: ${item.name} (${Q_trans} ${item.unit})`,
              amount: Q_trans * C_trans,
              category: 'Materiais',
              date: new Date().toISOString().split('T')[0],
              created_by: user.id
            }])
            .select()
            .single();
          
          if (finData) financialId = finData.id;
        }
      } 
      else if (data.category === 'USAGE') {
        newQty = Math.max(0, Q_curr - Q_trans);
      } 
      else if (data.category === 'ADJUST') {
        newQty = data.type === 'IN' ? Q_curr + Q_trans : Math.max(0, Q_curr - Q_trans);
      }

      const { error: tError } = await (supabase as any).from('inventory_transactions').insert([{
        item_id: data.item_id,
        type: data.type,
        category: data.category,
        quantity: Q_trans,
        unit_price: data.category === 'PURCHASE' ? C_trans : 0,
        notes: data.notes || null,
        financial_id: financialId,
        created_by: user.id
      }]);
      if (tError) throw tError;

      const { error: updateError } = await supabase.from('inventory_items').update({ 
        quantity: newQty, 
        unit_cost: newAvgCost,
        updated_at: new Date().toISOString() 
      }).eq('id', item.id);
      
      if (updateError) throw updateError;

      await logAction({ 
        action: 'CREATE', 
        entityType: 'INVENTORY', 
        userId: user.id,
        details: { summary: `Movimentação de estoque: ${data.type} em ${item.name}`, quantity: Q_trans } 
      });

      await fetchItems();
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      throw error;
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!supabase || !user) return;
    try {
      const { data: transaction, error: tError } = await (supabase as any)
        .from('inventory_transactions')
        .select('*')
        .eq('id', transactionId)
        .single();
      
      if (tError || !transaction) throw new Error('Transação não encontrada.');

      const item = items.find(i => i.id === transaction.item_id);
      if (!item) throw new Error('Item de estoque não encontrado.');

      let newQty = Number(item.quantity);
      let newAvgCost = Number(item.unit_cost || 0);

      const Q_curr = Number(item.quantity);
      const C_curr = Number(item.unit_cost || 0);
      const Q_trans = Number(transaction.quantity);
      const C_trans = Number(transaction.unit_price || 0);

      if (transaction.type === 'IN') {
        const Q_old = Q_curr - Q_trans;
        newAvgCost = Q_old > 0 ? ((Q_curr * C_curr) - (Q_trans * C_trans)) / Q_old : 0;
        newQty = Math.max(0, Q_old);

        if (transaction.financial_id) {
          await (supabase as any).from('financial_transactions').delete().eq('id', transaction.financial_id);
        }
      } else {
        newQty = Q_curr + Q_trans;
      }

      await (supabase as any)
        .from('inventory_transactions')
        .update({ is_reversed: true, reversed_at: new Date().toISOString() })
        .eq('id', transactionId);
      
      await supabase.from('inventory_items').update({ 
        quantity: newQty, 
        unit_cost: Math.max(0, newAvgCost),
        updated_at: new Date().toISOString() 
      }).eq('id', item.id);

      await logAction({ 
        action: 'DELETE', 
        entityType: 'INVENTORY', 
        userId: user.id,
        details: { summary: `Estorno de movimentação: ${transactionId}`, id: transactionId } 
      });
      
      await fetchItems(); 
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      alert('Erro ao excluir movimentação.');
    }
  };

  const handleFetchHistory = async (itemId: string) => {
    if (!supabase) return [];
    try {
      const { data, error } = await (supabase as any)
        .from('inventory_transactions')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <InventoryView 
      user={user}
      items={items}
      onSaveItem={handleSaveItem}
      onDeleteItem={handleDeleteItem}
      onAddTransaction={handleAddTransaction}
      onDeleteTransaction={handleDeleteTransaction}
      onFetchHistory={handleFetchHistory}
    />
  );
}
