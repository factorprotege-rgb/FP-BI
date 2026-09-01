
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';
import { AuditRecord } from '../types';

interface Props {
  audits: AuditRecord[];
}

const GlobalAnalytics: React.FC<Props> = ({ audits }) => {
  if (!audits.length) return <div className="p-8 text-center text-slate-500">Sin datos suficientes para análisis.</div>;

  // --- KPI CALCS ---
  const totalAudits = audits.length;
  const avgScore = audits.reduce((acc, curr) => acc + curr.scoreSnapshot, 0) / totalAudits;
  const highRiskCount = audits.filter(a => a.classificationSnapshot === 'Alto').length;
  const highRiskPct = (highRiskCount / totalAudits) * 100;

  // --- CHARTS DATA ---

  // 1. Distribution (Pie)
  const distMap = audits.reduce((acc: any, curr) => {
    acc[curr.classificationSnapshot] = (acc[curr.classificationSnapshot] || 0) + 1;
    return acc;
  }, {});
  
  const pieData = [
    { name: 'Bajo', value: distMap['Bajo'] || 0, color: '#22c55e' },
    { name: 'Medio', value: distMap['Medio'] || 0, color: '#f59e0b' },
    { name: 'Alto', value: distMap['Alto'] || 0, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // 2. Comuna Ranking (Bar) - Top 5 Riskiest
  const comunaMap = audits.reduce((acc: any, curr) => {
    if (!acc[curr.comuna]) acc[curr.comuna] = { total: 0, count: 0 };
    acc[curr.comuna].total += curr.scoreSnapshot;
    acc[curr.comuna].count += 1;
    return acc;
  }, {});

  const barData = Object.entries(comunaMap)
    .map(([key, val]: any) => ({
      name: key,
      score: Number((val.total / val.count).toFixed(2)),
      count: val.count
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // 3. Timeline (Line) - Last 10 audits
  const lineData = [...audits]
    .sort((a, b) => a.lastModified - b.lastModified)
    .slice(-10)
    .map(a => ({
      date: new Date(a.lastModified).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
      score: a.scoreSnapshot
    }));

  return (
    <div className="space-y-6 animate-fade-in p-1">
      
      {/* KPI ROW */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs text-slate-500 uppercase font-bold">Total Sitios</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalAudits}</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs text-slate-500 uppercase font-bold">Riesgo Promedio</div>
          <div className={`text-2xl font-bold ${avgScore >= 8 ? 'text-red-500' : avgScore >= 5 ? 'text-amber-500' : 'text-green-500'}`}>
            {avgScore.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs text-slate-500 uppercase font-bold">% Críticos</div>
          <div className="text-2xl font-bold text-red-500">{highRiskPct.toFixed(0)}%</div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Comuna Ranking */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase text-slate-500 mb-4">Top Zonas de Riesgo (Promedio)</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{left: 0}}>
                <XAxis type="number" domain={[0, 10]} hide />
                <YAxis dataKey="name" type="category" width={90} tick={{fontSize: 10, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', fontSize: '12px', border:'none', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 8 ? '#ef4444' : entry.score >= 5 ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Distribution */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
             <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 text-center">Distribución</h4>
             <div className="h-32 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={pieData} innerRadius={25} outerRadius={40} paddingAngle={5} dataKey="value">
                     {pieData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* Trend */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm">
             <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 text-center">Tendencia (Últimos 10)</h4>
             <div className="h-32 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={lineData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                   <Tooltip contentStyle={{fontSize:'10px'}} />
                   <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{r: 2}} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalAnalytics;
