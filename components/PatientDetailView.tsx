'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  History as HistoryIcon, 
  Stethoscope, 
  Globe, 
  Zap, 
  Plus, 
  Sparkles, 
  Type, 
  Italic, 
  List as ListIcon, 
  Save as SaveIcon, 
  Download,
  ChevronRight,
  ArrowLeft,
  Edit3,
  Calendar,
  Clock,
  Trash2,
  Printer,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User } from '@/types/auth';

interface PatientDetailViewProps {
  patient: any;
  consultations: any[];
  evaluations: any[];
  onBack: () => void;
  onEditPersonal: (patient: any) => void;
  onStartConsultation: () => void;
  onEditConsultation: (consultation: any) => void;
  onDeleteConsultation: (consultationId: string) => void;
  inventoryItems: any[];
  user?: User | null;
}

export default function PatientDetailView({ 
  patient, 
  consultations, 
  evaluations,
  onBack, 
  onEditPersonal,
  onStartConsultation,
  onEditConsultation,
  onDeleteConsultation,
  inventoryItems,
  user
}: PatientDetailViewProps) {
  const [notes, setNotes] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const canEditPatient = user?.permissions.includes('patients:edit') || user?.role === 'ADMIN';
  const canCreateConsultation = user?.permissions.includes('calendar:create') || user?.role === 'ADMIN';
  const canEditConsultation = user?.permissions.includes('calendar:edit') || user?.role === 'ADMIN';
  const canDeleteConsultation = user?.permissions.includes('calendar:delete') || user?.role === 'ADMIN';

  if (!patient) return null;

  const totalVisits = consultations.length;

  // Get the most recent evaluation
  const latestEvaluation = evaluations.length > 0 
    ? [...evaluations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const handleGenerateReport = () => {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header bg
      doc.setFillColor(31, 41, 55); // text-slate-800
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text('Relatório Clínico - Axis GC', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
      
      // Patient Info Section
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Informações do Paciente', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Campo', 'Informação']],
        body: [
          ['Nome', patient.name],
          ['ID', `#TCM-${patient.id.slice(-4)}`],
          ['Idade', `${patient.age} Anos`],
          ['Profissão', patient.profession],
          ['Status', patient.status === 'Ativo' ? 'Tratamento Ativo' : 'Inativo'],
          ['Última Visita', patient.lastVisit || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 82, 56] },
      });

      // Clinical History Section (Anamnesis)
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.text('Anamnese e Histórico Clínico', 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Categoria', 'Detalhes']],
        body: [
          ['Queixa Principal', latestEvaluation?.mainComplaint || 'N/A'],
          ['Sono', latestEvaluation?.sleep ? `${latestEvaluation.sleep.hours}h, ${latestEvaluation.sleep.restorative ? 'Repousante' : 'Não repousante'}` : 'N/A'],
          ['Apetite/Digestão', latestEvaluation?.appetite ? `Apetite ${latestEvaluation.appetite.level}${latestEvaluation.appetite.fullness ? ', Plenitude' : ''}` : 'N/A'],
          ['Língua', latestEvaluation?.tonguePulse ? `${latestEvaluation.tonguePulse.color}, ${latestEvaluation.tonguePulse.shape}, ${latestEvaluation.tonguePulse.coating}` : 'N/A'],
          ['Pulso', latestEvaluation?.tonguePulse?.pulse || 'N/A'],
          ['Hipótese Diagnóstica', latestEvaluation?.syndromeHypothesis || 'N/A'],
          ['Tratamento Inicial', latestEvaluation?.initialTreatment || 'N/A'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 82, 56] },
      });

      // Evolution Notes Section
      currentY = (doc as any).lastAutoTable.finalY + 15;
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.text('Notas de Evolução Clínica', 14, currentY);
      doc.setFontSize(11);
      const splitNotes = doc.splitTextToSize(notes || 'Nenhuma nota de evolução registrada até o momento.', pageWidth - 28);
      doc.text(splitNotes, 14, currentY + 10);
      
      // Consultation History Section
      currentY = currentY + 15 + (splitNotes.length * 5);
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFontSize(16);
      doc.text('Histórico de Consultas', 14, currentY);
      
      const consultationRows = consultations.map(c => {
        const start = new Date(c.startTime);
        const end = new Date(c.endTime);
        const duration = Math.floor((end.getTime() - start.getTime()) / 60000);
        return [
          start.toLocaleDateString('pt-BR'),
          c.type,
          `${duration} min`,
          c.notes || 'Sem notas'
        ];
      });

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Data', 'Tipo', 'Duração', 'Notas da Sessão']],
        body: consultationRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 82, 56] },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount} - Axis GC - Sistema de Gestão de Clínica`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }

      doc.save(`relatorio_clinico_${patient.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar o relatório. Por favor, tente novamente.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full">
      {/* Patient Header */}
      <section className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="flex gap-8 items-center">
          <button 
            onClick={onBack}
            className="p-3 rounded-2xl bg-surface-container-low text-outline hover:text-primary transition-all no-print"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="w-24 h-24 rounded-[2rem] overflow-hidden bg-secondary-container shadow-xl relative">
            <Image 
              src={patient.avatar || "https://picsum.photos/seed/isabella/200/200"} 
              alt="Patient" 
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold font-headline text-on-surface">{patient.name}</h2>
              <span className={`px-4 py-1 text-[10px] font-bold rounded-lg uppercase tracking-widest ${
                patient.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-container-high text-outline'
              }`}>
                {patient.status === 'Ativo' ? 'Tratamento Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-on-surface-variant text-base mt-1 font-medium">ID: #TCM-{patient.id.slice(-4)} • {patient.age} Anos • {patient.profession}</p>
            <div className="flex gap-6 mt-4">
              <span className="flex items-center gap-2 text-xs font-bold text-primary">
                <HistoryIcon size={14} /> Última Sessão: {patient.lastVisit || 'N/A'}
              </span>
              <span className="flex items-center gap-2 text-xs font-bold text-secondary">
                <Stethoscope size={14} /> {totalVisits} Visitas no Total
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 no-print">
          <button 
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all flex items-center gap-2 disabled:opacity-50"
            title="Exportar Relatório PDF"
          >
            {isGeneratingReport ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            Exportar
          </button>
          {canEditPatient && (
            <button 
              onClick={() => onEditPersonal(patient)}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all flex items-center gap-2"
            >
              <Edit3 size={18} /> Editar Ficha
            </button>
          )}
          {canCreateConsultation && (
            <button 
              onClick={onStartConsultation}
              className="px-8 py-3.5 rounded-2xl text-sm font-bold bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Iniciar Consulta
            </button>
          )}
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Anamnesis */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Queixa Principal e Histórico</h3>
              <button className="p-2 rounded-xl hover:bg-surface-container-low text-outline hover:text-primary transition-all no-print">
                <Edit3 size={18} />
              </button>
            </div>
            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border-l-4 border-primary">
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Razão Principal da Visita</label>
                <p className="text-on-surface font-medium leading-relaxed">
                  {latestEvaluation?.mainComplaint || "Nenhuma avaliação registrada."}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-6 rounded-2xl">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Qualidade do Sono</label>
                  <p className="text-sm font-medium">
                    {latestEvaluation?.sleep ? (
                      `${latestEvaluation.sleep.hours}h, ${latestEvaluation.sleep.restorative ? 'Repousante' : 'Não repousante'}${latestEvaluation.sleep.difficulty ? ', Dificuldade para dormir' : ''}`
                    ) : "N/A"}
                  </p>
                </div>
                <div className="bg-surface-container-low p-6 rounded-2xl">
                  <label className="block text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Digestão/Apetite</label>
                  <p className="text-sm font-medium">
                    {latestEvaluation?.appetite ? (
                      `Apetite ${latestEvaluation.appetite.level}${latestEvaluation.appetite.fullness ? ', Sensação de plenitude' : ''}`
                    ) : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tongue & Pulse */}
          <div className="grid grid-cols-2 gap-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border-l-4 border-secondary-fixed border-t border-r border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Diagnóstico da Língua</h3>
                <div className="flex gap-2 no-print">
                  <button className="p-2 rounded-xl hover:bg-surface-container-low text-outline hover:text-secondary transition-all">
                    <Edit3 size={18} />
                  </button>
                  <Globe className="text-secondary" size={20} />
                </div>
              </div>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Cor e Corpo</p>
                  <div className="flex gap-2.5 flex-wrap">
                    {latestEvaluation?.tonguePulse ? (
                      [latestEvaluation.tonguePulse.color, latestEvaluation.tonguePulse.shape].filter(Boolean).map((tag, i) => (
                        <span key={`${tag}-${i}`} className={`px-4 py-1.5 rounded-xl text-xs font-bold ${i === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-outline italic">N/A</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Saburra</p>
                  <div className="flex gap-2.5 flex-wrap">
                    {latestEvaluation?.tonguePulse ? (
                      [latestEvaluation.tonguePulse.coating, latestEvaluation.tonguePulse.humidity].filter(Boolean).map((tag, i) => (
                        <span key={`${tag}-${i}`} className={`px-4 py-1.5 rounded-xl text-xs font-bold ${i === 0 ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-outline italic">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border-l-4 border-primary-fixed border-t border-r border-b border-outline-variant/10">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-bold uppercase tracking-widest text-outline">Qualidade do Pulso</h3>
                <div className="flex gap-2 no-print">
                  <button className="p-2 rounded-xl hover:bg-surface-container-low text-outline hover:text-primary transition-all">
                    <Edit3 size={18} />
                  </button>
                  <Zap className="text-primary" size={20} />
                </div>
              </div>
              <div className="space-y-6">
                {[
                  { label: 'Pulso', value: latestEvaluation?.tonguePulse?.pulse || 'N/A', color: 'text-primary' },
                  { label: 'Frequência Geral', value: latestEvaluation?.physical?.fc ? `${latestEvaluation.physical.fc} BPM` : 'N/A', color: 'text-on-surface' },
                  { label: 'PA', value: latestEvaluation?.physical?.pa || 'N/A', color: 'text-on-surface' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-surface-container-high last:border-0">
                    <span className="text-xs font-bold text-on-surface-variant">{item.label}</span>
                    <span className={`text-xs font-extrabold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* 5 Elements */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10 overflow-hidden relative">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-10">Equilíbrio dos 5 Elementos</h3>
            <div className="aspect-square w-full max-w-[260px] mx-auto relative rounded-full p-6 bg-surface-container-low/50">
              <svg className="w-full h-full drop-shadow-xl" viewBox="0 0 100 100">
                <polygon fill="none" points="50,5 95,35 78,90 22,90 5,35" stroke="#edeeee" strokeWidth="1" />
                <polygon fill="none" points="50,25 75,42 65,70 35,70 25,42" stroke="#edeeee" strokeWidth="0.5" />
                {latestEvaluation && (
                  <motion.polygon 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    fill="rgba(43, 54, 84, 0.15)" 
                    points="50,15 85,38 70,80 30,65 15,40" 
                    stroke="#2B3654" 
                    strokeWidth="2" 
                  />
                )}
                <circle cx="50" cy="5" fill="#f44336" r="3" />
                <circle cx="95" cy="35" fill="#ffeb3b" r="3" />
                <circle cx="78" cy="90" fill="#9e9e9e" r="3" />
                <circle cx="22" cy="90" fill="#2196f3" r="3" />
                <circle cx="5" cy="35" fill="#4caf50" r="3" />
              </svg>
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-600">FOGO</span>
              <span className="absolute top-1/3 -right-2 translate-y-2 text-[10px] font-bold text-yellow-600">TERRA</span>
              <span className="absolute bottom-4 right-10 text-[10px] font-bold text-gray-500">METAL</span>
              <span className="absolute bottom-4 left-10 text-[10px] font-bold text-blue-600">ÁGUA</span>
              <span className="absolute top-1/3 -left-2 translate-y-2 text-[10px] font-bold text-[#2B3654]">MADEIRA</span>
            </div>
            <div className="mt-10 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-on-surface-variant">Hipótese:</span>
                <span className="text-primary font-extrabold bg-primary/5 px-3 py-1 rounded-lg truncate max-w-[180px]">
                  {latestEvaluation?.syndromeHypothesis || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Protocol */}
          <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-outline-variant/10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-8">Tratamento Inicial</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-primary-fixed/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-extrabold text-primary uppercase tracking-widest">Conduta Sugerida</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">
                    {latestEvaluation?.initialTreatment || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation History */}
      <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-bold font-headline">Histórico de Consultas</h3>
            <p className="text-sm text-on-surface-variant mt-1">Registro detalhado de todos os atendimentos realizados</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-outline">
            <Calendar size={16} /> {totalVisits} Sessões Registradas
          </div>
        </div>

        <div className="space-y-4">
          {consultations.length > 0 ? (
            consultations.map((consultation) => {
              const start = new Date(consultation.startTime);
              const end = new Date(consultation.endTime);
              const duration = Math.floor((end.getTime() - start.getTime()) / 60000);

              return (
                <div key={consultation.id} className="group p-6 bg-surface-container-low rounded-[2rem] border border-outline-variant/5 hover:border-primary/20 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Clock size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest leading-none mb-1">Especialidade</p>
                        <p className="text-sm font-bold text-on-surface">{consultation.type || 'Não informada'}</p>
                        <p className="text-xs text-on-surface-variant font-medium">
                          {start.toLocaleDateString('pt-BR')} • {start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às {end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">Duração</p>
                        <p className="text-sm font-bold text-primary">{duration} min</p>
                      </div>
                      <div className="flex gap-2 transition-opacity no-print">
                        {canEditConsultation && (
                          <button 
                            onClick={() => onEditConsultation(consultation)}
                            className="p-3 rounded-xl bg-white shadow-sm text-outline hover:text-primary transition-all"
                            title="Editar Consulta"
                          >
                            <Edit3 size={18} />
                          </button>
                        )}
                        {canDeleteConsultation && (
                          <button 
                            onClick={() => onDeleteConsultation(consultation.id)}
                            className="p-3 rounded-xl bg-white shadow-sm text-outline hover:text-red-500 transition-all"
                            title="Excluir Consulta"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {consultation.notes && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/10">
                      <p className="text-xs font-bold text-outline uppercase tracking-widest mb-2">Notas da Sessão</p>
                      <p className="text-sm text-on-surface-variant leading-relaxed italic">
                        &quot;{consultation.notes}&quot;
                      </p>
                    </div>
                  )}

                  {consultation.materials_used && consultation.materials_used.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-outline-variant/10">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-2">Materiais Utilizados</p>
                      <div className="flex flex-wrap gap-2">
                        {consultation.materials_used.map((mat: any, idx: number) => {
                          const item = inventoryItems.find(i => i.id === mat.itemId);
                          return (
                            <span key={idx} className="px-3 py-1 bg-surface-container-high rounded-lg text-[10px] font-bold text-on-surface-variant">
                              {item?.name || 'Item desconhecido'} x{mat.quantity}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-surface-container-low rounded-[2rem] border-2 border-dashed border-outline-variant/20">
              <HistoryIcon size={48} className="mx-auto text-outline/20 mb-4" />
              <p className="text-on-surface-variant font-medium">Nenhuma consulta registrada para este paciente.</p>
              {canCreateConsultation && (
                <button 
                  onClick={onStartConsultation}
                  className="mt-4 text-primary font-bold text-sm hover:underline"
                >
                  Iniciar primeira consulta agora
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Notes */}
      <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold font-headline">Notas de Evolução Clínica</h3>
          <div className="flex gap-2 bg-surface-container-low p-1.5 rounded-xl no-print">
            <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg text-outline transition-all"><Type size={18} /></button>
            <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg text-outline transition-all"><Italic size={18} /></button>
            <button className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg text-outline transition-all"><ListIcon size={18} /></button>
          </div>
        </div>
        <div className="relative">
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full min-h-[180px] bg-surface-container-low border-none rounded-[2rem] p-8 text-base text-on-surface focus:ring-2 focus:ring-primary/10 leading-relaxed placeholder:text-on-surface-variant/40" 
            placeholder="Escreva as notas do tratamento aqui..."
          />
          <div className="absolute bottom-6 right-8 flex items-center gap-4 no-print">
            <span className="text-xs text-outline italic font-medium">Salvo automaticamente há 2 minutos</span>
            <button className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-110 transition-all">
              <SaveIcon size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-8 p-6 bg-primary-fixed/10 rounded-2xl border border-primary/10">
          <p className="text-xs text-primary font-bold flex items-center gap-3">
            <Sparkles size={16} /> 
            Sugestão de IA: &quot;Considere adicionar PC6 para o manejo da ansiedade com base no histórico da frequência cardíaca do paciente.&quot;
          </p>
        </div>
      </section>
    </div>
  );
}
