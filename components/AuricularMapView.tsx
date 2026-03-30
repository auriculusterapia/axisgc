'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Search, 
  Maximize2, 
  RotateCcw, 
  Circle, 
  X, 
  Leaf, 
  Moon, 
  Zap, 
  Apple, 
  Save,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EAR_POINTS = [
  { id: 'shen-men', name: 'Shen Men (Spirit Gate)', category: 'RELAXAMENTO / ESTRESSE', top: '22%', left: '45%', color: 'bg-primary' },
  { id: 'sympathetic', name: 'Sympathetic', category: 'SISTEMA NERVOSO', top: '42%', left: '55%', color: 'bg-primary' },
  { id: 'kidney', name: 'Kidney', category: 'METABOLISMO / VITALIDADE', top: '28%', left: '38%', color: 'bg-secondary' },
  { id: 'liver', name: 'Liver', category: 'DETOX / FÍGADO', top: '65%', left: '62%', color: 'bg-primary' },
];

import { User } from '@/types/auth';

export default function AuricularMapView({ user }: { user?: User | null }) {
  const [selectedPoints, setSelectedPoints] = useState<string[]>(['shen-men', 'sympathetic', 'kidney']);

  const togglePoint = (id: string) => {
    setSelectedPoints(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const canDelete = user?.permissions.includes('auricular:delete') || user?.role === 'ADMIN';

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Panel: Interactive Map */}
      <section className="flex-1 p-10 overflow-y-auto bg-surface relative">
        <div className="mb-10 flex justify-between items-end">
          <div>
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-headline text-4xl font-extrabold text-on-surface mb-3"
            >
              Mapeamento Auricular
            </motion.h3>
            <p className="text-on-surface-variant max-w-lg leading-relaxed font-medium">
              Selecione os pontos diretamente no modelo anatômico de alta fidelidade ou use os atalhos de protocolo para preencher automaticamente os locais de tratamento.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-on-surface-variant text-sm font-bold shadow-sm hover:bg-surface-container-high transition-all">
              <Maximize2 size={16} /> Zoom
            </button>
            {canDelete && (
              <button 
                onClick={() => setSelectedPoints([])}
                className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white text-on-surface-variant text-sm font-bold shadow-sm hover:bg-surface-container-high transition-all"
              >
                <RotateCcw size={16} /> Redefinir
              </button>
            )}
          </div>
        </div>

        <div className="relative rounded-[3rem] bg-gradient-to-br from-secondary-container/20 to-surface-container-low aspect-[4/3] flex items-center justify-center overflow-hidden border border-outline-variant/10 shadow-inner">
          {/* Anatomical Map Container */}
          <div className="relative w-[550px] h-[650px] flex items-center justify-center">
            <Image 
              src="https://picsum.photos/seed/ear/800/1000" 
              alt="Anatomical Ear" 
              fill
              className="object-contain mix-blend-multiply opacity-40 pointer-events-none grayscale"
              referrerPolicy="no-referrer"
            />
            {/* Real Ear Illustration Placeholder - In a real app we'd use a specific SVG or high-res PNG */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-80 h-[450px] bg-secondary-container/30 rounded-full blur-3xl"></div>
            </div>

            {/* Interactive Points */}
            {EAR_POINTS.map((point) => {
              const isActive = selectedPoints.includes(point.id);
              return (
                <button 
                  key={point.id}
                  onClick={() => togglePoint(point.id)}
                  style={{ top: point.top, left: point.left }}
                  className="absolute group z-20"
                >
                  <motion.span 
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                    className={cn(
                      "block w-5 h-5 rounded-full shadow-lg transition-all duration-300",
                      isActive 
                        ? `${point.color} shadow-${point.color}/40 scale-125 ring-4 ring-white` 
                        : "bg-white/80 hover:bg-primary/50 ring-2 ring-outline-variant/20"
                    )}
                  />
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-xl pointer-events-none z-30">
                    <p className="font-bold">{point.name}</p>
                    <p className="text-[8px] opacity-70 uppercase mt-0.5">{point.category}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-8 left-8">
            <div className="glass-panel p-5 rounded-[2rem] flex flex-col gap-4 shadow-xl border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-primary shadow-lg shadow-primary/20"></div>
                <span className="text-xs font-bold text-on-surface">Estímulo Ativo</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-secondary-fixed-dim shadow-lg shadow-secondary/20"></div>
                <span className="text-xs font-bold text-on-surface">Zona de Diagnóstico</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Sidebar: Session Protocols */}
      <aside className="w-[400px] bg-surface-container-low p-10 flex flex-col gap-10 overflow-y-auto border-l border-outline-variant/10">
        <div>
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline font-bold text-xl text-on-surface">Sessão Ativa</h4>
            <span className="text-[10px] font-bold px-3 py-1.5 bg-primary text-white rounded-full tracking-widest">
              {selectedPoints.length} PONTOS SELECIONADOS
            </span>
          </div>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {selectedPoints.length === 0 ? (
                <p className="text-sm text-on-surface-variant italic text-center py-10">Nenhum ponto selecionado</p>
              ) : (
                selectedPoints.map((id) => {
                  const point = EAR_POINTS.find(p => p.id === id);
                  if (!point) return null;
                  return (
                    <motion.div 
                      key={id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white p-5 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all border border-outline-variant/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${point.color}`}></div>
                        <div>
                          <p className="text-sm font-bold text-on-surface">{point.name}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase font-extrabold tracking-tighter mt-0.5">{point.category}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => togglePoint(id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <h4 className="font-headline font-bold text-xl text-on-surface mb-6">Protocolos Rápidos</h4>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Ansiedade', icon: Leaf, color: 'bg-secondary-container/30', textColor: 'text-on-secondary-container' },
              { label: 'Insônia', icon: Moon, color: 'bg-primary-fixed/30', textColor: 'text-primary' },
              { label: 'Dor Crônica', icon: Zap, color: 'bg-surface-container-high', textColor: 'text-on-surface' },
              { label: 'Detox', icon: Apple, color: 'bg-surface-container-high', textColor: 'text-on-surface' },
            ].map((item) => (
              <button 
                key={item.label}
                className={`${item.color} hover:brightness-95 p-5 rounded-[2rem] text-left transition-all group relative overflow-hidden`}
              >
                <item.icon className={`${item.textColor} mb-3 group-hover:scale-110 transition-transform`} size={24} />
                <p className={`text-xs font-extrabold ${item.textColor} uppercase tracking-widest`}>{item.label}</p>
                <p className={`text-[10px] ${item.textColor} opacity-60 mt-1`}>Protocolo Sugerido</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-10 flex flex-col gap-4">
          <button className="w-full bg-primary hover:bg-primary-container text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20">
            <Save size={20} /> Confirmar Pontos da Sessão
          </button>
          {canDelete && (
            <button 
              onClick={() => setSelectedPoints([])}
              className="w-full bg-white text-on-surface-variant py-4 rounded-2xl font-bold text-sm hover:bg-surface-container-high transition-all border border-outline-variant/10"
            >
              Descartar e Redefinir
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
