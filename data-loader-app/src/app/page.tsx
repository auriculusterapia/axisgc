"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Package, DatabaseZap } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"procedures" | "medical_supplies">("procedures");
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ success: 0, errors: 0 });

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setLogs([]);
    setStats({ success: 0, errors: 0 });
    addLog(`Iniciando leitura do arquivo: ${file.name}`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(worksheet);

      let successCount = 0;
      let errorCount = 0;

      addLog(`Planilha lida com sucesso: ${json.length} linhas encontradas. Formatando chaves...`);

      for (let i = 0; i < json.length; i++) {
        const row = json[i];
        const keys = Object.keys(row);
        const normalize = (str: string) =>
          str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        const findVal = (keywords: string[]) => {
          const matchedKey = keys.find((k) => keywords.some((kw) => normalize(k).includes(kw)));
          return matchedKey ? row[matchedKey] : undefined;
        };

        const code = findVal(["codigo do termo", "codigo", "cod"]);
        const name = findVal(["termo", "nome", "descricao"]);
        const presentation = findVal(["apresentacao"]);
        const laboratory = findVal(["laboratorio"]);
        const anvisa = findVal(["anvisa", "registro"]);

        if (code && name && code.toString().trim() !== "" && name.toString().trim() !== "") {
          const table = activeTab === "procedures" ? "procedures" : "medical_supplies";
          const baseData = {
            code: code.toString().trim(),
            name: name.toString().trim(),
            updated_at: new Date().toISOString(),
          };

          const insertData =
            activeTab === "procedures"
              ? { ...baseData, category: "tuss" }
              : {
                  ...baseData,
                  presentation: presentation?.toString().trim() || "",
                  laboratory: laboratory?.toString().trim() || "",
                  anvisa_registry: anvisa?.toString().trim() || "",
                  category: "medicamento",
                };

          const { error } = await supabase.from(table).upsert(insertData, {
            onConflict: "code",
          });

          if (!error) {
            successCount++;
          } else {
            errorCount++;
            addLog(`❌ Erro no código ${code}: ${error.message}`);
          }
        }
        
        // Atualiza UI a cada lote pequeno para não travar o loader
        if (i > 0 && i % 100 === 0) {
           setStats({ success: successCount, errors: errorCount });
        }
      }

      setStats({ success: successCount, errors: errorCount });
      addLog(`✅ Processo finalizado. ${successCount} registros atualizados ou inseridos no banco de dados!`);
    } catch (err: any) {
      console.error(err);
      addLog(`🚨 Falha crítica no CSV/XLSX: ${err.message}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <header className="flex items-center gap-4 border-b border-neutral-200 pb-6">
          <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <DatabaseZap size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-indigo-900">Data Loader</h1>
            <p className="text-neutral-500 font-medium">Motor independente de Ingestão de Dados - Axis GC</p>
          </div>
        </header>

        {/* Console de Upload */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <section className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Configuração da Carga</h2>
              
              <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
                <button
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === "procedures" ? "bg-white shadow text-indigo-700" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                  onClick={() => setActiveTab("procedures")}
                >
                  <FileSpreadsheet size={16} /> Procedimentos (TUSS)
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === "medical_supplies" ? "bg-white shadow text-indigo-700" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                  onClick={() => setActiveTab("medical_supplies")}
                >
                  <Package size={16} /> Medicamentos e Materiais
                </button>
              </div>

              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4">
                 <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
                    <Upload size={32} />
                 </div>
                 <div>
                    <h3 className="font-bold text-lg text-indigo-900">Selecione uma Planilha</h3>
                    <p className="text-sm text-indigo-700/80 mt-1">Formato suportado: .xlsx, .xls, .csv</p>
                 </div>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileUpload} 
                   accept=".xlsx, .xls, .csv" 
                   className="hidden" 
                 />
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isImporting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Lendo e Salvando...
                      </>
                    ) : (
                       "Procurar no computador"
                    )}
                 </button>
              </div>
            </div>
            
            {/* Informações de Conexão */}
            <div className="bg-neutral-800 text-neutral-300 p-6 rounded-3xl text-sm border-4 border-neutral-900 shadow-xl">
               <h3 className="text-white font-bold mb-2 flex items-center gap-2">🔌 Status da Conexão</h3>
               <p>Conectado ao Supabase: <strong className="text-emerald-400">Online</strong></p>
               <p className="mt-2 text-xs text-neutral-400 border-t border-neutral-700 pt-2">Operador de carga: Axis GC DataLoader V1.0</p>
            </div>
          </section>

          <section>
             <div className="bg-black text-emerald-400 font-mono text-xs p-6 rounded-3xl h-[500px] flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full px-6 py-3 bg-neutral-900 border-b border-neutral-800 flex justify-between items-center text-neutral-400 font-sans font-bold">
                   <span>Terminal de Execução</span>
                   <div className="flex gap-4">
                      <span>🟩 {stats.success}</span>
                      <span className="text-red-400">🟥 {stats.errors}</span>
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto mt-10 space-y-1 pr-2 custom-scrollbar">
                   {logs.length === 0 ? (
                      <div className="text-neutral-600 italic">Aguardando iniciar carga de dados...</div>
                   ) : (
                      logs.map((log, index) => (
                         <div key={index}>{log}</div>
                      ))
                   )}
                </div>
             </div>
          </section>

        </main>
      </div>
    </div>
  );
}
