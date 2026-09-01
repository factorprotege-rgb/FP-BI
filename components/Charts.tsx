
import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from 'recharts';
import { CalculationResult } from '../types';

interface Props {
  result: CalculationResult;
  containerId?: string;
}

const Charts: React.FC<Props> = ({ result, containerId }) => {
  
  // 1. Gauge Data (Global Score)
  const gaugeData = [
    { name: 'Riesgo Actual', value: result.score },
    { name: 'Brecha', value: 10 - result.score },
  ];

  // 2. Bar Data (Top 5 Contributors) - ELIMINADO TRUNCADO DE TEXTO
  const barData = result.details.slice(0, 6).map(d => ({
    name: d.title, // Nombre completo sin puntos suspensivos
    pct: Number(d.contributionPct.toFixed(1)),
    value: d.contribution,
    fill: d.value >= 8 ? '#d93025' : d.value >= 5 ? '#f9ab00' : '#1e8e3e'
  }));

  // 3. Radar Data (Dimensions of Risk)
  const categories = {
    'Entorno Delictual': ['victimizacion', 'coberturaPolicial', 'patrullajeMunicipal', 'vulnerabilidad', 'rutasEscape'],
    'Operación Interna': ['efectivo', 'horario', 'aforo', 'publico', 'cualidades'],
    'Estratégico': ['rubro', 'criticidad']
  };

  const radarData = Object.entries(categories).map(([catName, ids]) => {
    const detailsInCat = result.details.filter(d => ids.includes(d.id));
    const avg = detailsInCat.reduce((acc, curr) => acc + curr.value, 0) / (detailsInCat.length || 1);
    return {
      subject: catName,
      A: Number(avg.toFixed(1)),
      fullMark: 10
    };
  });

  const sourceData = [
    { name: 'Factores Internos', value: Number((result.details.filter(d => !['victimizacion', 'coberturaPolicial', 'patrullajeMunicipal', 'vulnerabilidad', 'rutasEscape'].includes(d.id)).reduce((a,b)=>a+b.contribution,0) / result.details.reduce((a,b)=>a+b.contribution,0)*100).toFixed(1)) },
    { name: 'Factores Externos', value: Number((result.details.filter(d => ['victimizacion', 'coberturaPolicial', 'patrullajeMunicipal', 'vulnerabilidad', 'rutasEscape'].includes(d.id)).reduce((a,b)=>a+b.contribution,0) / result.details.reduce((a,b)=>a+b.contribution,0)*100).toFixed(1)) },
  ];

  const scoreRounded = Math.round(result.score);
  const scoreColor = scoreRounded >= 8 ? '#d93025' : scoreRounded >= 5 ? '#f9ab00' : '#1e8e3e';

  return (
    <div id={containerId} className="space-y-6 mb-8 bg-white dark:bg-[#202124] p-8 rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-sm">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Dashboard de Análisis de Riesgo</h3>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Visualización Técnica Legal (RE 1820)</p>
        </div>
        <div className={`px-6 py-2 rounded-2xl border-2 font-black text-lg ${result.classification === 'Alto' ? 'bg-red-50 border-red-500 text-red-600' : result.classification === 'Medio' ? 'bg-amber-50 border-amber-500 text-amber-600' : 'bg-green-50 border-green-500 text-green-600'}`}>
          RIESGO {result.classification.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gauge Score */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Puntaje Ponderado</span>
          <div className="w-full h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={gaugeData} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={65} outerRadius={90} paddingAngle={0} dataKey="value" stroke="none">
                  <Cell key="score" fill={scoreColor} />
                  <Cell key="remaining" fill="#e2e8f0" opacity={0.2} />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-5xl font-black text-slate-800 dark:text-white">{result.score.toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-400">PUNTOS</span>
            </div>
          </div>
        </div>

        {/* Radar Dimensions */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Dimensiones Operativas</span>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.2} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Radar name="Nivel" dataKey="A" stroke="#1a73e8" fill="#1a73e8" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Internal vs External */}
        <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">Origen de la Amenaza</span>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                  <Cell key="int" fill="#1a73e8" />
                  <Cell key="ext" fill="#34a853" />
                </Pie>
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* FACTORES CRÍTICOS - BARRAS SIN TRUNCADO */}
      <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 block">Factores con Mayor Incidencia en el Riesgo (%)</span>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={barData} margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              {/* SE AUMENTÓ EL ANCHO DEL EJE Y A 260px PARA SOPORTAR NOMBRES COMPLETOS */}
              <YAxis 
                dataKey="name" 
                type="category" 
                width={260} 
                tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} 
                interval={0}
              />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
              <Bar dataKey="pct" radius={[0, 8, 8, 0]} barSize={22}>
                {barData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Charts);
