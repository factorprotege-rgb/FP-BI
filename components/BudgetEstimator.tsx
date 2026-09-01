
import React, { useState } from 'react';
import { CalculationResult, RiskData } from '../types';
import { formatCurrency, calculateBudget } from '../utils';

interface Props {
  result: CalculationResult;
  data: RiskData;
}

const BudgetEstimator: React.FC<Props> = ({ result, data }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const budget = calculateBudget(result, data);
  const isHighRisk = result.classification === 'Alto';

  return (
    <div className="border rounded-xl shadow-sm bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 animate-fade-in transition-all">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
             <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-white">Estimación Financiera (Opcional)</h3>
             <p className="text-[10px] text-slate-400">Proyección de CAPEX/OPEX para cumplimiento normativo.</p>
          </div>
        </div>
        <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-400`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            
            {/* CAPEX */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500 uppercase">Inversión Inicial (CAPEX)</span>
                 <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{formatCurrency(budget.capexTotal)}</span>
              </div>
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                 <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1">
                    <span>Sistema CCTV ({budget.details.cctvCount} cámaras + NVR)</span>
                    <span>{formatCurrency(budget.details.cctvCost)}</span>
                 </div>
                 <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1">
                    <span>Kit Alarmas Grado {isHighRisk ? '3' : '2'}</span>
                    <span>{formatCurrency(budget.details.alarmCost)}</span>
                 </div>
                 {budget.details.accessCost > 0 && (
                    <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1">
                       <span>Control Acceso / Blindaje</span>
                       <span>{formatCurrency(budget.details.accessCost)}</span>
                    </div>
                 )}
              </div>
            </div>

            {/* OPEX */}
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500 uppercase">Gasto Mensual (OPEX)</span>
                 <span className="text-lg font-bold text-brand-600 dark:text-brand-400">{formatCurrency(budget.opexTotal)}</span>
               </div>
               <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                 <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1">
                    <span>RR.HH Seguridad ({budget.details.guardsNeeded} FTE)</span>
                    <span>{formatCurrency(budget.details.guardCost)}</span>
                 </div>
                 <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1">
                    <span>Monitoreo Remoto (C.R.A)</span>
                    <span>{formatCurrency(budget.details.monitoringCost)}</span>
                 </div>
                 <div className="flex justify-between border-b border-dashed border-slate-200 dark:border-slate-800 pb-1">
                    <span>Mantenimiento Preventivo</span>
                    <span>{formatCurrency(budget.details.maintenanceCost)}</span>
                 </div>
               </div>
            </div>

          </div>
          
          <div className="mt-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-[9px] text-slate-400 text-center">
             * Valores netos aproximados en CLP. No constituye oferta comercial vinculante.
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetEstimator;
