'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  PackageOpen,
  ArrowDownToLine,
  ArrowUpFromLine,
  MoreVertical,
  X,
  Check,
  Trash2,
  Edit2,
  AlertTriangle,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '@/types/auth';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  category: string;
  color?: string; // Client-only
}

interface InventoryTransaction {
  id?: string;
  item_id: string;
  type: 'IN' | 'OUT';
  quantity: number;
  notes: string;
}

const CATEGORIES = ['Todos', 'Descartáveis', 'Acupuntura', 'Fisioterapia', 'Limpeza', 'Escritório', 'Outros'];
const COLORS = ['bg-emerald-500', 'bg-indigo-500', 'bg-blue-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'];

export default function InventoryView({ 
  user,
  items,
  onSaveItem,
  onDeleteItem,
  onAddTransaction
}: { 
  user?: User | null;
  items: InventoryItem[];
  onSaveItem: (data: any) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onAddTransaction: (data: InventoryTransaction) => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Form State - Item
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    min_quantity: 0,
    unit: 'Unidade',
    category: 'Descartáveis'
  });

  // Form State - Transaction
  const [transactionFormData, setTransactionFormData] = useState({
    item_id: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: 1,
    notes: ''
  });

  const lowStockItems = items.filter(item => item.quantity <= item.min_quantity);

  const handleOpenItemModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setItemFormData({
        name: item.name,
        description: item.description || '',
        quantity: item.quantity,
        min_quantity: item.min_quantity,
        unit: item.unit,
        category: item.category || 'Outros'
      });
    } else {
      setEditingItem(null);
      setItemFormData({
        name: '',
        description: '',
        quantity: 0,
        min_quantity: 5,
        unit: 'Unidade',
        category: 'Descartáveis'
      });
    }
    setIsItemModalOpen(true);
  };

  const handleOpenTransactionModal = (item: InventoryItem, defaultType: 'IN' | 'OUT') => {
    setTransactionFormData({
      item_id: item.id,
      type: defaultType,
      quantity: 1,
      notes: ''
    });
    setIsTransactionModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveItem({
      ...itemFormData,
      id: editingItem?.id
    });
    setIsItemModalOpen(false);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAddTransaction(transactionFormData);
    setIsTransactionModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item? Todo o histórico de entradas e saídas será perdido.')) {
      await onDeleteItem(id);
    }
  };

  const filteredItems = items.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full relative">
      {/* Header */}
      <section className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div>
          <h2 className="text-4xl font-bold font-headline text-on-surface">Controle de Estoque</h2>
          <p className="text-on-surface-variant text-lg mt-2 font-medium">Cadastre produtos e gerencie o fluxo de entrada e saída.</p>
        </div>
        <button 
          onClick={() => handleOpenItemModal()}
          className="px-8 py-4 rounded-2xl text-sm font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
        >
          <Plus size={20} /> Cadastrar Produto
        </button>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Package size={28} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-outline">Total de Itens</p>
              <h3 className="text-3xl font-extrabold text-on-surface font-headline leading-none mt-1">{items.length}</h3>
            </div>
         </div>
         <div className="bg-rose-50 rounded-3xl p-6 border border-rose-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-widest uppercase text-rose-600">Estoque Baixo</p>
              <h3 className="text-3xl font-extrabold text-rose-900 font-headline leading-none mt-1">{lowStockItems.length}</h3>
            </div>
         </div>
      </div>

      {/* Search and Category Filter */}
      <section className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-outline" size={20} />
          <input 
            type="text" 
            placeholder="Buscar item do estoque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white rounded-2xl border border-outline-variant/10 shadow-sm focus:ring-2 focus:ring-primary/10 text-on-surface font-medium"
          />
        </div>
      </section>

      {/* Categories */}
      <section className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-outline border border-outline-variant/10 hover:border-primary/30'}`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Items List */}
      <section className="bg-white rounded-[2.5rem] border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/10">
                <th className="py-5 px-6 font-bold text-xs uppercase tracking-widest text-outline">Item</th>
                <th className="py-5 px-6 font-bold text-xs uppercase tracking-widest text-outline">Categoria</th>
                <th className="py-5 px-6 font-bold text-xs uppercase tracking-widest text-outline text-right">Estoque</th>
                <th className="py-5 px-6 font-bold text-xs uppercase tracking-widest text-outline text-center">Status</th>
                <th className="py-5 px-6 font-bold text-xs uppercase tracking-widest text-outline text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                 <tr>
                    <td colSpan={5} className="py-12 text-center text-outline">Nenhum item encontrado.</td>
                 </tr>
              ) : (
                filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.min_quantity;
                  return (
                    <tr key={item.id} className="border-b border-outline-variant/5 hover:bg-surface-container-low/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${item.color || 'bg-slate-400'}`}>
                            {item.quantity === 0 ? <PackageOpen size={20} /> : <Package size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{item.name}</p>
                            <p className="text-xs text-on-surface-variant">{item.description || 'Sem descrição'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-on-surface-variant">
                        {item.category}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-xl font-bold font-headline">{item.quantity}</span>
                        <span className="text-xs text-outline ml-1">{item.unit}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isLowStock ? (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider">
                             <AlertTriangle size={12} /> {item.quantity === 0 ? 'Sem Estoque' : 'Baixo'}
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                             <Check size={12} /> Ok
                           </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                            onClick={() => handleOpenTransactionModal(item, 'IN')}
                            title="Registrar Entrada"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                           >
                              <ArrowUpFromLine size={16} />
                           </button>
                           <button 
                            onClick={() => handleOpenTransactionModal(item, 'OUT')}
                            title="Registrar Saída"
                            className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                           >
                              <ArrowDownToLine size={16} />
                           </button>
                           <button 
                            onClick={() => handleOpenItemModal(item)}
                            title="Editar Item"
                            className="p-2 rounded-lg bg-surface-container text-on-surface-variant hover:text-primary transition-colors ml-2"
                           >
                              <Edit2 size={16} />
                           </button>
                           <button 
                            onClick={() => handleDelete(item.id)}
                            title="Excluir"
                            className="p-2 rounded-lg bg-surface-container text-outline hover:text-rose-500 transition-colors"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Item Modal */}
      <AnimatePresence>
        {isItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsItemModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
                <h3 className="text-2xl font-bold font-headline text-on-surface">
                  {editingItem ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button 
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-2 hover:bg-surface-container-low rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    value={itemFormData.name}
                    onChange={e => setItemFormData({...itemFormData, name: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder="Ex: Agulha de Acupuntura 0.25x30mm"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-widest">Categoria</label>
                    <select 
                      value={itemFormData.category}
                      onChange={e => setItemFormData({...itemFormData, category: e.target.value})}
                      className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none"
                    >
                      {CATEGORIES.filter(c => c !== 'Todos').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-widest">Unidade Medida</label>
                    <input 
                      required
                      type="text" 
                      value={itemFormData.unit}
                      onChange={e => setItemFormData({...itemFormData, unit: e.target.value})}
                      className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      placeholder="Ex: Unidade, Caixa, Pacote"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!editingItem && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-outline uppercase tracking-widest">Estoque Inicial</label>
                      <input 
                        required
                        type="number" 
                        min="0"
                        step="0.01"
                        value={itemFormData.quantity}
                        onChange={e => setItemFormData({...itemFormData, quantity: parseFloat(e.target.value)})}
                        className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-rose-500 uppercase tracking-widest">Alerta Estoque Mínimo</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      step="0.01"
                      value={itemFormData.min_quantity}
                      onChange={e => setItemFormData({...itemFormData, min_quantity: parseFloat(e.target.value)})}
                      className="w-full px-5 py-4 bg-rose-50 rounded-xl border border-rose-100 focus:ring-2 focus:ring-rose-200 outline-none font-medium text-rose-900"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Descrição / Observações</label>
                  <textarea 
                    rows={2}
                    value={itemFormData.description}
                    onChange={e => setItemFormData({...itemFormData, description: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                    placeholder="Opcional..."
                  />
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} /> Salvar Produto
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {isTransactionModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTransactionModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className={`p-8 border-b ${transactionFormData.type === 'IN' ? 'bg-emerald-500' : 'bg-amber-500'} text-white flex justify-between items-center`}>
                <h3 className="text-xl font-bold font-headline flex items-center gap-2">
                  {transactionFormData.type === 'IN' ? <ArrowUpFromLine /> : <ArrowDownToLine />}
                  {transactionFormData.type === 'IN' ? 'Registrar Entrada' : 'Registrar Saída'}
                </h3>
                <button 
                  onClick={() => setIsTransactionModalOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSaveTransaction} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Quantidade</label>
                  <input 
                    required
                    type="number" 
                    min="0.01"
                    step="0.01"
                    value={transactionFormData.quantity}
                    onChange={e => setTransactionFormData({...transactionFormData, quantity: parseFloat(e.target.value)})}
                    className="w-full px-5 py-4 text-center text-3xl bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  />
                  <p className="text-center text-xs text-outline font-medium mt-1">
                    Estoque Atual: {items.find(i => i.id === transactionFormData.item_id)?.quantity}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-widest">Motivo / Observação</label>
                  <input 
                    type="text" 
                    value={transactionFormData.notes}
                    onChange={e => setTransactionFormData({...transactionFormData, notes: e.target.value})}
                    className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                    placeholder={transactionFormData.type === 'IN' ? "Ex: Compra Nota #123" : "Ex: Uso no consultório"}
                  />
                </div>

                <button 
                  type="submit"
                  className={`w-full py-4 rounded-2xl text-white font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${transactionFormData.type === 'IN' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'}`}
                >
                  <Check size={20} /> Confirmar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
