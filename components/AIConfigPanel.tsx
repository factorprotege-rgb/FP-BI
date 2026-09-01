
import React, { useState, useRef } from 'react';
import { AIReportConfig, UserRole } from '../types';
import { extractTextFromFile } from '../utils';

interface Props {
  config: AIReportConfig;
  onChange: (newConfig: AIReportConfig) => void;
  userRole: UserRole;
}

const AIConfigPanel: React.FC<Props> = ({ config, onChange, userRole }) => {
  const [activeTab, setActiveTab] = useState<'focus' | 'data' | 'docs'>('focus');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleChange = (key: keyof AIReportConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessingFile(true);
      try {
        const text = await extractTextFromFile(file);
        handleChange('attachedDocsContext', text);
        alert(`Documento procesado exitosamente. Se extrajeron ${text.length} caracteres.`);
      } catch (err: any) {
        alert("Error al procesar documento: " + err.message);
      } finally {
        setIsProcessingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const appendInstruction = (text: string) => {
    const current = config.customInstructions || "";
    const separator = current.length > 0 ? "\n" : "";
    handleChange('customInstructions', current + separator + "- " + text);
  };

  // Librería de Comandos Rápidos
  const QUICK_PROMPTS = [
    { label: "⚖️ Enfoque Legal Estricto", text: "Prioriza citar artículos de la Ley 21.659 y DS 209 en cada hallazgo. Sé riguroso con el incumplimiento." },
    { label: "💰 Enfoque Financiero", text: "Redacta pensando en un Gerente de Finanzas. Justifica la inversión en seguridad como ahorro de pérdidas." },
    { label: "🚨 Tono de Alerta Máxima", text: "Usa un tono urgente y directo. Destaca que la vulnerabilidad es crítica y requiere acción inmediata." },
    { label: "🛡️ Tono Técnico/Ingeniero", text: "Céntrate en especificaciones de hardware (CCTV, Lúmenes, Grados de resistencia). Evita la retórica." },
    { label: "📉 Resumen Ejecutivo", text: "Sé extremadamente breve. Usa listas (bullet points) y párrafos cortos. Ideal para lectura rápida." },
    { label: "🤝 Tono Consultivo/Suave", text: "Usa un lenguaje diplomático. En lugar de 'Falla Grave', usa 'Oportunidad de Mejora'." }
  ];

  return (
    <div className="border rounded-xl shadow-lg mb-6 animate-fade-in relative overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-brand-500/30">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex-shrink-0 px-5 py-3 text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'focus' 
              ? 'bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          1. Dirección y Estrategia
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex-shrink-0 px-5 py-3 text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'data' 
              ? 'bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          2. Inteligencia de Entorno
          {(config.crimeStats || config.surroundings) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-shrink-0 px-5 py-3 text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
            activeTab === 'docs' 
              ? 'bg-slate-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          3. Documentos (RAG)
          {config.attachedDocsContext && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
        </button>
      </div>

      <div className="p-5">
        {activeTab === 'focus' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            
            {/* Custom Instructions Area - THE CORE */}
            <div className="space-y-3">
              <label className="text-sm font-bold uppercase mb-1 block text-slate-700 dark:text-white flex items-center gap-2">
                <span className="text-xl">🧠</span>
                Instrucciones de Mando a la IA
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Escriba aquí exactamente cómo quiere el informe. Sus órdenes tienen prioridad absoluta sobre la plantilla estándar.
              </p>
              <textarea
                value={config.customInstructions || ''}
                onChange={(e) => handleChange('customInstructions', e.target.value)}
                placeholder="Ej: 'Quiero que el informe se enfoque 100% en la falta de control de accesos. Sé muy crítico con la gestión actual. Menciona que esto viola el Art 7 del DS 209...'"
                rows={12}
                className="w-full border rounded-xl p-4 text-sm outline-none resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200 shadow-inner font-mono leading-relaxed"
              />
            </div>

            {/* Quick Prompts Library */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">
                Librería de Comandos Rápidos (Click para agregar)
              </label>
              <div className="grid grid-cols-1 gap-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => appendInstruction(prompt.text)}
                    className="flex items-start p-3 rounded-lg border bg-white hover:bg-brand-50 hover:border-brand-300 transition-all text-left group dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                  >
                    <div className="flex-1">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                        {prompt.label}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1 line-clamp-2">
                        "{prompt.text}"
                      </span>
                    </div>
                    <span className="text-slate-300 group-hover:text-brand-500 text-lg">+</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="text-xs font-bold uppercase mb-2 block text-slate-500 dark:text-slate-400">
                  Contexto del Negocio (Opcional)
                </label>
                <textarea
                  value={config.businessContext}
                  onChange={(e) => handleChange('businessContext', e.target.value)}
                  placeholder="Describa brevemente qué hace la empresa para dar contexto..."
                  rows={2}
                  className="w-full border rounded-lg p-2 text-xs outline-none resize-none focus:border-brand-500 bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
             <div className="space-y-3">
                <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 rounded px-1.5">STOP</span>
                  Estadística Delictual (Cuadrante)
                </label>
                <textarea
                  value={config.crimeStats || ''}
                  onChange={(e) => handleChange('crimeStats', e.target.value)}
                  placeholder="Ej: Aumento del 15% en robos con fuerza en el último trimestre. 5 Portonazos reportados en radio de 500m."
                  rows={4}
                  className="w-full border rounded-lg p-2 text-xs outline-none resize-none focus:border-brand-500 bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
                />
                <p className="text-[10px] text-slate-400">Ingrese datos duros del Sistema Táctico de Operación Policial o Comisaría Virtual.</p>
             </div>

             <div className="space-y-3">
                <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="bg-slate-200 dark:bg-slate-700 rounded px-1.5">CPTED</span>
                  Análisis del Entorno Inmediato
                </label>
                <textarea
                  value={config.surroundings || ''}
                  onChange={(e) => handleChange('surroundings', e.target.value)}
                  placeholder="Ej: Colinda al norte con sitio eriazo sin cierre perimetral. Al sur con sucursal bancaria (Riesgo Cruzado). Luminaria pública deficiente."
                  rows={4}
                  className="w-full border rounded-lg p-2 text-xs outline-none resize-none focus:border-brand-500 bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
                />
                <p className="text-[10px] text-slate-400">Factores ambientales externos que aumentan o mitigan el riesgo (Vecinos, iluminación, vegetación).</p>
             </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-4 animate-fade-in">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
               <h4 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                 📄 Análisis de Documentación Adjunta (RAG)
               </h4>
               <p className="text-xs text-blue-600 dark:text-blue-400 mb-4">
                 Sube manuales de procedimiento, informes anteriores o planes de seguridad (PDF o TXT). 
                 La IA leerá el contenido y lo utilizará para enriquecer el análisis y contrastar la realidad.
               </p>
               
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isProcessingFile}
                   className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 disabled:opacity-50"
                 >
                   {isProcessingFile ? (
                     <span className="animate-spin">⏳</span> 
                   ) : (
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                   )}
                   {isProcessingFile ? 'Procesando...' : 'Adjuntar Documento'}
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   accept=".txt,.pdf" 
                   className="hidden" 
                   onChange={handleFileUpload} 
                 />
                 {config.attachedDocsContext && (
                   <span className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                     ✓ Contenido cargado en memoria
                     <button 
                       onClick={() => handleChange('attachedDocsContext', '')}
                       className="text-red-500 hover:underline ml-2"
                     >
                       (Borrar)
                     </button>
                   </span>
                 )}
               </div>
             </div>
             
             {config.attachedDocsContext && (
               <div className="mt-4">
                 <label className="text-xs font-bold uppercase mb-1 block text-slate-500 dark:text-slate-400">Vista Previa del Contenido Extraído (Solo Lectura)</label>
                 <textarea 
                   readOnly
                   value={config.attachedDocsContext.substring(0, 1000) + (config.attachedDocsContext.length > 1000 ? '...' : '')}
                   className="w-full h-32 text-[10px] font-mono p-2 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                 />
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIConfigPanel;
