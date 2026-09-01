
import React, { useState } from 'react';
import { RiskData, CalculationResult } from '../types';

interface Props {
  data: RiskData;
  result: CalculationResult;
}

const JSONResultViewer: React.FC<Props> = ({ data, result }) => {
  // CHANGED: Default to true so it is immediately visible
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  // Prepare the object to be displayed/downloaded
  const jsonContent = {
    metadata: {
      timestamp: new Date().toISOString(),
      platform: "Alianza Seguridad - Risk Matrix",
      version: "1.0"
    },
    entity: {
      name: data.entidad,
      rut: data.rut,
      location: {
        address: data.direccion,
        commune: data.comuna,
        coords: data.coords
      }
    },
    risk_matrix: {
      score: result.score,
      classification: result.classification,
      factors: result.details.map(d => ({
        id: d.id,
        name: d.title,
        value: d.value,
        observation: data.observations[d.id] || null
      }))
    },
    raw_inputs: data
  };

  const jsonString = JSON.stringify(jsonContent, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultado_matriz_${data.rut.replace(/\./g, '')}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-md bg-white dark:bg-slate-900 animate-fade-in transition-all mt-8 mb-8 overflow-hidden">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
             <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
             <h3 className="text-base font-bold uppercase tracking-wider text-slate-800 dark:text-white">Datos Técnicos (JSON)</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">Visualizar estructura de datos crudos y descargar archivo.</p>
          </div>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {isOpen && (
        <div className="flex flex-col border-t border-slate-300 dark:border-slate-700">
          
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-100 dark:bg-[#020617] border-b border-slate-200 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Archivo:</span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">resultado_matriz.json</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleCopy}
                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-white px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 transition shadow-sm"
              >
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
              <button 
                onClick={handleDownload}
                className="text-xs font-bold text-white px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Descargar .JSON
              </button>
            </div>
          </div>

          {/* Code View */}
          <div className="p-0 bg-[#0f172a] overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-8 h-full bg-[#1e293b] border-r border-slate-700 z-10 hidden md:block"></div>
            <div className="p-4 md:pl-12 overflow-x-auto custom-scrollbar max-h-[500px]">
              <pre className="text-xs font-mono leading-relaxed text-green-400">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JSONResultViewer;
