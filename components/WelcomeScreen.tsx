import React from 'react';
import { UserRole, AuditRecord } from '../types';
import SentryGuardLogo from './SentryGuardLogo';

interface Props {
  onStartNew: () => void;
  onResume: (id: string) => void;
  onOpenCommercialDashboard?: () => void;
  userRole: UserRole;
  userName: string;
  audits: AuditRecord[];
}

const WelcomeScreen: React.FC<Props> = ({ 
  onStartNew, 
  onResume, 
  onOpenCommercialDashboard,
  userRole, 
  userName, 
  audits 
}) => {
  // Sort audits by last modified to find the most recent
  const sortedAudits = [...audits].sort((a, b) => b.lastModified - a.lastModified);
  const lastActiveAudit = sortedAudits[0];

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'gerente_comercial':
        return { label: '👔 Gerente Comercial', bg: 'bg-brand-500/10 text-brand-600 border-brand-200' };
      case 'supervisor':
        return { label: '🛡️ Supervisor Zonal', bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' };
      case 'ejecutivo_comercial':
        return { label: '💼 Ejecutivo Comercial', bg: 'bg-amber-500/10 text-amber-600 border-amber-200' };
      default:
        return { label: '📝 Evaluador Certificado', bg: 'bg-purple-500/10 text-purple-600 border-purple-200' };
    }
  };

  const badge = getRoleBadge(userRole);

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#202124] flex flex-col items-center justify-center p-6 animate-fade-in font-sans transition-colors duration-300">
      <div className="max-w-5xl w-full">
        <div className="flex justify-center mb-6">
           <SentryGuardLogo className="h-16 w-auto" />
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border mb-3 uppercase tracking-wider ${badge.bg}">
            {badge.label}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
            Hola, {userName.split(' ')[0]}
          </h1>
          <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Plataforma de Inteligencia en Seguridad Privada Ley 21.659 y Decreto Supremo 209. Estructura corporativa por <strong>RUT</strong>, <strong>Sucursales</strong> y trazabilidad comercial de mitigaciones.
          </p>
        </div>

        {/* 3 Main Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Dashboard de Gestión & Sucursales */}
          <div className="p-7 bg-white dark:bg-[#2d2e30]/40 rounded-3xl border-2 border-brand-500/30 dark:border-brand-500/20 shadow-sm flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center text-2xl mb-4">
                🏢
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Cartera & Multi-Sucursales
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Gestión integral de clientes agrupados por RUT, visualización de matrices de sucursales, control de riesgos y conversión comercial.
              </p>
            </div>
            
            <button 
              onClick={onOpenCommercialDashboard || onStartNew}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-google transition transform hover:scale-[1.02] text-xs"
            >
              Abrir Panel de Clientes →
            </button>
          </div>

          {/* Card 2: Nueva Evaluación de Terreno */}
          <div className="p-7 bg-white dark:bg-[#2d2e30]/40 rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-sm flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-2xl mb-4">
                🛡️
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Nuevo Estudio de Seguridad
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Evaluar directamente una instalación según los 12 factores normativos (Res 1820) y matriz de vulnerabilidades físicas (DS 209).
              </p>
            </div>
            
            <button 
              onClick={onStartNew}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-google transition transform hover:scale-[1.02] text-xs"
            >
              Comenzar Evaluación
            </button>
          </div>

          {/* Card 3: Reanudar Última Evaluación */}
          <div className="p-7 bg-white dark:bg-[#2d2e30]/40 rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-sm flex flex-col justify-between hover:shadow-lg transition">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center text-2xl mb-4">
                ⏳
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Reanudar Borrador Activo
              </h2>
              
              {lastActiveAudit ? (
                <div className="mb-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-xl text-left">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 truncate text-xs mb-1">
                      {lastActiveAudit.entidad || 'Evaluación en Progreso'}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold">
                      Score: {lastActiveAudit.scoreSnapshot ? lastActiveAudit.scoreSnapshot.toFixed(1) : 'N/A'} • {lastActiveAudit.classificationSnapshot || 'Medio'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                  No hay evaluaciones en curso pendientes de continuar.
                </p>
              )}
            </div>

            {lastActiveAudit ? (
              <button 
                onClick={() => onResume(lastActiveAudit.id)}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl shadow-google transition transform hover:scale-[1.02] text-xs"
              >
                Continuar Borrador
              </button>
            ) : (
              <button 
                disabled
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-bold rounded-2xl cursor-not-allowed text-xs"
              >
                Sin Borrador Activo
              </button>
            )}
          </div>

        </div>

        {/* Recent Audits Table if present */}
        {sortedAudits.length > 0 && (
          <div className="bg-white dark:bg-[#2d2e30]/30 rounded-3xl border border-slate-200 dark:border-[#3c4043] p-6 shadow-sm">
             <div className="flex items-center justify-between mb-3">
               <h3 className="font-bold text-slate-800 dark:text-white text-sm">Evaluaciones y Estudios Guardados en Base de Datos</h3>
               <span className="text-xs text-slate-400 font-semibold">{sortedAudits.length} registros</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedAudits.slice(0, 6).map(audit => (
                   <div 
                      key={audit.id}
                      onClick={() => onResume(audit.id)}
                      className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50/5 dark:hover:bg-brand-500/5 cursor-pointer transition flex justify-between items-center text-left"
                   >
                     <div className="truncate pr-3">
                       <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{audit.entidad || 'Empresa'}</h4>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                         {new Date(audit.lastModified).toLocaleDateString()} • {audit.comuna || 'Sin comuna'}
                       </p>
                     </div>
                     <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                       (audit.scoreSnapshot || 0) >= 8 ? 'bg-red-100 text-red-600' : 
                       (audit.scoreSnapshot || 0) >= 5 ? 'bg-amber-100 text-amber-600' : 
                       'bg-green-100 text-green-600'
                     }`}>
                       {audit.scoreSnapshot ? audit.scoreSnapshot.toFixed(1) : '5.0'}
                     </span>
                   </div>
                ))}
             </div>
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
            FACTOR PROTEGE BI © 2026 • LEY 21.659 & DECRETO SUPREMO 209 • CHILE
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;

