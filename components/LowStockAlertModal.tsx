'use client';

import React from 'react';
import { AlertTriangle, Package, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LowStockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToInventory: () => void;
  lowStockItems: any[];
}

export default function LowStockAlertModal({ isOpen, onClose, onNavigateToInventory, lowStockItems }: LowStockAlertModalProps) {
  if (!isOpen || lowStockItems.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
          className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="bg-rose-500 p-8 text-white flex flex-col items-center justify-center relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-bold font-headline text-center">Atenção ao Estoque</h3>
            <p className="text-white/80 text-sm mt-2 text-center font-medium">
              Você possui {lowStockItems.length} {lowStockItems.length === 1 ? 'item' : 'itens'} no estoque atingindo a quantidade mínima.
            </p>
          </div>

          <div className="p-6 max-h-[40vh] overflow-y-auto">
            <ul className="space-y-3">
              {lowStockItems.map(item => (
                <li key={item.id} className="flex items-center justify-between p-4 bg-surface-container-low rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${item.color || 'bg-rose-400'}`}>
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600 text-lg leading-none">{item.quantity}</p>
                    <p className="text-[10px] text-outline uppercase font-bold tracking-wider mr-1">Resta(m)</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 border-t border-outline-variant/10 bg-surface flex gap-3">
             <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
             >
               Ignorar
             </button>
             <button 
              onClick={() => {
                onNavigateToInventory();
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               Ir para o Estoque <ArrowRight size={18} />
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
