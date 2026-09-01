
import React, { useState, useEffect, useCallback } from 'react';
import { INDICATORS, COMUNAS_RANKING } from './constants';
import { RiskData, CalculationResult, ReportState, AuditRecord, AIReportConfig, UserRole, AuditStatus } from './types';
import { calculateScore, getVulnerabilityFromComuna, getPatrullajeFromComuna, validateRut, formatRut, getGeolocation } from './utils';
import IndicatorInput from './components/IndicatorInput';
import Charts from './components/Charts';
import DigitalSignature from './components/DigitalSignature';
import Login from './components/Login';
import AuditManager from './components/AuditManager';
import AIConfigPanel from './components/AIConfigPanel'; 
import PresentationMode from './components/PresentationMode';
import WelcomeScreen from './components/WelcomeScreen';
import SentryGuardLogo from './components/SentryGuardLogo'; 
import TutorialPlayer from './components/TutorialPlayer'; 
import { generateTechnicalReport } from './services/geminiService';
import { generatePDFBlob } from './services/pdfService';
import { saveAuditToCloud, subscribeToAudits, deleteAuditFromCloud } from './services/firebaseService';

const INITIAL_DATA: RiskData = {
  entidad: '', rut: '', representanteLegal: '', medidasExistentes: '', giro: '', comuna: '', direccion: '', coords: '', evidencias: '', notas: '',
  auditorName: '',
  observations: {},
  evidenceRefs: {},
  signature: undefined,
  companyLogo: undefined
};

const INITIAL_AI_CONFIG: AIReportConfig = {
  focus: 'balanced',
  businessContext: '',
  websiteUrl: '',
  crimeStats: '',
  surroundings: '',
  historicalContext: ''
};

INDICATORS.forEach(ind => {
  // @ts-ignore
  if (ind.type.startsWith('aditivo')) INITIAL_DATA[ind.id] = [];
  // @ts-ignore
  else INITIAL_DATA[ind.id] = 1;
  INITIAL_DATA.observations[ind.id] = '';
  INITIAL_DATA.evidenceRefs[ind.id] = '';
});

const STEPS = [
  { id: 1, title: 'Identificación', icon: '🏢' },
  { id: 2, title: 'Matriz Normativa', icon: '📝' },
  { id: 3, title: 'Análisis de Riesgo', icon: '📊' },
  { id: 4, title: 'Estudio de Seguridad', icon: '📄' }
];

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('consultant');
  const [showWelcome, setShowWelcome] = useState(true); 
  const [activeStep, setActiveStep] = useState(1);
  const [activeIndicatorIndex, setActiveIndicatorIndex] = useState(0); 
  const [showPresentation, setShowPresentation] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false); 
  const [showAuditManager, setShowAuditManager] = useState(false);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [data, setData] = useState<RiskData>(INITIAL_DATA);
  const [result, setResult] = useState<CalculationResult>(calculateScore(data));
  const [report, setReport] = useState<ReportState>({ loading: false, content: null, error: null, isEditing: false, config: INITIAL_AI_CONFIG });

  useEffect(() => {
    const savedUser = localStorage.getItem('fp_user');
    const savedRole = localStorage.getItem('fp_role') as UserRole;
    if (savedUser) {
      setCurrentUser(savedUser);
      if (savedRole) setUserRole(savedRole);
    }
    const unsubscribe = subscribeToAudits(setAudits);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const html = document.querySelector('html');
    if (isDarkMode) html?.classList.add('dark');
    else html?.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    setResult(calculateScore(data));
  }, [data]);

  const handleLogin = (username: string, role: UserRole) => {
    setCurrentUser(username);
    setUserRole(role);
    localStorage.setItem('fp_user', username);
    localStorage.setItem('fp_role', role);
    setShowWelcome(true);
  };

  const handleInputChange = useCallback((key: string, value: any) => setData(prev => ({ ...prev, [key]: value })), []);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setData(prev => ({ ...prev, [name]: value })); };

  const handleObservationChange = useCallback((id: string, val: string) => {
    setData(prev => ({
      ...prev,
      observations: { ...prev.observations, [id]: val }
    }));
  }, []);

  const handleEvidenceChange = useCallback((id: string, val: string) => {
    setData(prev => ({
      ...prev,
      evidenceRefs: { ...prev.evidenceRefs, [id]: val }
    }));
  }, []);

  const handleNextStep = () => {
    if (activeStep === 1 && (!data.entidad || !data.rut)) return alert("Complete los datos de identificación.");
    setActiveStep(prev => Math.min(prev + 1, STEPS.length));
    window.scrollTo(0, 0);
  };
  const handlePrevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const nextIndicator = () => {
    if (activeIndicatorIndex < INDICATORS.length - 1) {
      setActiveIndicatorIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleNextStep();
    }
  };

  const prevIndicator = () => {
    if (activeIndicatorIndex > 0) {
      setActiveIndicatorIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handlePrevStep();
    }
  };

  const startNewAudit = () => {
    const newId = uuid();
    setData({...INITIAL_DATA, auditorName: currentUser || ''});
    setCurrentAuditId(newId);
    setActiveStep(1);
    setActiveIndicatorIndex(0);
  };

  const loadHighRiskDemo = () => {
    const demoData: Partial<RiskData> = {
      entidad: 'Centro Logístico Estratégico - Quilicura',
      rut: '76.888.111-K',
      representanteLegal: 'Marcos Soto Aguilar',
      giro: 'Bodegaje y Almacenamiento Estratégico',
      comuna: 'Quilicura',
      direccion: 'Av. Américo Vespucio 1500',
      medidasExistentes: 'Cerco eléctrico perimetral, 2 Guardias 24/7, Sistema de alarmas básico.',
      observations: {
        rubro: 'Operación logística masiva.',
        efectivo: 'Manejo de valores en sitio por recaudación de fletes.',
        victimizacion: '2 eventos registrados en último semestre.',
        cualidades: 'Productos electrónicos de alto valor.',
        vulnerabilidad: 'Colinda con sitio eriazo y autopista.',
        rutasEscape: 'Conexión inmediata a Vespucio Norte.'
      },
      rubro: 6, 
      criticidad: ['Servicio esencial', 'Sector estratégico'], 
      victimizacion: 6, 
      efectivo: 10, 
      cualidades: ['Alto valor comercial', 'Fácilmente transportable'], 
      horario: ['Nocturno', 'Días inhábiles'], 
      aforo: 4, 
      publico: 5, 
      coberturaPolicial: 8, 
      patrullajeMunicipal: 5, 
      vulnerabilidad: 10, 
      rutasEscape: ['Autopista'] 
    };
    setData(prev => ({ ...prev, ...demoData }));
    setActiveStep(2);
    setActiveIndicatorIndex(0);
    alert("Datos de demostración cargados satisfactoriamente.");
  };

  if (showPresentation) return <PresentationMode onClose={() => setShowPresentation(false)} data={data} result={result} />;
  if (showTutorial) return <TutorialPlayer onClose={() => setShowTutorial(false)} />;
  if (!currentUser) return <Login onLogin={handleLogin} />;
  if (showWelcome) return <WelcomeScreen onStart={() => setShowWelcome(false)} userRole={userRole} userName={currentUser} />;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#202124] text-slate-300' : 'bg-[#f8f9fa] text-slate-800'}`}>
      
      <AuditManager 
        isOpen={showAuditManager} onClose={() => setShowAuditManager(false)}
        audits={audits} currentAuditId={currentAuditId}
        onLoad={id => {
          const rec = audits.find(a => a.id === id);
          if (rec) {
            setData(rec);
            setCurrentAuditId(rec.id);
            setActiveStep(1);
            setActiveIndicatorIndex(0);
          }
          setShowAuditManager(false);
        }}
        onCreate={() => { startNewAudit(); setShowAuditManager(false); }}
        onDelete={deleteAuditFromCloud} onImport={() => {}} onExport={() => {}}
      />

      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${isDarkMode ? 'bg-[#202124] border-[#3c4043]' : 'bg-white border-slate-200'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAuditManager(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowWelcome(true)}>
              <SentryGuardLogo className="h-7 w-auto" />
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <h1 className="text-base font-medium tracking-tight text-slate-600 dark:text-slate-200 hidden sm:block">Estudios de Seguridad 21.659</h1>
            </div>
          </div>

          <div className="flex-1 max-w-xl hidden lg:flex justify-center">
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#303134] p-1 rounded-full w-full">
                {STEPS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-full text-[11px] font-bold transition-all ${activeStep === s.id ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500'}`}
                  >
                    <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] ${activeStep >= s.id ? 'bg-brand-500 text-white' : 'bg-slate-300 dark:bg-slate-600'}`}>{s.id}</span>
                    {s.title}
                  </button>
                ))}
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={() => setShowTutorial(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-google-blue" title="Ver Tutorial"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" /></svg></button>
             <button onClick={() => setShowPresentation(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500" title="Modo Presentación"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">{isDarkMode ? '☀️' : '🌙'}</button>
             {userRole === 'consultant' && (
                <button onClick={loadHighRiskDemo} className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-full text-xs font-bold hover:bg-brand-100 transition hidden sm:block">Demo</button>
             )}
             <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold ml-2 shadow-sm">{currentUser?.charAt(0)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-8 pb-32">
        {activeStep === 1 && (
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
            <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-10 shadow-sm">
              <h2 className="text-2xl font-medium mb-8 text-slate-800 dark:text-white flex items-center gap-4">
                <span className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-lg font-bold">1</span>
                Individualización de la Entidad
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Razón Social</label>
                  <input name="entidad" value={data.entidad} onChange={handleTextChange} placeholder="Ej: Banco Global S.A." className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">RUT Corporativo</label>
                  <input name="rut" value={data.rut} onChange={handleTextChange} placeholder="76.000.000-K" className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Representante Legal</label>
                  <input name="representanteLegal" value={data.representanteLegal} onChange={handleTextChange} placeholder="Nombre completo" className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Comuna</label>
                  <input list="comunas-list" name="comuna" value={data.comuna} onChange={handleTextChange} placeholder="Seleccione..." className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                  <datalist id="comunas-list">{Object.keys(COMUNAS_RANKING).sort().map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Medidas de Seguridad Existentes (Resumen)</label>
                  <textarea name="medidasExistentes" value={data.medidasExistentes} onChange={handleTextChange} placeholder="CCTV, Guardias (N°), Alarma, etc..." className="w-full px-5 py-4 google-input rounded-2xl outline-none min-h-[100px]" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Dirección Instalación</label>
                  <div className="flex gap-3">
                    <input name="direccion" value={data.direccion} onChange={handleTextChange} placeholder="Calle y Número" className="flex-1 px-5 py-4 google-input rounded-2xl outline-none" />
                    <button onClick={() => getGeolocation().then(c => handleInputChange('coords', c))} className="px-6 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition">📍</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="max-w-4xl mx-auto animate-slide-up">
            <div className="mb-8 flex items-center justify-between px-4">
               <div>
                 <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Matriz Normativa</h2>
                 <p className="text-xs text-slate-500 mt-1">Factor {activeIndicatorIndex + 1} de {INDICATORS.length}</p>
               </div>
               <div className="flex gap-1">
                 {INDICATORS.map((_, i) => (
                   <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndicatorIndex ? 'w-8 bg-brand-500' : i < activeIndicatorIndex ? 'w-2 bg-brand-200' : 'w-2 bg-slate-200'}`} />
                 ))}
               </div>
            </div>

            <IndicatorInput
              indicator={INDICATORS[activeIndicatorIndex]}
              value={data[INDICATORS[activeIndicatorIndex].id] as any}
              onChange={val => handleInputChange(INDICATORS[activeIndicatorIndex].id, val)}
              observation={data.observations[INDICATORS[activeIndicatorIndex].id]}
              onObservationChange={val => handleObservationChange(INDICATORS[activeIndicatorIndex].id, val)}
              evidence={data.evidenceRefs[INDICATORS[activeIndicatorIndex].id] || ''}
              onEvidenceChange={val => handleEvidenceChange(INDICATORS[activeIndicatorIndex].id, val)}
              isActive={true}
            />

            <div className="flex gap-4 mt-10">
               <button onClick={prevIndicator} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition hover:bg-slate-200">
                 {activeIndicatorIndex === 0 ? 'Volver a Identificación' : 'Anterior'}
               </button>
               <button onClick={nextIndicator} className="flex-[2] py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-google transition">
                 {activeIndicatorIndex === INDICATORS.length - 1 ? 'Finalizar Matriz' : 'Siguiente Factor →'}
               </button>
            </div>
          </div>
        )}

        {/* CONTENEDOR DE GRÁFICOS: Se mantiene accesible para html2canvas incluso en el paso 4 */}
        <div 
          id="charts-container-wrapper" 
          className={
            activeStep === 3 
              ? "block animate-slide-up" 
              : (activeStep === 4 ? "fixed top-0 left-[-9999px] w-[1000px] opacity-100 z-[-1] pointer-events-none" : "hidden")
          }
        >
          <Charts result={result} containerId="charts-container" />
        </div>

        {activeStep === 3 && (
          <div className="max-w-5xl mx-auto space-y-8 mt-8">
             <div className="flex justify-center pt-8">
               <button onClick={handleNextStep} className="px-12 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-google transform transition hover:scale-105">Pasar a Estudio de Seguridad</button>
             </div>
          </div>
        )}

        {activeStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
            <div className="space-y-6">
               <AIConfigPanel config={report.config} onChange={cfg => setReport(p => ({...p, config: cfg}))} userRole={userRole} />
               <DigitalSignature 
                 auditorName={data.auditorName || currentUser || ''} 
                 rut={data.rut} initialData={data.signature} 
                 onSign={sig => setData(p => ({...p, signature: sig, endTime: Date.now()}))} 
                 onClear={() => setData(p => ({...p, signature: undefined}))}
                 userRole={userRole}
               />
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl shadow-google overflow-hidden flex flex-col min-h-[600px]">
               <div className="px-8 py-6 border-b border-slate-100 dark:border-[#3c4043] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                 <h3 className="font-bold flex items-center gap-3"><span className="text-xl">🛡️</span> Borrador del Estudio de Seguridad</h3>
                 <button onClick={() => setReport(p => ({...p, isEditing: !p.isEditing}))} className="text-xs font-bold px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-full">{report.isEditing ? 'Vista Previa' : 'Editar'}</button>
               </div>
               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                 {report.loading ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                      <p className="text-sm font-medium animate-pulse">Gemini 3 Pro está estructurando el Estudio de Seguridad...</p>
                    </div>
                 ) : report.isEditing ? (
                    <textarea 
                      value={report.content || ''} onChange={e => setReport(p => ({...p, content: e.target.value}))}
                      className="w-full h-full bg-slate-50 dark:bg-slate-950 border-none outline-none resize-none font-mono text-sm leading-relaxed p-6 rounded-2xl"
                    />
                 ) : (
                    <div className="prose dark:prose-invert max-w-none font-serif text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {report.content || "Presione 'Generar Estudio' para que la IA estructure la propuesta técnica legal según Ley 21.659."}
                    </div>
                 )}
               </div>
               <div className="p-8 border-t border-slate-100 dark:border-[#3c4043] bg-white dark:bg-[#202124] flex gap-4">
                  <button onClick={async () => {
                    setReport(p => ({...p, loading: true}));
                    const text = await generateTechnicalReport(data, result, report.config, userRole);
                    setReport(p => ({...p, loading: false, content: text}));
                  }} className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg transition">Generar Estudio Completo</button>
                  <button onClick={async () => {
                    const url = await generatePDFBlob(data, result, report.content || '', "charts-container");
                    window.open(url, '_blank');
                  }} disabled={!report.content} className="px-8 py-4 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition disabled:opacity-50">Exportar PDF</button>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#202124] border-t border-slate-200 dark:border-[#3c4043] px-6 py-4 z-50 flex items-center justify-between shadow-lg">
        <button onClick={handlePrevStep} disabled={activeStep === 1} className={`px-8 py-2.5 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition ${activeStep === 1 ? 'opacity-0' : ''}`}>Atrás</button>
        
        <div className="flex gap-2">
           {STEPS.map(s => (
             <div key={s.id} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${s.id === activeStep ? 'bg-brand-500 w-10' : s.id < activeStep ? 'bg-brand-300' : 'bg-slate-200'}`} />
           ))}
        </div>

        <button onClick={handleNextStep} disabled={activeStep === 4} className={`px-10 py-3 bg-brand-600 text-white rounded-full font-bold shadow-google transition transform active:scale-95 ${activeStep === 4 ? 'opacity-0' : ''}`}>Continuar →</button>
      </footer>
    </div>
  );
}
