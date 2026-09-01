import React, { useState } from 'react';
import { CalculationResult, RiskData } from '../types';
import { calculateDS209Risk, generateDS209Measures, generateDS209Protocols } from '../utils';
import Charts from './Charts';
import BudgetEstimator from './BudgetEstimator';

interface Props {
  result: CalculationResult;
  data: RiskData;
}

export default function IntegratedResultsDashboard({ result, data }: Props) {
  const [activeResultsView, setActiveResultsView] = useState<'matrix' | 'ds209' | 'gaps' | 'protocols'>('matrix');

  // Compute DS 209 dynamic safety ratings
  const ds209Result = calculateDS209Risk(data);
  const ds209Measures = generateDS209Measures(data);
  const ds209Protocols = generateDS209Protocols(data);

  const getPriorityColor = (prio: 'ALTA' | 'MEDIA' | 'BAJA') => {
    switch (prio) {
      case 'ALTA': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30';
      case 'MEDIA': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
      case 'BAJA': return 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/30';
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Visual Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl max-w-2xl">
        {[
          { id: 'matrix', label: 'Matriz RE 1820', icon: '📝' },
          { id: 'ds209', label: 'Vulnerabilidades DS 209', icon: '🛡️' },
          { id: 'gaps', label: 'Informe de Brechas', icon: '⚠️' },
          { id: 'protocols', label: 'Estado de Protocolos', icon: '📋' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveResultsView(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeResultsView === tab.id
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: RESOLUCIÓN 1820 CHARTS */}
      {activeResultsView === 'matrix' && (
        <div className="space-y-6">
          <Charts result={result} containerId="charts-container" />
        </div>
      )}

      {/* VIEW 2: VULNERABILIDADES DS 209 SECTORS */}
      {activeResultsView === 'ds209' && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-10 shadow-sm space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Estudio de Vulnerabilidad DS 209</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Diagnóstico Técnico de Aptitud Operacional</p>
            </div>
            <div className={`px-6 py-2.5 rounded-2xl border-2 font-black text-xs text-center ${
              ds209Result.classification === 'Alto'
                ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/10 dark:text-red-400'
                : ds209Result.classification === 'Medio'
                  ? 'bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-950/10 dark:text-amber-400'
                  : 'bg-green-50 border-green-500 text-green-600 dark:bg-green-950/10 dark:text-green-400'
            }`}>
              VULNERABILIDAD RIESGO {ds209Result.classification.toUpperCase()}
              <div className="text-[9px] font-bold opacity-85 uppercase block mt-1">{ds209Result.categoriaDS209}</div>
            </div>
          </div>

          {/* Dimension Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Valor Activos', score: ds209Result.pActivos, icon: '🏦' },
              { label: 'Operación / Personas', score: ds209Result.pPersonas, icon: '👥' },
              { label: 'Flujo Efectivo', score: ds209Result.pEfectivo, icon: '💵' },
              { label: 'Entorno Delictivo', score: ds209Result.pEntorno, icon: '🌍' },
              { label: 'Física / Cierres', score: ds209Result.pVulFisica, icon: '🧱' },
              { label: 'CCTV y Alarmas', score: ds209Result.pVulTec, icon: '📹' },
              { label: 'OS-10 / Personal', score: ds209Result.pVulHumana, icon: '👮' },
              { label: 'Protocolos Activos', score: ds209Result.pProtocolo, icon: '📋' }
            ].map((dim, idx) => (
              <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                <span className="text-2xl mb-2">{dim.icon}</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-snug">{dim.label}</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className={`text-2xl font-black ${
                    dim.score >= 3.5 ? 'text-red-500' : dim.score >= 2.5 ? 'text-amber-500' : 'text-green-500'
                  }`}>{dim.score}</span>
                  <span className="text-slate-400 text-xs font-bold">/4</span>
                </div>
                {/* Visual meter bar */}
                <div className="w-full bg-slate-250 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      dim.score >= 3.5 ? 'bg-red-500' : dim.score >= 2.5 ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(dim.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Quantitative breakdown / comment */}
          <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-[#3c4043] p-6 rounded-2xl">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fundamento Científico DS 209:</h4>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed italic">
              {ds209Result.fundamento}
            </p>
          </div>
        </div>
      )}

      {/* VIEW 3: INFORME DE BRECHAS (MEDIDAS CORRECTIVAS) */}
      {activeResultsView === 'gaps' && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-10 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Plan de Corrección e Informe de Brechas</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Medidas de Reducción de Riesgo Exigibles según Ley N°21.659</p>
          </div>

          {/* Gaps List */}
          <div className="space-y-4">
            {ds209Measures.map((measure, idx) => (
              <div 
                key={measure.idMedida || idx} 
                className="p-6 bg-slate-50 dark:bg-[#303134] rounded-2xl border border-slate-100 dark:border-transparent flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg ${getPriorityColor(measure.prioridad)}`}>
                      PRIORIDAD {measure.prioridad}
                    </span>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-bold uppercase">{measure.dimension}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{measure.articulo}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Brecha o Carencia detectada:</span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1 leading-snug">{measure.brecha}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-brand-500">Medida Correctiva Operacional:</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mt-1 leading-snug">{measure.medida}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 mt-2">
                    <strong>Fundamento Técnico:</strong> "{measure.fundamento}"
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full md:w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center md:text-left">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Responsable Sugerido</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{measure.responsableSugerido}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Plazo de Corrección</span>
                    <span className="text-xs font-bold text-google-blue">{measure.plazoSugerido}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Evidencia de Cumplimiento</span>
                    <span className="text-[10px] text-slate-500 leading-tight block">{measure.evidenciaCumplimiento}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: ESTADO DE PROTOCOLOS */}
      {activeResultsView === 'protocols' && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-10 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Estado de Formalización de Protocolos</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Fichas de Auditoria de Manuales de Reacción Interna (Art. 9° DS 209)</p>
          </div>

          <div className="space-y-4">
            {ds209Protocols.map(proto => {
              const active = proto.estado === 'VIGENTE';
              return (
                <div 
                  key={proto.idProtocolo} 
                  className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                    active 
                      ? 'bg-green-50/50 border-green-200 dark:bg-green-950/5 dark:border-green-900/30' 
                      : 'bg-slate-50/50 border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/80'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-400">{proto.idProtocolo}</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{proto.nombreProtocolo}</h4>
                      <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded ${
                        active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      }`}>
                        {proto.estado}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      <strong>Contenido Requerido:</strong> {proto.contenidoMinimo}
                    </p>
                  </div>

                  <div className="w-full md:w-56 text-right md:text-left bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl flex md:flex-col justify-between md:justify-start items-center md:items-start gap-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Estatus Operativo</span>
                      <span className={`text-[10px] font-bold ${active ? 'text-green-600' : 'text-google-red font-bold'}`}>{proto.observacion}</span>
                    </div>
                    <div className="md:mt-2">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Responsable Control</span>
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{proto.responsable}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget compliance segment */}
      <BudgetEstimator result={result} data={data} />
    </div>
  );
}
