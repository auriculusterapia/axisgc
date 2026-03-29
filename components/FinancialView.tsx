'use client';

import React from 'react';
import { 
  Wallet, 
  Hourglass, 
  TrendingUp, 
  ArrowUpRight, 
  Download, 
  MoreVertical,
  ArrowUpRight as ArrowIcon,
  Bell,
  Calendar,
  FileText,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { User as UserType } from '@/types/auth';

export default function FinancialView({ 
  user,
  appointments: initialAppointments,
  onConfirmPayment,
  onDeleteTransaction
}: { 
  user: UserType | null;
  appointments: any[];
  onConfirmPayment?: (id: string) => Promise<void>;
  onDeleteTransaction?: (id: string) => Promise<void>;
}) {
  const [isGeneratingReport, setIsGeneratingReport] = React.useState(false);
  const [appointments, setAppointments] = React.useState<any[]>(initialAppointments);
  const [consultationTypes, setConsultationTypes] = React.useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<string | null>(null);

  const canCreate = user?.permissions.includes('financial:create') || user?.role === 'ADMIN';
  const canReport = user?.permissions.includes('financial:reports') || user?.role === 'ADMIN';
  const canDelete = user?.role === 'ADMIN'; // Only admin can delete financial records for safety

  React.useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  React.useEffect(() => {
    const savedTypes = localStorage.getItem('auriculocare_consultation_types');
    if (savedTypes) {
      setConsultationTypes(JSON.parse(savedTypes));
    }
  }, []);

  const getTypeName = (typeId: string) => {
    const found = consultationTypes.find(t => t.id === typeId || t.name === typeId);
    return found ? found.name : 'Consulta';
  };

  const [timeRange, setTimeRange] = React.useState<'7d' | '15d' | 'mes' | 'semestre' | 'ano'>('semestre');

  const getChartData = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // Filtra e converte dadas dos pagamentos já realizados
    const paidApps = appointments
      .filter(a => a.paymentStatus === 'pago' && typeof a.price === 'number')
      .map(a => {
        // Normaliza a data para suportar horários de início variados no DB
        const d = new Date(a.date + 'T12:00:00Z');
        return { ...a, parsedDate: d };
      });

    let buckets: { label: string, total: number }[] = [];

    if (timeRange === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
        
        const total = paidApps
          .filter(a => a.parsedDate >= dayStart && a.parsedDate <= dayEnd)
          .reduce((sum, a) => sum + (a.price || 0), 0);
        buckets.push({ label, total });
      }
    } else if (timeRange === '15d') {
      for (let i = 4; i >= 0; i--) {
        const bucketEnd = new Date();
        bucketEnd.setDate(today.getDate() - (i * 3));
        const bucketStart = new Date(bucketEnd.getTime());
        bucketStart.setDate(bucketEnd.getDate() - 2);
        bucketStart.setHours(0,0,0,0);
        bucketEnd.setHours(23,59,59,999);
        
        const label = `${bucketStart.getDate().toString().padStart(2,'0')}/${(bucketStart.getMonth()+1).toString().padStart(2,'0')}`;
        const total = paidApps
            .filter(a => a.parsedDate >= bucketStart && a.parsedDate <= bucketEnd)
            .reduce((sum, a) => sum + (a.price || 0), 0);
        buckets.push({ label, total });
      }
    } else if (timeRange === 'mes') {
      for (let i = 3; i >= 0; i--) {
        const bucketEnd = new Date();
        bucketEnd.setDate(today.getDate() - (i * 7));
        const bucketStart = new Date(bucketEnd.getTime());
        bucketStart.setDate(bucketEnd.getDate() - 6);
        bucketStart.setHours(0,0,0,0);
        bucketEnd.setHours(23,59,59,999);
        
        const label = `Sem ${4 - i}`;
        const total = paidApps
            .filter(a => a.parsedDate >= bucketStart && a.parsedDate <= bucketEnd)
            .reduce((sum, a) => sum + (a.price || 0), 0);
        buckets.push({ label, total });
      }
    } else if (timeRange === 'semestre') {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
        
        const total = paidApps
            .filter(a => a.parsedDate.getMonth() === d.getMonth() && a.parsedDate.getFullYear() === d.getFullYear())
            .reduce((sum, a) => sum + (a.price || 0), 0);
        buckets.push({ label, total });
      }
    } else if (timeRange === 'ano') {
      for (let i = 3; i >= 0; i--) {
        const year = today.getFullYear() - i;
        const label = year.toString();
        
        const total = paidApps
            .filter(a => a.parsedDate.getFullYear() === year)
            .reduce((sum, a) => sum + (a.price || 0), 0);
        buckets.push({ label, total });
      }
    }

    const maxTotal = Math.max(...buckets.map(b => b.total), 1); 
    return buckets.map(b => {
        const heightPercent = Math.max((b.total / maxTotal) * 100, 5); 
        
        let formattedValue = '';
        if (b.total >= 1000) {
            formattedValue = `R$ ${(b.total / 1000).toFixed(1)}k`.replace('.0k', 'k');
        } else {
            formattedValue = `R$ ${b.total}`;
        }

        return {
            label: b.label.charAt(0).toUpperCase() + b.label.slice(1), 
            height: b.total === 0 ? '5%' : `${heightPercent}%`, 
            value: b.total > 0 ? formattedValue : '',
            active: b.total === maxTotal && maxTotal > 1
        };
    });
  };

  const handleConfirmAction = async (id: string) => {
    // Otimista
    const updated = appointments.map(app => 
      app.id === id ? { ...app, paymentStatus: 'pago' } : app
    );
    setAppointments(updated);
    // Realiza a chamada no banco
    if (onConfirmPayment) {
      try {
        await onConfirmPayment(id);
      } catch (e) {
        // Reverte em caso de erro
        setAppointments(appointments);
      }
    }
  };

  const handleDeleteTransactionLocal = async () => {
    if (!itemToDelete) return;
    const idToDel = itemToDelete;
    // Otimista
    const updated = appointments.filter(app => app.id !== idToDel);
    setAppointments(updated);
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    // Realiza a chamada no banco
    if (onDeleteTransaction) {
      try {
        await onDeleteTransaction(idToDel);
      } catch (e) {
        // Reverte em caso de erro
        setAppointments(appointments);
      }
    }
  };

  const faturamentoTotal = appointments
    .filter(app => app.paymentStatus === 'pago')
    .reduce((acc, app) => acc + (app.price || 0), 0);

  const pagamentosPendentes = appointments
    .filter(app => app.paymentStatus === 'pendente')
    .reduce((acc, app) => acc + (app.price || 0), 0);

  const sessoesAReceber = appointments
    .filter(app => app.paymentStatus === 'pendente')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const transacoesRecentes = [...appointments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const handleExportFinancialReport = () => {
    setIsGeneratingReport(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(15, 82, 56); // Primary color
      doc.text('Relatório Financeiro - Axis GC', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, 28, { align: 'center' });
      
      // Summary Section
      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text('Resumo Geral', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Indicador', 'Valor']],
        body: [
          ['Faturamento Total', `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Pagamentos Pendentes', `R$ ${pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Crescimento do Mês', '18.4%'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 82, 56] },
      });

      // Recent Transactions Section
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.text('Transações Recentes', 14, currentY);
      
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Paciente', 'Data', 'Serviço', 'Valor', 'Status']],
        body: transacoesRecentes.map(app => [
          app.patientName,
          new Date(app.date).toLocaleDateString('pt-BR'),
          getTypeName(app.type),
          `R$ ${app.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          app.paymentStatus === 'pago' ? 'Pago' : 'Pendente'
        ]),
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

      doc.save(`relatorio_financeiro_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating financial report:', error);
      alert('Erro ao gerar o relatório financeiro.');
    } finally {
      setIsGeneratingReport(false);
    }
  };
  return (
    <div className="p-10 space-y-10 overflow-y-auto h-full">
      <section className="flex flex-col gap-2">
        <h2 className="text-4xl font-headline font-extrabold text-on-surface tracking-tight">Gestão Financeira</h2>
        <p className="text-on-surface-variant/80 font-medium text-lg">Monitore o fluxo de caixa, faturamentos e pendências clínicas.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Faturamento Total', value: `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: '+12.5%', icon: Wallet, color: 'bg-primary-fixed', textColor: 'text-primary' },
          { label: 'Pagamentos Pendentes', value: `R$ ${pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, change: null, icon: Hourglass, color: 'bg-secondary-container', textColor: 'text-secondary' },
          { label: 'Crescimento do Mês', value: '18.4%', change: 'Meta: 92%', icon: TrendingUp, color: 'bg-tertiary-fixed', textColor: 'text-tertiary' },
        ].map((card, i) => (
          <motion.div 
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 ${card.color} ${card.textColor} rounded-2xl shadow-sm`}>
                <card.icon size={24} />
              </div>
              {card.change && (
                <span className="text-xs font-extrabold text-primary px-4 py-1.5 bg-primary/10 rounded-full tracking-widest">{card.change}</span>
              )}
            </div>
            <p className="text-sm font-bold text-outline uppercase tracking-widest mb-2">{card.label}</p>
            <h3 className="text-3xl font-headline font-extrabold text-on-surface">{card.value}</h3>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 bg-white p-10 rounded-[3rem] shadow-sm border border-outline-variant/10 flex flex-col">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h4 className="text-2xl font-headline font-bold text-on-surface">
                {timeRange === '7d' ? 'Faturamento Semanal' : 
                 timeRange === '15d' ? 'Faturamento Quinzenal' : 
                 timeRange === 'mes' ? 'Faturamento Mensal' : 
                 timeRange === 'semestre' ? 'Faturamento Semestral' : 
                 'Faturamento Anual'}
              </h4>
              <p className="text-sm text-outline font-medium mt-1">
                {timeRange === '7d' ? 'Desempenho nos últimos 7 dias' : 
                 timeRange === '15d' ? 'Desempenho nos últimos 15 dias' : 
                 timeRange === 'mes' ? 'Desempenho no mês atual' : 
                 timeRange === 'semestre' ? 'Desempenho nos últimos 6 meses' : 
                 'Desempenho nos últimos anos'}
              </p>
            </div>
            <div className="flex bg-surface-container-low p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
              {[
                { id: '7d', label: '7 dias' },
                { id: '15d', label: '15 dias' },
                { id: 'mes', label: 'Mês' },
                { id: 'semestre', label: 'Semestre' },
                { id: 'ano', label: 'Ano' }
              ].map((range) => (
                <button 
                  key={range.id}
                  onClick={() => setTimeRange(range.id as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${
                    timeRange === range.id 
                      ? 'bg-white shadow-sm text-on-surface' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-6 h-72 px-4 pb-4">
            {getChartData().map((bar: any) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-4 group relative">
                {bar.active && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-12 bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl z-10"
                  >
                    {bar.value}
                  </motion.div>
                )}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: bar.height }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`w-full rounded-t-2xl transition-all duration-300 cursor-pointer ${bar.active ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-surface-container-high hover:bg-primary/30'}`}
                />
                <span className={`text-[10px] font-bold ${bar.active ? 'text-on-surface' : 'text-outline'}`}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#f4f9fb] rounded-[3rem] p-10 flex flex-col border border-secondary-container/10">
          <div className="flex items-center justify-between mb-10">
            <h4 className="font-headline font-bold text-2xl text-[#0a3a4a]">Sessões a Receber</h4>
            <ArrowIcon className="text-[#2a6673]" size={24} />
          </div>
          <div className="space-y-6">
            {sessoesAReceber.length > 0 ? sessoesAReceber.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-white p-8 rounded-[2.5rem] border-l-[6px] border-[#2a6673] shadow-lg shadow-secondary/5 flex flex-col gap-3 hover:shadow-md transition-all relative overflow-hidden`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="text-lg font-extrabold text-[#0a3a4a]">{item.patientName}</h5>
                    <p className="text-sm text-[#707973] italic font-medium mt-1">
                      {getTypeName(item.type)}
                    </p>
                  </div>
                  <span className={`text-[10px] font-black tracking-[0.15em] text-[#2a6673]`}>
                    {new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="text-2xl font-black text-[#191c1c]">
                    R$ {item.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  {canCreate && (
                    <button 
                      onClick={() => handleConfirmAction(item.id)}
                      className="text-[10px] font-black bg-[#edeeee] text-[#2a6673] px-6 py-2.5 rounded-2xl tracking-[0.1em] hover:bg-secondary/10 transition-all"
                    >
                      CONFIRMAR PAGAMENTO
                    </button>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-outline opacity-50 italic">
                <p className="text-sm">Nenhuma sessão pendente</p>
              </div>
            )}
          </div>
          <button className="mt-12 py-5 rounded-[2rem] border-2 border-dashed border-[#2a6673]/20 text-[#2a6673] font-black text-sm hover:bg-secondary/5 transition-all flex items-center justify-center gap-3">
            <Calendar size={20} /> Ver Calendário Completo
          </button>
        </div>
      </div>

      <section className="bg-white rounded-[3rem] shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="px-10 py-8 flex justify-between items-center bg-surface-container-low/30 border-b border-outline-variant/10">
          <h4 className="text-2xl font-headline font-bold text-on-surface">Transações Recentes</h4>
          {canReport && (
            <button 
              onClick={handleExportFinancialReport}
              disabled={isGeneratingReport}
              className="text-primary font-bold text-sm flex items-center gap-2 hover:underline disabled:opacity-50"
            >
              {isGeneratingReport ? 'Gerando...' : 'Exportar Relatório'} 
              {isGeneratingReport ? (
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={18} />
              )}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-outline text-[10px] font-bold tracking-widest uppercase">
                <th className="px-10 py-6 border-b border-outline-variant/5">PACIENTE</th>
                <th className="px-10 py-6 border-b border-outline-variant/5">DATA</th>
                <th className="px-10 py-6 border-b border-outline-variant/5">SERVIÇO</th>
                <th className="px-10 py-6 border-b border-outline-variant/5">VALOR</th>
                <th className="px-10 py-6 border-b border-outline-variant/5">STATUS</th>
                <th className="px-10 py-6 border-b border-outline-variant/5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {transacoesRecentes.length > 0 ? transacoesRecentes.map((row, i) => (
                <tr key={row.id} className="group hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {row.patientName.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-bold text-on-surface">{row.patientName}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-sm text-outline font-medium">
                    {new Date(row.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-10 py-6 text-sm font-bold text-on-surface-variant">
                    {getTypeName(row.type)}
                  </td>
                  <td className="px-10 py-6 font-extrabold text-on-surface">
                    R$ {row.price?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      row.paymentStatus === 'pago' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {row.paymentStatus === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-4">
                      {row.paymentStatus === 'pendente' && canCreate && (
                        <button 
                          onClick={() => handleConfirmAction(row.id)}
                          className="text-primary hover:text-primary/80 transition-colors font-bold text-[10px] uppercase tracking-widest"
                        >
                          Confirmar
                        </button>
                      )}
                      {canDelete && (
                        <button 
                          onClick={() => {
                            setItemToDelete(row.id);
                            setShowDeleteConfirm(true);
                          }}
                          className="text-rose-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded-xl"
                          title="Excluir Transação"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center text-outline italic opacity-50">
                    Nenhuma transação registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-10 py-6 bg-surface-container-low/10 flex justify-center border-t border-outline-variant/5">
          <button className="text-xs font-bold text-outline hover:text-on-surface transition-colors flex items-center gap-2">
            Ver Mais Atividades
          </button>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-outline-variant/10"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-4">Excluir Transação?</h3>
              <p className="text-on-surface-variant font-medium leading-relaxed mb-10">
                Esta ação irá remover permanentemente o registro desta transação e o agendamento correspondente. Esta operação não pode ser desfeita.
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteTransactionLocal}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-6 right-6 p-2 text-outline hover:text-on-surface transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
