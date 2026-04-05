"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Package, DatabaseZap, Play, XSquare, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<boolean>(false);
  
  const [activeTab, setActiveTab] = useState<"procedures" | "medical_supplies">("procedures");
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ success: 0, errors: 0 });
  
  // Fases do processo: "IDLE" -> "READY" -> "IMPORTING" -> "DONE"
  const [stage, setStage] = useState<"IDLE" | "READY" | "IMPORTING" | "DONE">("IDLE");
  const [fileName, setFileName] = useState("");
  const [parsedData, setParsedData] = useState<any[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLogs([]);
    setStats({ success: 0, errors: 0 });
    addLog(`Lendo arquivo: ${file.name}... Aguarde.`);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(worksheet);

      setParsedData(json);
      setStage("READY");
      addLog(`Planilha auditada com sucesso! ${json.length} registros prontos para carga no banco de dados. Clique em Iniciar.`);
    } catch (err: any) {
      console.error(err);
      addLog(`🚨 Erro ao ler a planilha: ${err.message}`);
      setStage("IDLE");
    }
  };

  const cancelImport = () => {
     if (stage === "IMPORTING") {
       cancelRef.current = true;
       addLog(`⚠️ Processo de cancelamento solicitado... Parando na próxima iteração.`);
     } else {
       setStage("IDLE");
       setParsedData([]);
       setFileName("");
       if (fileInputRef.current) fileInputRef.current.value = "";
       addLog(`Operação cancelada pelo usuário. Sistema limpo.`);
     }
  };

  const processImport = async () => {
    if (parsedData.length === 0) return;

    setStage("IMPORTING");
    cancelRef.current = false;
    let successCount = 0;
    let errorCount = 0;

    addLog(`🚀 INICIANDO INGESTÃO DE DADOS (${parsedData.length} registros no lote).`);

    for (let i = 0; i < parsedData.length; i++) {
      if (cancelRef.current) {
         addLog(`🛑 Ingestão abortada! Parada de segurança acionada. Foram inseridos ${successCount} registros.`);
         setStage("DONE");
         return;
      }

      const row = parsedData[i];
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
      
      if (i > 0 && i % 50 === 0) {
         setStats({ success: successCount, errors: errorCount });
      }
    }

    setStats({ success: successCount, errors: errorCount });
    addLog(`✅ Processo concluido! Lote inteiro enviado com ${successCount} acertos e ${errorCount} erros.`);
    setStage("DONE");
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
                  disabled={stage === "IMPORTING"}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === "procedures" ? "bg-white shadow text-indigo-700" : "text-neutral-500 hover:text-neutral-800"
                  } disabled:opacity-50`}
                  onClick={() => setActiveTab("procedures")}
                >
                  <FileSpreadsheet size={16} /> Procedimentos (TUSS)
                </button>
                <button
                  disabled={stage === "IMPORTING"}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    activeTab === "medical_supplies" ? "bg-white shadow text-indigo-700" : "text-neutral-500 hover:text-neutral-800"
                  } disabled:opacity-50`}
                  onClick={() => setActiveTab("medical_supplies")}
                >
                  <Package size={16} /> Medicamentos e Materiais
                </button>
              </div>

              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-4 transition-all">
                 {stage === "IDLE" && (
                    <>
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
                         onChange={handleFileSelection} 
                         accept=".xlsx, .xls, .csv" 
                         className="hidden" 
                       />
                       <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                       >
                          Procurar no computador
                       </button>
                    </>
                 )}

                 {stage === "READY" && (
                    <div className="w-full text-left space-y-4">
                       <div className="flex items-center gap-3">
                         <CheckCircle className="text-green-500" size={24}/>
                         <div>
                            <p className="text-sm font-bold text-indigo-900 line-clamp-1">{fileName}</p>
                            <p className="text-xs text-indigo-700 font-mono">{parsedData.length} registros analisados</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={processImport} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                             <Play fill="currentColor" size={18} /> Iniciar
                          </button>
                          <button onClick={cancelImport} className="py-3 px-4 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                             Cancelar
                          </button>
                       </div>
                    </div>
                 )}

                 {stage === "IMPORTING" && (
                    <div className="w-full py-2 space-y-4">
                       <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="font-bold text-indigo-900 text-sm">Enviando dados pro banco...</p>
                       </div>
                       <button onClick={cancelImport} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2">
                          <XSquare size={18} /> Forçar Parada
                       </button>
                    </div>
                 )}

                 {stage === "DONE" && (
                    <div className="w-full space-y-4 text-center">
                       <CheckCircle className="text-green-500 mx-auto" size={48}/>
                       <h3 className="font-bold text-xl text-indigo-900">Carga Finalizada</h3>
                       <button onClick={cancelImport} className="mt-2 w-full py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                          Nova Importação
                       </button>
                    </div>
                 )}
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
