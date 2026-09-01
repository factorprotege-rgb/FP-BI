
import React, { useRef, useState } from 'react';
import { AuditRecord } from '../types';
import { generateAuditsCSV } from '../utils';
import GlobalAnalytics from './GlobalAnalytics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audits: AuditRecord[];
  currentAuditId: string | null;
  onLoad: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

const AuditManager: React.FC<Props> = ({ 
  isOpen, onClose, audits, currentAuditId, onLoad, onCreate, onDelete, onImport, onExport 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<'list' | 'analytics'>('list');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  const handleExportCSV = () => {
    generateAuditsCSV(audits);
  };

  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full shadow-2xl border-l flex flex-col animate-slide-in-right bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              Gestor de Evaluaciones
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {viewMode === 'list' ? 'Administra tus evaluaciones locales' : 'Inteligencia de Negocios Global'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full transition text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* View Toggle */}
        <div className="p-2 mx-4 mt-4 bg-slate-100 dark:bg-slate-800 rounded-lg flex p-1 border border-slate-200 dark:border-slate-700">
           <button 
             onClick={() => setViewMode('list')}
             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm dark:bg-slate-700 dark:text-brand-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             Lista ({audits.length})
           </button>
           <button 
             onClick={() => setViewMode('analytics')}
             className={`flex-1 py-1.5 text-xs font-bold rounded-md transition flex items-center justify-center gap-1 ${viewMode === 'analytics' ? 'bg-white text-purple-600 shadow-sm dark:bg-slate-700 dark:text-purple-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
           >
             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             Analítica Global
           </button>
        </div>

        {viewMode === 'analytics' ? (
           <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <GlobalAnalytics audits={audits} />
           </div>
        ) : (
          <>
            {/* Actions Bar */}
            <div className="p-4 grid grid-cols-2 gap-3 border-b bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800">
              <button 
                onClick={onCreate}
                className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-brand-900/20 transition mb-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Nueva Evaluación
              </button>
              
              <div className="col-span-2 grid grid-cols-3 gap-2">
                <button 
                    onClick={onExport}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium border transition bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                    title="Descargar respaldo JSON"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Backup JSON
                </button>
                <button 
                    onClick={handleExportCSV}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium border transition bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                    title="Exportar Reporte Excel"
                  >
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Exportar Excel
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium border transition bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
                    title="Cargar respaldo JSON"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Restaurar
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {audits.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <p className="mb-2 text-slate-500 dark:text-slate-500">No hay evaluaciones guardadas.</p>
                  <p className="text-xs text-slate-400 dark:text-slate-600">Crea una nueva para comenzar.</p>
                </div>
              ) : (
                audits
                .sort((a, b) => b.lastModified - a.lastModified)
                .map((audit) => (
                  <div 
                    key={audit.id} 
                    className={`group relative p-4 rounded-xl border transition-all ${
                      audit.id === currentAuditId 
                        ? 'bg-brand-50 border-brand-500 shadow-md dark:bg-brand-500/10' 
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-800/50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="cursor-pointer" onClick={() => onLoad(audit.id)}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`font-bold truncate pr-6 ${audit.id === currentAuditId ? 'text-brand-600 dark:text-brand-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {audit.entidad || 'Sin Nombre'}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          audit.classificationSnapshot === 'Alto' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                          audit.classificationSnapshot === 'Medio' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                          'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                        }`}>
                          {audit.scoreSnapshot.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs truncate mb-2 text-slate-500 dark:text-slate-500">
                        {audit.comuna ? `${audit.comuna} • ` : ''}
                        {new Date(audit.lastModified).toLocaleDateString()}
                        {' '}
                        {new Date(audit.lastModified).toLocaleTimeString(undefined, timeOpts)}
                      </p>
                      {audit.id === currentAuditId && (
                        <div className="text-[10px] font-medium flex items-center gap-1 text-brand-600 dark:text-brand-500">
                          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span> Editando ahora
                        </div>
                      )}
                    </div>

                    {/* Delete Action */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(audit.id); }}
                      className="absolute top-4 right-4 p-1.5 rounded opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:text-slate-600 dark:hover:text-red-400 dark:hover:bg-slate-900"
                      title="Eliminar evaluación"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        
        {/* Footer info */}
        <div className="p-4 border-t text-center text-[10px] border-slate-200 text-slate-400 dark:border-slate-800 dark:text-slate-600">
           Almacenamiento Local (Browser Storage)
        </div>
      </div>
    </div>
  );
};

export default AuditManager;
