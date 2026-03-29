'use client';

import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-rose-50',
      icon: 'text-rose-500',
      button: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      button: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      button: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
    }
  };

  const currentColors = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
            <div className="p-8 flex flex-col items-center text-center">
              <div className={`w-20 h-20 ${currentColors.bg} ${currentColors.icon} rounded-3xl flex items-center justify-center mb-6`}>
                {type === 'danger' ? <Trash2 size={40} /> : <AlertTriangle size={40} />}
              </div>
              
              <h3 className="text-2xl font-bold font-headline text-on-surface mb-2">
                {title}
              </h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">
                {message}
              </p>

              <div className="flex gap-4 w-full mt-10">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-4 rounded-2xl text-white font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-95 ${currentColors.button}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-surface-container-low rounded-full transition-all text-outline"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
