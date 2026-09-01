
import React, { useState } from 'react';
import { AuditRecord } from '../types';

interface Props {
  audits: AuditRecord[];
  onReviewAction: (id: string, action: 'approve' | 'reject') => Promise<void>;
  onView: (id: string) => void;
}

const SupervisorInbox: React.FC<Props> = ({ audits, onReviewAction, onView }) => {
  const pendingAudits = audits.filter(a => a.status === 'pending_review');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    await onReviewAction(id, action);
    setProcessingId(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <span className="bg-brand-600 text-white p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            Bandeja de Visación
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Gestión de informes pendientes de revisión técnica.
          </p>
        </div>
        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-xs uppercase font-bold text-slate-500 block">Pendientes</span>
          <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">{pendingAudits.length}</span>
        </div>
      </div>

      {pendingAudits.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">Todo al día</h3>
          <p className="text-slate-400 dark:text-slate-500">No hay informes pendientes de visación.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingAudits.map((audit) => (
            <div key={audit.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase border ${
                    audit.classificationSnapshot === 'Alto' ? 'bg-red-50 border-red-200 text-red-600' :
                    audit.classificationSnapshot === 'Medio' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    'bg-green-50 border-green-200 text-green-600'
                  }`}>
                    Riesgo {audit.classificationSnapshot} ({audit.scoreSnapshot.toFixed(2)})
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {audit.id.slice(0,8)}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{audit.entidad}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> {audit.comuna}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> {audit.auditorName}</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">Enviado: {new Date(audit.lastModified).toLocaleString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onView(audit.id)}
                  disabled={processingId === audit.id}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Ver Detalle
                </button>
                
                {processingId === audit.id ? (
                   <button disabled className="px-6 py-2 text-sm font-bold text-white bg-slate-500 rounded-lg flex items-center gap-2 cursor-wait">
                     <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     Enviando Notificación...
                   </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleAction(audit.id, 'reject')}
                      className="px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    >
                      Rechazar
                    </button>
                    <button 
                      onClick={() => handleAction(audit.id, 'approve')}
                      className="px-6 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-500/30 rounded-lg transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Visar Informe
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupervisorInbox;
