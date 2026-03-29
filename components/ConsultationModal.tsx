'use client';

import React, { useState, useEffect } from 'react';
import { X, Clock, Play, Square, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  patient: any;
  activeConsultation?: any;
  editingConsultation?: any;
}

type ConsultationStatus = 'idle' | 'running' | 'finished';

export default function ConsultationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  patient,
  activeConsultation,
  editingConsultation
}: ConsultationModalProps) {
  const [status, setStatus] = useState<ConsultationStatus>(() => {
    if (editingConsultation) return 'finished';
    if (activeConsultation) return 'running';
    return 'idle';
  });

  const [startTime, setStartTime] = useState(editingConsultation?.startTime || activeConsultation?.startTime || null);
  const [endTime, setEndTime] = useState(editingConsultation?.endTime || '');
  const [notes, setNotes] = useState(editingConsultation?.notes || activeConsultation?.notes || '');
  const [type, setType] = useState(editingConsultation?.type || activeConsultation?.type || 'Auriculoterapia');
  
  const [elapsedTime, setElapsedTime] = useState(() => {
    if (editingConsultation && editingConsultation.startTime && editingConsultation.endTime) {
      const start = new Date(editingConsultation.startTime).getTime();
      const end = new Date(editingConsultation.endTime).getTime();
      const diff = Math.floor((end - start) / 1000);
      return isNaN(diff) ? 0 : diff;
    }
    if (activeConsultation && activeConsultation.startTime) {
      const start = new Date(activeConsultation.startTime).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((now - start) / 1000);
      return isNaN(diff) ? 0 : diff;
    }
    return 0;
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'running' && isOpen) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, isOpen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    const now = new Date().toISOString();
    setStartTime(now);
    setStatus('running');
    setElapsedTime(0);
  };

  const handleFinish = () => {
    const now = new Date().toISOString();
    setEndTime(now);
    setStatus('finished');
  };

  const handleSave = () => {
    // Se ainda estiver rodando (caso improvável pelo fluxo da UI), marcamos o fim agora ao salvar
    const finalEndTime = endTime || new Date().toISOString();
    
    onSave({
      startTime: startTime || new Date().toISOString(),
      endTime: finalEndTime,
      notes,
      type,
      patientId: patient.id,
      id: editingConsultation?.id
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
      <AnimatePresence>
        {isOpen && (
          <>
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
              className="relative bg-white w-full h-full md:h-auto md:max-w-lg rounded-none md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                <div>
                  <h3 className="text-2xl font-bold font-headline text-on-surface">
                    {editingConsultation ? 'Editar Consulta' : status === 'finished' ? 'Consulta Finalizada' : status === 'running' ? 'Consulta em Andamento' : 'Nova Consulta'}
                  </h3>
                  <p className="text-xs font-bold text-outline uppercase tracking-widest mt-1">
                    Paciente: {patient.name}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white rounded-full transition-all shadow-sm"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                {/* Timer Display */}
                <div className={`rounded-[2rem] p-8 flex flex-col items-center justify-center border transition-all duration-500 ${
                  status === 'running' ? 'bg-primary/10 border-primary/20 scale-[1.02]' : 
                  status === 'finished' ? 'bg-emerald-50 border-emerald-100' :
                  'bg-surface-container-low border-outline-variant/10'
                }`}>
                  <div className={`flex items-center gap-3 mb-2 ${status === 'running' ? 'text-primary' : 'text-outline'}`}>
                    <Clock size={20} className={status === 'running' ? 'animate-pulse' : ''} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {status === 'finished' ? 'Duração Final' : 'Tempo Decorrido'}
                    </span>
                  </div>
                  <div className={`text-5xl font-mono font-bold tracking-tighter ${
                    status === 'running' ? 'text-primary' : 
                    status === 'finished' ? 'text-emerald-600' : 
                    'text-outline-variant'
                  }`}>
                    {formatTime(elapsedTime)}
                  </div>
                  
                  {startTime && (
                    <div className="flex gap-4 mt-6">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Início</p>
                        <p className="text-sm font-bold text-on-surface">
                          {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="w-px h-8 bg-outline-variant/30" />
                      {status === 'finished' && (
                        <>
                          <div className="text-center">
                            <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Fim</p>
                            <p className="text-sm font-bold text-on-surface">
                              {new Date(endTime || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div className="w-px h-8 bg-outline-variant/30" />
                        </>
                      )}
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Data</p>
                        <p className="text-sm font-bold text-on-surface">
                          {new Date(startTime).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'idle' && (
                    <p className="text-[10px] text-outline-variant mt-4 font-medium italic">Clique no botão abaixo para iniciar o atendimento.</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-widest">Tipo de Atendimento</label>
                    <select 
                      value={type}
                      onChange={e => setType(e.target.value)}
                      className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none transition-all"
                    >
                      <option value="Auriculoterapia">Auriculoterapia</option>
                      <option value="Acupuntura Sistêmica">Acupuntura Sistêmica</option>
                      <option value="Avaliação Inicial">Avaliação Inicial</option>
                      <option value="Retorno">Retorno</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-widest">Notas da Sessão</label>
                    <textarea 
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full px-5 py-4 bg-surface-container-low rounded-xl border border-outline-variant/10 focus:ring-2 focus:ring-primary/20 outline-none font-medium min-h-[120px] resize-none transition-all"
                      placeholder="Descreva a evolução, pontos utilizados ou observações..."
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 rounded-2xl border border-outline-variant/20 font-bold text-outline hover:bg-surface-container-low transition-all"
                  >
                    Cancelar
                  </button>
                  
                  {status === 'idle' ? (
                    <button 
                      onClick={handleStart}
                      className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={20} /> Iniciar Consulta
                    </button>
                  ) : status === 'running' ? (
                    <button 
                      onClick={handleFinish}
                      className="flex-1 py-4 rounded-2xl bg-amber-500 text-white font-bold shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Square size={20} /> Finalizar Consulta
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSave()}
                      className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={20} /> Salvar e Concluir (OK)
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
