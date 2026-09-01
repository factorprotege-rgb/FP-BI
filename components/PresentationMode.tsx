import React, { useState } from 'react';
import { RiskData, CalculationResult } from '../types';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { 
  X, ChevronLeft, ChevronRight, Shield, CheckCircle2, AlertTriangle, 
  Clock, DollarSign, Users, Award, ShieldAlert, FileText, MapPin, 
  Map, Calendar, Layers, Activity, Lock, HelpCircle
} from 'lucide-react';
import { calculateDS209Risk, generateDS209Measures } from '../utils';

interface Props {
  onClose: () => void;
  data: RiskData;
  result: CalculationResult;
}

const PresentationMode: React.FC<Props> = ({ onClose, data, result }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>(result.details[0]?.id || '');
  const [selectedDimensionIdx, setSelectedDimensionIdx] = useState<number>(0);

  // --- ANALYSIS PREPARATION ---
  const ds209Result = calculateDS209Risk(data);
  const measures = generateDS209Measures(data);

  // Recharts Gauge / Pie Data for Resolution 1820
  const scoreRounded = Math.round(result.score);
  const scoreColor = scoreRounded >= 8 ? '#ef4444' : scoreRounded >= 5 ? '#f59e0b' : '#22c55e';
  const gaugeData = [
    { name: 'Riesgo 1820', value: result.score },
    { name: 'Restante', value: 10 - result.score },
  ];

  // Recharts Gauge / Pie Data for DS 209
  const ds209ScoreColor = ds209Result.classification === 'Alto' ? '#ef4444' : ds209Result.classification === 'Medio' ? '#f59e0b' : '#22c55e';
  const ds209GaugeData = [
    { name: 'Vulnerabilidad DS209', value: ds209Result.score },
    { name: 'Restante', value: 36 - ds209Result.score },
  ];

  const topFactors = [...result.details].sort((a, b) => b.contribution - a.contribution).slice(0, 5);
  const barData = topFactors.map(d => ({
    name: d.title.length > 18 ? d.title.substring(0, 18) + '...' : d.title,
    value: d.contributionPct,
    fill: d.value >= 8 ? '#ef4444' : d.value >= 5 ? '#f59e0b' : '#22c55e'
  }));

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
  };

  const getConclusionText = () => {
    if (result.classification === 'Alto') {
      return "Debido al Nivel de Riesgo ALTO (Resolución 1820) y Vulnerabilidad Crítica, la entidad DEBE implementar un Sistema de Vigilancia Privada con vigilantes armados y medidas reforzadas homologadas por el OS10 de Carabineros de Chile.";
    }
    if (result.classification === 'Medio') {
      return "Dada la clasificación de Riesgo MEDIO, se exige el cumplimiento mandatorio de medidas tecnológicas perimetrales y de control físico descritas en el DS 209 de manera inmediata para subsanar brechas vigentes.";
    }
    return "La entidad presenta un Nivel de Riesgo BAJO. No obstante, se diagnostican brechas operativas puntuales que se recomienda regularizar preventivamente ante auditorías de la autoridad fiscalizadora.";
  };

  const currentYear = new Date().getFullYear();

  // Helper mapping for interactive DS 209 dimensions
  const dimensionDetails = [
    {
      title: 'Valor de Activos',
      score: ds209Result.pActivos,
      desc: 'Suma de los recursos, mercancías, equipamiento y patrimonio material resguardado en la infraestructura bajo análisis.',
      items: [
        { label: 'Valor Estimado de Activos', value: formatCLP(data.valorActivos || 0) },
        { label: 'Retiro de Valores', value: data.retiroValores || 'No informado' },
        { label: 'Frecuencia de Retiro', value: data.frecuenciaRetiro || 'No informado' },
        { label: 'Activo Crítico Principal', value: data.activoCriticoPrincipal || 'No informado' }
      ]
    },
    {
      title: 'Afluencia de Personas',
      score: ds209Result.pPersonas,
      desc: 'Flujo de capital humano diario, incluyendo tanto la dotación contractual interna como el público general.',
      items: [
        { label: 'Afluencia Diaria Promedio', value: `${data.afluenciaDiaria || 0} personas` },
        { label: 'Dotación de Trabajadores', value: `${data.trabajadores || 0} personas` },
        { label: 'Horario Funcionamiento', value: data.horarioFuncionamiento || 'No informado' },
        { label: 'Horario Mayor Afluencia', value: data.horarioMayorAfluencia || 'No informado' }
      ]
    },
    {
      title: 'Flujo de Efectivo',
      score: ds209Result.pEfectivo,
      desc: 'Volumen monetario líquido circulante o transado de forma regular en cajas y bovedillas de la instalación.',
      items: [
        { label: 'Flujo de Efectivo Diario', value: formatCLP(data.flujoEfectivo || 0) },
        { label: 'Giro de la Entidad', value: data.tipoEntidad || 'No informado' }
      ]
    },
    {
      title: 'Factores de Entorno',
      score: ds209Result.pEntorno,
      desc: 'Ubicación geográfica de la instalación y variables delincuenciales de la comuna bajo análisis.',
      items: [
        { label: 'Clasificación de Entorno', value: data.clasificacionEntorno || 'No informado' },
        { label: 'Nivel Delictual del Sector', value: data.nivelDelictual || 'No informado' },
        { label: 'Entorno Urbano Comunal', value: data.entorno || 'No informado' },
        { label: 'Vías y Rutas de Escape', value: data.rutasEscape || 'No informado' },
        { label: 'Delitos Frecuentes', value: data.delitosFrecuentes || 'No informado' }
      ]
    },
    {
      title: 'Barreras Físicas',
      score: ds209Result.pVulFisica,
      desc: 'Obstáculos materiales concebidos para retardar, disuadir o impedir el ingreso no autorizado al predio.',
      items: [
        { label: 'Control de Acceso', value: data.tipoControlAcceso || 'No informado' },
        { label: 'Cierre Exterior', value: data.estadoCierre || 'No informado' },
        { label: 'Altura de Rejas', value: data.alturaRejas || 'No informado' },
        { label: 'Iluminación Perimetral', value: data.nivelIluminacion || 'No informado' },
        { label: 'Puntos Ciegos Detectados', value: `${data.cantidadPuntosCiegos || 0} sectores` }
      ]
    },
    {
      title: 'CCTV y Tecnología',
      score: ds209Result.pVulTec,
      desc: 'Sistemas electrónicos de videovigilancia, alarmas magnéticas y pre-alarmas de intrusión homologadas.',
      items: [
        { label: 'Vídeovigilancia CCTV', value: data.cctv === 'SI' ? 'Sí (Operativo)' : 'No cuenta con CCTV' },
        { label: 'Cámaras Instaladas', value: data.cctv === 'SI' ? `${data.cantidadCamaras || 0} unidades (${data.resolucionCamaras || 'S/I'})` : 'No aplica' },
        { label: 'Días de Respaldo DVR', value: data.cctv === 'SI' ? `${data.grabacionDias || 0} días continuos` : 'No aplica' },
        { label: 'Sistema de Alarma', value: data.alarma === 'SI' ? `Sí (${data.tipoAlarma || 'S/I'})` : 'No cuenta con Alarma' },
        { label: 'Monitoreo de Señal', value: data.monitoreo === 'SI' ? `Sí (Central: ${data.empresaMonitoreo || 'S/I'})` : 'No cuenta con Monitoreo' },
        { label: 'Tiempo de Respuesta CRA', value: data.monitoreo === 'SI' ? data.tiempoRespuesta || 'No informado' : 'No aplica' },
        { label: 'Sistemas Pre-Alarma / Disuasión', value: data.sistemasPrevAlarma || 'No informado' }
      ]
    },
    {
      title: 'Seguridad Humana',
      score: ds209Result.pVulHumana,
      desc: 'Personal acreditado para labores de control y vigilancia activa según disposiciones de Carabineros OS-10.',
      items: [
        { label: 'Dotación de Guardias', value: `${data.guardias || 0} guardias asignados` },
        { label: 'Turnos y Guardias', value: data.turnosGuardias || 'No informado' },
        { label: 'Acreditación OS-10 Activa', value: data.guardiasOS10 || 'No informado' },
        { label: 'Empresa Prestadora de Seguridad', value: data.empresaGuardias || 'No informado' },
        { label: 'Encargado de Seguridad Interno', value: data.encargadoSeguridad === 'SI' ? `Sí (${data.nombreEncargado || 'No nombrado'})` : 'No asignado' },
        { label: 'Medios de Comunicación', value: data.comunicaciones || 'No informado' }
      ]
    },
    {
      title: 'Protocolos de Reacción',
      score: ds209Result.pProtocolo,
      desc: 'Procedimientos de seguridad documentados y entrenados para regular el actuar del personal frente a contingencias e ilícitos.',
      items: [
        { label: 'Protocolo de Apertura', value: data.protocoloApertura === 'SI' ? 'Vigente y Documentado' : 'No cuenta con Protocolo' },
        { label: 'Protocolo de Cierre', value: data.protocoloCierre === 'SI' ? 'Vigente y Documentado' : 'No cuenta con Protocolo' },
        { label: 'Protocolo de Robo / Asalto', value: data.protocoloRobo === 'SI' ? 'Vigente y Documentado' : 'No cuenta con Protocolo' },
        { label: 'Protocolo de Emergencia / Alarma', value: data.protocoloAlarma === 'SI' ? 'Vigente y Documentado' : 'No cuenta con Protocolo' },
        { label: 'Protocolo de Control de Visitas', value: data.protocoloVisitas === 'SI' ? 'Vigente y Documentado' : 'No cuenta con Protocolo' },
        { label: 'Protocolo de Manejo de Valores', value: data.protocoloValores === 'SI' ? 'Vigente y Documentado' : 'No cuenta con Protocolo' },
        { label: 'Fecha Última Capacitación', value: data.capacitacionUltimaFecha || 'No informado' }
      ]
    }
  ];

  // DEFINICIÓN DE LOS 6 SLIDES DE ALTO CONTEXTO TÉCNICO
  const SLIDES = [
    // SLIDE 1: PORTADA CORPORATIVA
    {
      id: 1,
      bg: 'bg-slate-950',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in relative overflow-hidden">
          {/* Decorative grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
          
          <div className="relative z-10 max-w-5xl">
            <div className="w-24 h-24 bg-blue-600/10 border-2 border-blue-500/30 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl shadow-blue-500/20">
              <Shield className="w-12 h-12 text-blue-500" />
            </div>
            
            <h2 className="text-sm text-blue-400 font-bold uppercase tracking-[0.3em] mb-4">
              ESTUDIO TÉCNICO DE SEGURIDAD PRIVADA
            </h2>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight font-sans leading-none">
              {data.entidad || "ENTIDAD COMPORTANTE"}
            </h1>
            
            <div className="flex flex-wrap justify-center gap-4 text-slate-400 text-sm md:text-base font-mono bg-slate-900/40 p-3 rounded-xl border border-slate-800 backdrop-blur-sm shadow-inner max-w-3xl mx-auto">
              <span className="flex items-center gap-1.5 px-3 border-r border-slate-800 last:border-r-0">
                <MapPin className="w-4 h-4 text-blue-500" />
                {data.comuna || "S/I"}, CHILE
              </span>
              <span className="flex items-center gap-1.5 px-3 border-r border-slate-800 last:border-r-0">
                <FileText className="w-4 h-4 text-blue-500" />
                RUT: {data.rut || "S/I"}
              </span>
              <span className="flex items-center gap-1.5 px-3 last:border-r-0">
                <Calendar className="w-4 h-4 text-blue-500" />
                EVALUACIÓN: {currentYear}
              </span>
            </div>

            <div className="mt-12 flex justify-center gap-3">
              <span className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-xs rounded-full font-mono tracking-wider">
                MÁXIMA CONFIDENCIALIDAD
              </span>
              <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-full font-mono tracking-wider">
                LEY N° 21.659 DE SEGURIDAD PRIVADA
              </span>
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 2: DIAGNÓSTICO EJECUTIVO INTEGRADO
    {
      id: 2,
      bg: 'bg-slate-900',
      content: (
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-lg">
              <Layers className="w-5 h-5 text-blue-500" />
            </span>
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest">
              Diagnóstico Ejecutivo Consolidado
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Resolution 1820 gauge */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center justify-center relative shadow-xl backdrop-blur-sm">
              <span className="text-xs font-mono font-bold text-blue-400 mb-2">RESOLUCIÓN EXENTA N° 1.820</span>
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gaugeData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={95} paddingAngle={0} dataKey="value" stroke="none">
                      <Cell key="score" fill={scoreColor} />
                      <Cell key="remaining" fill="#1e293b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                  <span className="text-5xl font-extrabold text-white tracking-tighter">{result.score.toFixed(2)}</span>
                  <span className="text-xs text-slate-500 font-mono">PUNTOS</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-slate-400">Riesgo Penal / Normativo</span>
                <div className="mt-1 text-lg font-bold uppercase tracking-wide" style={{ color: scoreColor }}>
                  Riesgo {result.classification}
                </div>
              </div>
            </div>

            {/* DS 209 gauge */}
            <div className="lg:col-span-4 bg-slate-950/40 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center justify-center relative shadow-xl backdrop-blur-sm">
              <span className="text-xs font-mono font-bold text-indigo-400 mb-2">DECRETO SUPREMO N° 209</span>
              <div className="h-44 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ds209GaugeData} cx="50%" cy="50%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={95} paddingAngle={0} dataKey="value" stroke="none">
                      <Cell key="score" fill={ds209ScoreColor} />
                      <Cell key="remaining" fill="#1e293b" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                  <span className="text-5xl font-extrabold text-white tracking-tighter">{ds209Result.score}</span>
                  <span className="text-xs text-slate-500 font-mono">/ 36 PUNTOS</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-slate-400">Vulnerabilidad Física</span>
                <div className="mt-1 text-lg font-bold uppercase tracking-wide" style={{ color: ds209ScoreColor }}>
                  Grado {ds209Result.classification}
                </div>
              </div>
            </div>

            {/* Side summary panel */}
            <div className="lg:col-span-4 flex flex-col justify-between h-full bg-slate-950/20 p-4 rounded-2xl border border-slate-800/40">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white">Análisis de Exposición</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  La correlación científica entre la <strong>Matriz de Incidencia (RE 1820)</strong> y el <strong>Diagnóstico de Planta (DS 209)</strong> revela que frente a factores exógenos delictuales del entorno, la infraestructura actual presenta una robustez que requiere mejoras normativas urgentes.
                </p>
              </div>

              <div className="mt-6 flex items-start gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800 shadow-inner">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Aviso Normativo</span>
                  <span className="text-[11px] text-slate-400 block font-light">
                    Carabineros de Chile y OS10 fiscalizarán el cumplimiento de los cierres, tecnologías de grabación y las directivas de seguridad basadas en estos ponderados.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 3: MATRIZ DE RIESGOS - DETALLADA (RESOLUCIÓN EXENTA N° 1.820)
    {
      id: 3,
      bg: 'bg-slate-950',
      content: (
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-rose-600/10 border border-rose-500/30 rounded-lg">
                <Activity className="w-5 h-5 text-rose-500" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-rose-400 uppercase tracking-widest">
                  Matriz de Riesgo Reglamentaria
                </h2>
                <span className="text-xs text-slate-400 block">Factores de Estimación - Res. Exenta N° 1.820</span>
              </div>
            </div>
            
            <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-bold rounded">
              Puntaje: {result.score.toFixed(2)} / 10.00
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[62vh] items-stretch">
            {/* 12 Indicators Grid */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {result.details.map((indicator, index) => {
                const isSelected = indicator.id === selectedIndicatorId;
                const itemColor = indicator.value >= 8 ? 'text-red-400 border-red-950 hover:bg-red-950/20' : 
                                  indicator.value >= 5 ? 'text-amber-400 border-amber-950 hover:bg-amber-950/20' : 
                                  'text-green-400 border-green-950 hover:bg-green-950/20';
                const indicatorBg = isSelected 
                  ? (indicator.value >= 8 ? 'bg-red-950/40 border-red-500' : indicator.value >= 5 ? 'bg-amber-950/40 border-amber-500' : 'bg-green-950/40 border-green-500') 
                  : (indicator.value >= 8 ? 'bg-red-500/5' : indicator.value >= 5 ? 'bg-amber-500/5' : 'bg-green-500/5');
                const barFill = indicator.value >= 8 ? 'bg-red-500' : 
                                indicator.value >= 5 ? 'bg-amber-500' : 
                                'bg-green-500';

                return (
                  <button 
                    key={indicator.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedIndicatorId(indicator.id); }}
                    className={`border text-left p-3 rounded-xl transition duration-200 flex flex-col justify-between cursor-pointer outline-none focus:ring-1 focus:ring-slate-700 ${itemColor} ${indicatorBg}`}
                  >
                    <div className="w-full">
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-500 block font-bold">FACTOR {index + 1}</span>
                        <span className={`text-[11px] font-bold font-mono px-1.5 py-0.5 rounded ${indicator.value >= 8 ? 'bg-red-500/30 text-red-200' : indicator.value >= 5 ? 'bg-amber-500/30 text-amber-200' : 'bg-green-500/30 text-green-200'}`}>
                          {indicator.value}/10
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-200 leading-tight mb-2 line-clamp-2">
                        {indicator.title}
                      </h4>
                    </div>

                    <div className="w-full">
                      {/* Visual bar */}
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-1">
                        <div className={`h-full ${barFill}`} style={{ width: `${indicator.value * 10}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono">
                        <span>Pág. OS10</span>
                        <span>Cont.: {indicator.contributionPct.toFixed(1)}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Indicator Detail Side Panel */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {(() => {
                const selectedInd = result.details.find(d => d.id === selectedIndicatorId) || result.details[0];
                if (!selectedInd) return <p className="text-xs text-slate-500">Seleccione un factor de la matriz.</p>;
                
                const valColor = selectedInd.value >= 8 ? 'text-red-400' : selectedInd.value >= 5 ? 'text-amber-400' : 'text-green-400';
                
                // Fetch observations helper
                const obsObject = data.observations || {};
                const evObject = data.evidenceRefs || {};
                
                const userObservation = obsObject[selectedInd.id] || 
                                        "Sin hallazgos específicos registrados. El valor calculado representa la ponderación directa según el cumplimiento del estándar normativo.";
                const userEvidence = evObject[selectedInd.id] || 
                                     "Se valida visualmente y mediante revisión documental en terreno.";

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-mono font-bold text-slate-500">DETALLE DE ESTIMACIÓN</span>
                      <span className={`text-sm font-mono font-extrabold ${valColor}`}>
                        {selectedInd.value.toFixed(1)} / 10.0
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white mb-2 leading-snug">
                        {selectedInd.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-light mb-3">
                        Este factor evalúa la disponibilidad reglamentaria y la necesidad estructural del resguardo físico de la instalación según lineamientos de Carabineros.
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800/50">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-blue-400 block mb-1">Hallazgos & Observaciones de Campo:</span>
                        <div className="bg-slate-950/60 border border-slate-800/60 p-3 rounded-lg text-xs text-slate-300 font-light leading-relaxed max-h-[15vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                          {userObservation}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-400 block mb-1">Evidencia Registrada:</span>
                        <p className="text-xs font-mono text-slate-400 bg-slate-950/30 border border-slate-800/40 p-2.5 rounded-lg">
                          <span className="font-bold text-slate-500 mr-1">REF:</span> {userEvidence}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-xl space-y-1 text-[11px] font-mono text-slate-500">
                      <div className="flex justify-between">
                        <span>Ponderación factor:</span>
                        <span className="text-slate-300">{selectedInd.weight.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Aporte al Riesgo Final:</span>
                        <span className="text-slate-300">{selectedInd.contributionPct.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="mt-3 bg-slate-900/60 border border-slate-800 p-2 rounded-xl flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-light">
              La Matriz de Riesgo utiliza 12 indicadores ponderados de acuerdo a la matriz oficial 1820 de estimación de medidas de seguridad privada de Carabineros de Chile.
            </span>
          </div>
        </div>
      )
    },

    // SLIDE 4: MATRIZ DE VULNERABILIDADES - DETALLADA (DECRETO SUPREMO N° 209)
    {
      id: 4,
      bg: 'bg-slate-900',
      content: (
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-600/10 border border-indigo-500/30 rounded-lg">
                <Lock className="w-5 h-5 text-indigo-500" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-widest">
                  Matriz de Vulnerabilidad Física
                </h2>
                <span className="text-xs text-slate-400 block">Evaluación de Defensa en Profundidad - Decreto Supremo N° 209</span>
              </div>
            </div>
            
            <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold rounded">
              Puntaje: {ds209Result.score} / 36
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[62vh] items-stretch">
            {/* 8 Vulnerability Dimensions Bento Grid */}
            <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-3 overflow-y-auto pr-1">
              {dimensionDetails.map((dim, i) => {
                const isSelected = i === selectedDimensionIdx;
                const isCrit = dim.score >= 3.5;
                const isMod = dim.score >= 2.5;
                const statusText = isCrit ? 'CRÍTICO' : isMod ? 'MODERADO' : 'BAJO';
                const statusColor = isCrit ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                                    isMod ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
                                    'text-green-400 bg-green-500/10 border-green-500/20';
                const barFill = isCrit ? 'bg-red-500' : isMod ? 'bg-amber-500' : 'bg-green-500';
                
                const bgSelectionClass = isSelected 
                  ? (isCrit ? 'bg-red-950/40 border-red-500' : isMod ? 'bg-amber-950/40 border-amber-500' : 'bg-green-950/40 border-green-500')
                  : 'bg-slate-950/50 hover:bg-slate-950/80 border border-slate-800/80 hover:border-slate-700/80';

                return (
                  <button 
                    key={i} 
                    onClick={(e) => { e.stopPropagation(); setSelectedDimensionIdx(i); }}
                    className={`border text-left p-3.5 rounded-xl transition flex flex-col justify-between cursor-pointer outline-none focus:ring-1 focus:ring-slate-700 ${bgSelectionClass}`}
                  >
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">DIM. 0{i+1}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white mb-2 leading-tight">
                        {dim.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 leading-snug mb-3 font-light line-clamp-2">
                        {dim.desc}
                      </p>
                    </div>

                    <div className="w-full">
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-300 mb-1">
                        <span>Vulnerabilidad:</span>
                        <span>{dim.score.toFixed(1)} / 4.0</span>
                      </div>
                      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full ${barFill}`} style={{ width: `${(dim.score / 4) * 100}%` }}></div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Dimension Detail Side Panel */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {(() => {
                const currentDim = dimensionDetails[selectedDimensionIdx];
                if (!currentDim) return <p className="text-xs text-slate-500">Seleccione una dimensión para auditar.</p>;
                
                const valColor = currentDim.score >= 3.5 ? 'text-red-400' : currentDim.score >= 2.5 ? 'text-amber-400' : 'text-green-400';

                const dimPhotoKeys: Record<number, string[]> = {
                  3: ['entorno', 'rutasEscape', 'delitosFrecuentes'],
                  4: ['controlAccesos', 'cierrePerimetral', 'puntosCiegos'],
                  5: ['sistemasPrevAlarma'],
                  7: ['observaciones']
                };

                const activeDimPhotos = (dimPhotoKeys[selectedDimensionIdx] || [])
                  .map(key => ({ key, url: data.vulnerabilityPhotos?.[key] }))
                  .filter(p => !!p.url);

                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <span className="text-xs font-mono font-bold text-slate-500">DIAGNÓSTICO EN PLANTA</span>
                      <span className={`text-sm font-mono font-extrabold ${valColor}`}>
                        {currentDim.score.toFixed(1)} / 4.0
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-white mb-1.5 leading-none">
                        {currentDim.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                        {currentDim.desc}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-800/50">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-indigo-400 block mb-1">Respuestas Declaradas:</span>
                      
                      <div className="space-y-2 max-h-[18vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                        {currentDim.items.map((item, idx) => (
                          <div key={idx} className="bg-slate-950/50 border border-slate-800/40 p-2 rounded-lg space-y-0.5">
                            <span className="text-[10px] text-slate-500 font-medium block">{item.label}</span>
                            <span className="text-xs text-white font-semibold font-mono">{item.value || 'S/I'}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeDimPhotos.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-slate-800/50">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 block mb-1">Fotografías de Terreno:</span>
                        <div className="grid grid-cols-2 gap-2 max-h-[14vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                          {activeDimPhotos.map((p, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-800/50 bg-slate-950/50 h-16 group">
                              <img src={p.url} className="w-full h-full object-cover" alt="Evidencia" referrerPolicy="no-referrer" />
                              <div className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-1.5 py-0.5 text-[8px] font-mono font-bold text-slate-300 truncate">
                                {p.key === 'controlAccesos' ? 'Ctrl. Accesos' :
                                 p.key === 'cierrePerimetral' ? 'Cierre Perim.' :
                                 p.key === 'puntosCiegos' ? 'Puntos Ciegos' :
                                 p.key === 'sistemasPrevAlarma' ? 'Prev. Alarma' :
                                 p.key === 'entorno' ? 'Entorno Urb.' :
                                 p.key === 'rutasEscape' ? 'Rutas Escape' :
                                 p.key === 'delitosFrecuentes' ? 'Delit. Frec.' :
                                 p.key === 'observaciones' ? 'Obs. Campo' : p.key}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-slate-400">
                      <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Análisis Técnico de Seguridad y Vulnerabilidades alineado al Decreto Supremo N° 209.</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 5: PLAN DE ACCIÓN Y MEDIDAS CORRECTIVAS
    {
      id: 5,
      bg: 'bg-slate-950',
      content: (
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center px-6 py-4">
          <div className="flex items-center gap-3 mb-6">
            <span className="p-2 bg-amber-600/10 border border-amber-500/30 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest">
                Plan de Mitigación Reglamentario
              </h2>
              <span className="text-xs text-slate-400 block">Medidas de Cumplimiento Exigibles según Diagnóstico Técnico</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* List of measures (up to 3 biggest) */}
            <div className="lg:col-span-7 space-y-3 max-h-[58vh] overflow-y-auto pr-1">
              {measures.slice(0, 3).map((m, idx) => {
                const badgeColor = m.prioridad === 'ALTA' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 
                                   m.prioridad === 'MEDIA' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 
                                   'bg-green-500/20 text-green-300 border-green-500/30';
                return (
                  <div key={idx} className="bg-slate-900/40 hover:bg-slate-900/60 transition border border-slate-800 p-4 rounded-xl flex items-start gap-3">
                    <span className="p-1 text-xs font-mono font-bold bg-slate-800 text-slate-300 rounded shrink-0">
                      0{idx+1}
                    </span>
                    <div className="space-y-1 bg-transparent border-0 grow">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">{m.dimension}</span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                          PRIORIDAD {m.prioridad}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{m.articulo}</h4>
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed font-light">
                        <strong>Medida:</strong> {m.medida}
                      </p>
                    </div>
                  </div>
                );
              })}
              {measures.length === 0 && (
                <div className="bg-slate-900/20 border border-slate-800/60 p-6 rounded-xl text-center text-slate-400 font-light">
                  No se registran brechas críticas de seguridad pendientes de mitigación.
                </div>
              )}
            </div>

            {/* Timelines and responsibility indicators */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/45 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
              <h3 className="text-xl font-bold text-white mb-3">Plazos Sugeridos</h3>
              <p className="text-xs text-slate-400 font-light leading-relaxed mb-6">
                Para evitar multas o reparos por parte de la Jefatura OS10 de Carabineros de Chile, se recomienda a la mesa del directiva cumplir con las siguientes ventanas temporales de ejecución técnica:
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/10 border border-red-500/20 rounded-full flex items-center justify-center font-bold text-xs font-mono text-red-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-300 block">Medidas Prioridad ALTA</span>
                    <span className="text-xs text-slate-400 font-mono font-bold">Plazo Máximo: 10 a 15 días hábiles</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-600/10 border border-amber-500/20 rounded-full flex items-center justify-center font-bold text-xs font-mono text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-300 block">Medidas Prioridad MEDIA</span>
                    <span className="text-xs text-slate-400 font-mono font-bold">Plazo Máximo: 30 días corridos</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 pt-4 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                  Responsable Legal: {data.representanteLegal || "NO INFORMADO"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    },

    // SLIDE 6: VERDICTO LEGAL Y CIERRE DE INSPECCIÓN
    {
      id: 6,
      bg: result.classification === 'Alto' ? 'bg-red-950' : result.classification === 'Medio' ? 'bg-amber-950' : 'bg-green-950',
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-zoom-in relative overflow-hidden">
          {/* subtle grid overlay matching background frame */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-35"></div>

          <div className="relative z-10 max-w-4xl">
            <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 mx-auto border-4 ${
              result.classification === 'Alto' ? 'bg-red-900 border-red-500 text-red-200 shadow-2xl shadow-red-500/30' :
              result.classification === 'Medio' ? 'bg-amber-900 border-amber-500 text-amber-200 shadow-2xl shadow-amber-500/30' :
              'bg-green-900 border-green-500 text-green-200 shadow-2xl shadow-green-500/30'
            }`}>
              <Award className="w-14 h-14" />
            </div>
            
            <h2 className="text-lg text-white/80 font-bold uppercase tracking-widest mb-2 font-mono">
              Veredicto Normativo Ley N° 21.659
            </h2>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tighter leading-none">
              {result.classification !== 'Bajo' ? 'ENTIDAD OBLIGADA' : 'NO OBLIGADA'}
            </h1>
            
            <div className="max-w-3xl mx-auto bg-black/40 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-sm shadow-2xl">
              <p className="text-base md:text-xl text-slate-200 leading-relaxed font-light">
                {getConclusionText()}
              </p>
            </div>

            {/* Signature Block */}
            <div className="mt-8 flex flex-col items-center justify-center">
              {data.signature ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm shadow-lg max-w-sm flex flex-col items-center">
                  <img src={data.signature} alt="Firma Evaluador" className="h-14 object-contain invert mix-blend-screen opacity-90" />
                  <div className="w-24 h-[1px] bg-slate-700 my-1"></div>
                  <span className="text-[10px] text-slate-400 font-mono block">FIRMADO ELECTRÓNICAMENTE</span>
                  <span className="text-[11px] text-white font-bold font-mono uppercase block">{data.auditorName || "S/I"}</span>
                </div>
              ) : (
                <div className="border border-dashed border-white/30 rounded-xl px-5 py-3 text-white/60 font-mono text-xs">
                  Sello Certificación Técnico Legal FACTOR PROTEGE
                </div>
              )}
            </div>

            <button 
              onClick={onClose}
              className="mt-10 px-8 py-3.5 bg-white hover:bg-slate-200 text-slate-950 font-bold text-base rounded-full shadow-2xl transition transform hover:scale-105"
            >
              Finalizar Visualización
            </button>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div id="presentation-panel" className="fixed inset-0 z-[200] bg-slate-950 text-white font-sans overflow-hidden select-none">
      {/* Dynamic Slide Background with Smooth Transition */}
      <div className={`absolute inset-0 transition-colors duration-700 ease-in-out ${SLIDES[currentSlide].bg}`}></div>
      
      {/* Top Header / Close Button */}
      <div className="absolute top-6 right-6 z-10 flex gap-4">
        <button 
          onClick={onClose} 
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white text-xs font-semibold bg-black/30 border border-slate-800 rounded-lg hover:bg-black/65 transition backdrop-blur-sm"
        >
          <X className="w-3.5 h-3.5" />
          Cerrar Presentación
        </button>
      </div>

      {/* Main Slide Panel Area (Click anywhere to advance) */}
      <div className="relative z-0 w-full h-full" onClick={(e) => {
         // Click anywhere to advance, unless it's a button, img or anchor
         const target = e.target as HTMLElement;
         if (target.tagName !== 'BUTTON' && target.tagName !== 'A' && target.tagName !== 'IMG') {
           nextSlide();
         }
      }}>
        {SLIDES[currentSlide].content}
      </div>

      {/* Navigation Controls Overlay */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-between items-center px-8 md:px-12 z-10 pointer-events-none">
        
        {/* Previous Arrow Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className={`p-3 rounded-full bg-black/20 hover:bg-white/10 border border-transparent hover:border-white/10 text-white transition pointer-events-auto ${currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Progress Dots */}
        <div className="flex items-center gap-3.5 pointer-events-auto bg-black/40 px-5 py-2.5 bg-opacity-40 border border-slate-800 rounded-full backdrop-blur-sm shadow-xl">
          {SLIDES.map((_, idx) => (
            <button 
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(idx); }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-blue-500 w-7' : 'bg-slate-600 hover:bg-slate-400'}`}
            />
          ))}
        </div>

        {/* Next Arrow Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className="p-3 rounded-full bg-black/20 hover:bg-white/10 border border-transparent hover:border-white/10 text-white transition pointer-events-auto"
        >
          {currentSlide === SLIDES.length - 1 ? (
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          ) : (
            <ChevronRight className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default PresentationMode;
