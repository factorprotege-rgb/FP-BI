
import React, { useState, useEffect, useCallback } from 'react';
import { INDICATORS, COMUNAS_RANKING } from '../constants';
import { RiskData, CalculationResult, ReportState, AuditRecord, AIReportConfig, UserRole, AuditStatus, Client, Branch } from '../types';
import { calculateScore, getVulnerabilityFromComuna, getPatrullajeFromComuna, validateRut, formatRut, getGeolocation } from '../utils';
import IndicatorInput from './IndicatorInput';
import Charts from './Charts';
import DigitalSignature from './DigitalSignature';
import Login from './Login';
import AuditManager from './AuditManager';
import AIConfigPanel from './AIConfigPanel'; 
import PresentationMode from './PresentationMode';
import WelcomeScreen from './WelcomeScreen';
import SentryGuardLogo from './SentryGuardLogo'; 
import TutorialPlayer from './TutorialPlayer'; 
import { generateTechnicalReport } from '../services/geminiService';
import { generatePDFBlob } from '../services/pdfService';
import { saveAuditToCloud, subscribeToAudits, deleteAuditFromCloud, getClients, getBranches } from '../services/firebaseService';
import DS209Questionnaire from './DS209Questionnaire';
import IntegratedResultsDashboard from './IntegratedResultsDashboard';
import ActionPlanTracker from './ActionPlanTracker';
import CommercialDashboard from './CommercialDashboard';

const INITIAL_DATA: RiskData = {
  entidad: '', rut: '', representanteLegal: '', medidasExistentes: '', giro: '', comuna: '', direccion: '', coords: '', evidencias: '', notas: '',
  auditorName: '',
  observations: {},
  evidenceRefs: {},
  signature: undefined,
  companyLogo: undefined,
  
  // DS 209 default settings
  tipoEntidad: 'Establecimiento Comercial',
  region: 'Región Metropolitana de Santiago',
  responsable: '',
  cargoResponsable: '',
  actividadPrincipal: '',
  horarioFuncionamiento: 'Horario comercial tradicional',
  horarioMayorAfluencia: 'Pico tarde (17:00 - 20:00)',
  operaNocturno: 'NO',
  trabajadores: 10,
  afluenciaDiaria: 120,
  flujoEfectivo: 1500000,
  valorActivos: 120000000,
  retiroValores: 'Retiro mediante transportadora de valores acreditada',
  frecuenciaRetiro: 'Tres veces por semana',
  activoCriticoPrincipal: 'Bodega de stock estratégico / Caja fuerte central',
  superficieTerreno: 800,
  superficieConstruida: 600,

  tipoControlAcceso: 'Control manual (guardia / planilla)',
  estadoCierre: 'Regular (cierres normales, portones vulnerables)',
  alturaRejas: 'Entre 1.8 y 2.5 metros',
  nivelIluminacion: 'Suficiente (focos LED en todo el perímetro)',
  cantidadPuntosCiegos: 2,
  cctv: 'SI',
  cantidadCamaras: 8,
  resolucionCamaras: 'Completa (1080p / 2MP a 5MP)',
  grabacionDias: 30,
  coberturaCCTV: 'Acceso principal, Perímetro exterior, Bóveda / Caja fuerte, Sala de ventas',
  alarma: 'SI',
  tipoAlarma: 'Sensores infrarrojos magnéticos inalámbricos estándar',
  monitoreo: 'SI',
  empresaMonitoreo: 'Prosegur',
  tiempoRespuesta: '10-15 min',
  sistemasPrevAlarma: 'Foco disuasivo automático y sirena exterior de alta sonoridad',
  guardias: 2,
  turnosGuardias: 'Solo turno diurno comercial',
  guardiasOS10: 'SI',
  empresaGuardias: 'Servicios de Seguridad Integrada Ltda.',
  encargadoSeguridad: 'SI',
  nombreEncargado: '',
  comunicaciones: 'Radios portátiles, Celulares corporativos, WhatsApp / Slack, Botones de pánico fijos',
  clasificacionEntorno: 'Calle comercial / Centro cívico',
  nivelDelictual: 'Medio',
  entorno: 'Establecimiento céntrico con flujo fluido de peatones y patrullaje preventivo esporádico.',
  rutasEscape: 'Avenida principal de doble calzada con conexiones fáciles al transporte metropolitano.',
  delitosFrecuentes: 'Incidencias ocasionales de hurtos menores o carterazos al exterior del recinto.',
  protocoloApertura: 'SI',
  protocoloCierre: 'SI',
  protocoloRobo: 'SI',
  protocoloAlarma: 'SI',
  protocoloVisitas: 'SI',
  protocoloValores: 'SI',
  capacitacionUltimaFecha: new Date().toISOString().slice(0, 10)
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
  { id: 2, title: 'Matriz Normativa (Res 1820)', icon: '📝' },
  { id: 3, title: 'Vulnerabilidades (DS 209)', icon: '🛡️' },
  { id: 4, title: 'Dashboard & Resultados', icon: '📊' },
  { id: 5, title: 'Plan de Acción y Seguimiento', icon: '📌' },
  { id: 6, title: 'Estudio de Seguridad (IA)', icon: '📄' }
];

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('consultant');
  const [showWelcome, setShowWelcome] = useState(true); 
  const [mainTab, setMainTab] = useState<'commercial_dashboard' | 'audit_flow'>('audit_flow');
  const [registeredClients, setRegisteredClients] = useState<Client[]>([]);
  const [registeredBranches, setRegisteredBranches] = useState<Branch[]>([]);
  const [activeStep, setActiveStep] = useState<number>(() => {
    const saved = localStorage.getItem('fp_active_step');
    return saved ? Number(saved) : 1;
  });
  const [activeIndicatorIndex, setActiveIndicatorIndex] = useState<number>(() => {
    const saved = localStorage.getItem('fp_active_ind_index');
    return saved ? Number(saved) : 0;
  }); 
  const [showPresentation, setShowPresentation] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false); 
  const [showAuditManager, setShowAuditManager] = useState(false);
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [currentAuditId, setCurrentAuditId] = useState<string | null>(() => localStorage.getItem('fp_current_audit_id'));
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [data, setData] = useState<RiskData>(() => {
    const cached = localStorage.getItem('fp_current_audit_data');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });
  const [result, setResult] = useState<CalculationResult>(calculateScore(data));
  const [report, setReport] = useState<ReportState>(() => {
    let cachedContent = null;
    const cached = localStorage.getItem('fp_current_audit_data');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        cachedContent = parsed.reportContent || null;
      } catch (e) {}
    }
    return {
      loading: false,
      content: cachedContent,
      error: null,
      isEditing: false,
      config: INITIAL_AI_CONFIG
    };
  });

  // Handle currentAuditId change persistence
  useEffect(() => {
    if (currentAuditId) {
      localStorage.setItem('fp_current_audit_id', currentAuditId);
    } else {
      localStorage.removeItem('fp_current_audit_id');
      localStorage.removeItem('fp_current_audit_data');
    }
  }, [currentAuditId]);

  // Persist activeStep and indicator across sessions
  useEffect(() => {
    localStorage.setItem('fp_active_step', String(activeStep));
  }, [activeStep]);

  useEffect(() => {
    localStorage.setItem('fp_active_ind_index', String(activeIndicatorIndex));
  }, [activeIndicatorIndex]);

  // Synchronize state changes to IndexedDB (auto-guardador offline) with 500ms debounce
  useEffect(() => {
    if (!currentAuditId || !currentUser) return;

    const timer = setTimeout(() => {
      const record: AuditRecord = {
        ...data,
        id: currentAuditId,
        lastModified: Date.now(),
        scoreSnapshot: result.score,
        classificationSnapshot: result.classification,
        roleSnapshot: userRole,
        status: (data.status as AuditStatus) || 'draft',
        reportContent: report.content || undefined
      };

      // Guardado rápido local en sincronía con IndexedDB para resguardo inmediato ante recargas bruscas
      localStorage.setItem('fp_current_audit_data', JSON.stringify(record));

      saveAuditToCloud(record).catch(err => {
        console.error("Auto-save failure", err);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [data, result, currentAuditId, report.content, userRole, currentUser]);

  useEffect(() => {
    // Forzar limpieza de dark mode al inicio
    document.documentElement.classList.remove('dark');
    
    const savedUser = localStorage.getItem('fp_user');
    const savedRole = localStorage.getItem('fp_role') as UserRole;
    if (savedUser) {
      setCurrentUser(savedUser);
      if (savedRole) {
        setUserRole(savedRole);
        if (savedRole === 'gerente_comercial' || savedRole === 'supervisor') {
          setMainTab('commercial_dashboard');
        }
      }
    }

    // Cargar Clientes y Sucursales desde IndexedDB
    getClients().then(setRegisteredClients).catch(console.error);
    getBranches().then(setRegisteredBranches).catch(console.error);

    const unsubscribe = subscribeToAudits(setAudits);

    // Escuchar cambios en el estado de pantalla completa
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      unsubscribe();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const html = document.querySelector('html');
    if (isDarkMode) html?.classList.add('dark');
    else html?.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    setResult(calculateScore(data));
  }, [data]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error al intentar habilitar pantalla completa: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

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
    setReport(prev => ({ ...prev, content: null }));
    setActiveStep(1);
    setActiveIndicatorIndex(0);
    setMainTab('audit_flow');
  };

  const handleOpenAuditFromDashboard = (auditId: string, branch?: Branch, client?: Client) => {
    const found = audits.find(a => a.id === auditId);
    if (found) {
      setData(found);
      setCurrentAuditId(found.id);
      setReport(prev => ({ ...prev, content: found.reportContent || null }));
      localStorage.setItem('fp_current_audit_id', found.id);
      localStorage.setItem('fp_current_audit_data', JSON.stringify(found));
      setActiveStep(1);
      setActiveIndicatorIndex(0);
      setMainTab('audit_flow');
    } else if (branch && client) {
      handleStartNewForBranch(branch, client);
    }
  };

  const handleStartNewForBranch = (branch: Branch, client: Client) => {
    const newId = uuid();
    const branchSpecificData: RiskData = {
      ...INITIAL_DATA,
      clientId: client.id,
      branchId: branch.id,
      entidad: `${client.razonSocial} - ${branch.nombre}`,
      rut: client.rut,
      representanteLegal: client.representanteLegal || '',
      giro: client.giro || 'Establecimiento Comercial',
      tipoEntidad: client.tipo || 'Establecimiento Comercial / Retail',
      comuna: branch.comuna || 'Santiago',
      direccion: branch.direccion || '',
      auditorName: currentUser || '',
      ejecutivoAsignado: branch.ejecutivoAsignado || client.ejecutivoAsignado || currentUser || '',
      supervisorAsignado: branch.supervisorAsignado || 'Supervisor Zonal',
      medidasExistentes: branch.seguridadActual?.medidasExistentes || '',
      trabajadores: branch.personal || 15,
      afluenciaDiaria: branch.afluenciaDiaria || 200,
      valorActivos: branch.valorActivosEstimado || 50000000,
      flujoEfectivo: branch.flujoEfectivoDiario || 3000000,
      superficieTerreno: branch.superficieM2 || 500,
      superficieConstruida: branch.superficieM2 || 450,
      status: 'draft',
      observations: {},
      evidenceRefs: {}
    };

    setData(branchSpecificData);
    setCurrentAuditId(newId);
    setReport(prev => ({ ...prev, content: null }));
    setActiveStep(1);
    setActiveIndicatorIndex(0);
    setMainTab('audit_flow');
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
  if (showWelcome) return (
    <WelcomeScreen 
      onStartNew={() => {
        startNewAudit();
        setShowWelcome(false);
      }} 
      onResume={(id) => {
        const found = audits.find(a => a.id === id);
        if (found) {
          setData(found);
          setCurrentAuditId(found.id);
          setReport(prev => ({ ...prev, content: found.reportContent || null }));
          localStorage.setItem('fp_current_audit_id', found.id);
          localStorage.setItem('fp_current_audit_data', JSON.stringify(found));
          setMainTab('audit_flow');
        }
        setShowWelcome(false);
      }}
      onOpenCommercialDashboard={() => {
        setMainTab('commercial_dashboard');
        setShowWelcome(false);
      }}
      userRole={userRole} 
      userName={currentUser} 
      audits={audits}
    />
  );

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
            setReport(prev => ({ ...prev, content: rec.reportContent || null }));
            setActiveStep(1);
            setActiveIndicatorIndex(0);
            setMainTab('audit_flow');
          }
          setShowAuditManager(false);
        }}
        onCreate={() => { startNewAudit(); setShowAuditManager(false); }}
        onDelete={deleteAuditFromCloud} onImport={() => {}} onExport={() => {}}
      />

      <header className={`sticky top-0 z-40 border-b transition-all duration-300 ${isDarkMode ? 'bg-[#202124] border-[#3c4043]' : 'bg-white border-slate-200'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAuditManager(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500" title="Historial y Respaldos">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowWelcome(true)}>
              <SentryGuardLogo className="h-7 w-auto" />
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <h1 className="text-base font-bold tracking-tight text-slate-700 dark:text-slate-200 hidden sm:block">FACTOR PROTEGE BI</h1>
            </div>

            {/* Main View Switcher Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-[#303134] p-1 rounded-2xl ml-4">
              <button 
                onClick={() => setMainTab('commercial_dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mainTab === 'commercial_dashboard'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <span>🏢</span>
                <span className="hidden md:inline">Cartera & Multi-Sucursal (RUT)</span>
                <span className="md:hidden">Cartera</span>
              </button>
              
              <button 
                onClick={() => setMainTab('audit_flow')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  mainTab === 'audit_flow'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <span>🛡️</span>
                <span className="hidden md:inline">Estudio Técnico Activo</span>
                <span className="md:hidden">Estudio</span>
              </button>
            </div>
          </div>

          {/* Audit Steps only visible when active in audit flow */}
          {mainTab === 'audit_flow' && (
            <div className="flex-1 max-w-xl hidden xl:flex justify-center">
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
          )}

          <div className="flex items-center gap-2">
             {/* Dynamic Auto-save Offline Status Badge */}
             <div className="mr-2 hidden md:flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800/30 rounded-full text-xs font-semibold select-none">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
               <span>Auto-guardado DB</span>
             </div>
             
             <button onClick={() => setShowTutorial(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-google-blue" title="Ver Tutorial"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2-2v8a2 2 0 002 2z" /></svg></button>
             <button onClick={() => setShowPresentation(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500" title="Modo Presentación"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg></button>
             <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500" title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}>
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l3 0m-3 0l0 3m11-3l5 5m0 0l-3 0m3 0l0-3m-5 11l5-5m0 0l-3 0m3 0l0 3M9 15l-5 5m0 0l3 0m-3 0l0-3" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" /></svg>
                )}
             </button>
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">{isDarkMode ? '☀️' : '🌙'}</button>
             {userRole === 'consultant' && (
                <button onClick={loadHighRiskDemo} className="px-4 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-full text-xs font-bold hover:bg-brand-100 transition hidden sm:block">Demo</button>
             )}
             <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold ml-2 shadow-sm">{currentUser?.charAt(0)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 py-6 pb-32">
        {mainTab === 'commercial_dashboard' && (
          <div className="animate-fade-in">
            <CommercialDashboard 
              audits={audits}
              currentUser={currentUser}
              userRole={userRole}
              onOpenAudit={handleOpenAuditFromDashboard}
              onStartNewForBranch={handleStartNewForBranch}
            />
          </div>
        )}

        {mainTab === 'audit_flow' && (
          <div>
            {activeStep === 1 && (
              <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
                
                {/* Pre-fill / Quick Selector from registered Clients & Branches */}
                <div className="bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/40 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg">
                      🏢
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">Asociar con Cartera de Clientes / Sucursales</h4>
                      <p className="text-xs text-slate-500">Seleccione un cliente registrado para auto-completar RUT, Razón Social, Giro y Representante:</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <select 
                      onChange={(e) => {
                        const selectedClientId = e.target.value;
                        if (!selectedClientId) return;
                        const client = registeredClients.find(c => c.id === selectedClientId);
                        if (client) {
                          setData(prev => ({
                            ...prev,
                            clientId: client.id,
                            rut: client.rut,
                            entidad: client.razonSocial,
                            representanteLegal: client.representanteLegal || prev.representanteLegal,
                            giro: client.giro || prev.giro,
                            tipoEntidad: client.tipo || prev.tipoEntidad,
                            ejecutivoAsignado: client.ejecutivoAsignado || prev.ejecutivoAsignado
                          }));
                        }
                      }}
                      className="px-4 py-2.5 bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-2xl text-xs font-bold outline-none text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Seleccionar Cliente RUT...</option>
                      {registeredClients.map(c => (
                        <option key={c.id} value={c.id}>{c.rut} - {c.razonSocial}</option>
                      ))}
                    </select>

                    <button 
                      onClick={() => setMainTab('commercial_dashboard')}
                      className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-2xl transition whitespace-nowrap"
                    >
                      Ver Cartera →
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-10 shadow-sm">
                  <h2 className="text-2xl font-medium mb-8 text-slate-800 dark:text-white flex items-center gap-4">
                    <span className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-lg font-bold">1</span>
                    Individualización de la Entidad y Perfil Operacional
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
                      <input name="representanteLegal" value={data.representanteLegal || ''} onChange={handleTextChange} placeholder="Nombre completo" className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Comuna</label>
                      <input list="comunas-list" name="comuna" value={data.comuna} onChange={handleTextChange} placeholder="Seleccione..." className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                      <datalist id="comunas-list">{Object.keys(COMUNAS_RANKING).sort().map(c => <option key={c} value={c} />)}</datalist>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Giro Comercial / Tipo Entidad</label>
                      <select name="tipoEntidad" value={data.tipoEntidad || 'Establecimiento Comercial'} onChange={e => handleInputChange('tipoEntidad', e.target.value)} className="w-full px-5 py-4 google-input rounded-2xl outline-none">
                        <option value="Establecimiento Comercial / Retail">Establecimiento Comercial o Retail de Alta Afluencia</option>
                        <option value="Centro de Distribución">Centro de Distribución, Almacenaje o Aduanero</option>
                        <option value="Servicio Financiero">Servicio Financiero, Bóveda de Valores o Planta de Revisión</option>
                        <option value="Servicio Público Colectivo">Estación de Pasajeros o Complejo de Transportes</option>
                        <option value="Planta Industrial y Producción">Planta Industrial, Manufacturera o Generadora de Energía</option>
                        <option value="Infraestructura Crítica de Servicios">Infraestructura Crítica (Telecomunicaciones, Agua o Combustible)</option>
                        <option value="Edificio Corporativo / Oficinas">Edificio Corporativo, Institución Educativa o de Oficinas</option>
                        <option value="Establecimiento de Salud / Clínica">Complejo de Salud, Hospital o Clínica de Alta Complejidad</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Horario de Funcionamiento</label>
                      <input name="horarioFuncionamiento" value={data.horarioFuncionamiento || ''} onChange={handleTextChange} placeholder="Ej: Lunes a Viernes 08:30 a 19:00" className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider font-semibold text-google-green">Valor Estimado de Activos (CLP)</label>
                      <input type="number" name="valorActivos" value={data.valorActivos || 0} onChange={e => handleInputChange('valorActivos', parseInt(e.target.value) || 0)} className="w-full px-5 py-4 google-input rounded-2xl outline-none font-bold text-google-green" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider font-semibold text-google-red">Flujo de Efectivo Diario Promedio (CLP)</label>
                      <input type="number" name="flujoEfectivo" value={data.flujoEfectivo || 0} onChange={e => handleInputChange('flujoEfectivo', parseInt(e.target.value) || 0)} className="w-full px-5 py-4 google-input rounded-2xl outline-none font-bold text-google-red" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Número de Trabajadores</label>
                      <input type="number" name="trabajadores" value={data.trabajadores || 0} onChange={e => handleInputChange('trabajadores', parseInt(e.target.value) || 0)} className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Afluencia Diaria Promedio</label>
                      <input type="number" name="afluenciaDiaria" value={data.afluenciaDiaria || 0} onChange={e => handleInputChange('afluenciaDiaria', parseInt(e.target.value) || 0)} className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Superficie Terreno (m²)</label>
                      <input type="number" name="superficieTerreno" value={data.superficieTerreno || 0} onChange={e => handleInputChange('superficieTerreno', parseInt(e.target.value) || 0)} className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Superficie Construida (m²)</label>
                      <input type="number" name="superficieConstruida" value={data.superficieConstruida || 0} onChange={e => handleInputChange('superficieConstruida', parseInt(e.target.value) || 0)} className="w-full px-5 py-4 google-input rounded-2xl outline-none" />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-500 tracking-wider font-semibold">Resumen de Medidas de Seguridad Existentes Obtenido</label>
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
                     {activeIndicatorIndex === INDICATORS.length - 1 ? 'Siguiente Cuestionario DS 209 →' : 'Siguiente Factor →'}
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

            {/* STEP 3: VULNERABILITY CUESTIONARIO (DS 209) */}
            {activeStep === 3 && (
              <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
                <div className="flex items-center justify-between px-4">
                  <div>
                    <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest font-black">Matriz de Vulnerabilidades DS 209</h2>
                    <p className="text-xs text-slate-500 font-medium">Evaluación de barreras físicas, CCTV, alarmas, dotaciones de guardias y protocolos de seguridad.</p>
                  </div>
                </div>

                <DS209Questionnaire data={data} onChange={handleInputChange} />

                <div className="flex justify-center pt-4">
                  <button onClick={handleNextStep} className="px-12 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-google transform transition hover:scale-105">
                    Ver Resultados e Informe de Brechas
                  </button>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
                <div className="flex items-center justify-between px-4">
                  <div>
                    <h2 className="text-sm font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest font-black">Consola de Control Integrada y Brechas</h2>
                    <p className="text-xs text-slate-500">Resultados analíticos, planes de inversión correctivos y checklist de protocolos vigentes.</p>
                  </div>
                </div>

                <IntegratedResultsDashboard result={result} data={data} opacity={1} />

                <div className="flex justify-center pt-8 border-t border-slate-200 dark:border-[#3c4043]">
                  <button onClick={handleNextStep} className="px-12 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-google transform transition hover:scale-105">
                    Pasar a Plan de Acción y Seguimiento →
                  </button>
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
                <ActionPlanTracker 
                  data={data} 
                  result={result} 
                  onChange={handleInputChange} 
                  userRole={userRole}
                />

                <div className="flex justify-center pt-8 border-t border-slate-200 dark:border-[#3c4043]">
                  <button onClick={handleNextStep} className="px-12 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-google transform transition hover:scale-105">
                    Ir a Redacción del Estudio de Seguridad e IA →
                  </button>
                </div>
              </div>
            )}

            {activeStep === 6 && (
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
                     <h3 className="font-bold flex items-center gap-3 text-slate-800 dark:text-white"><span className="text-xl">🛡️</span> Borrador del Estudio de Seguridad Integrado</h3>
                     <button onClick={() => setReport(p => ({...p, isEditing: !p.isEditing}))} className="text-xs font-bold px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-full">{report.isEditing ? 'Vista Previa' : 'Editar'}</button>
                   </div>
                   <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                     {report.loading ? (
                        <div className="h-full flex flex-col items-center justify-center">
                          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                          <p className="text-sm font-bold animate-pulse text-brand-600">Modelos Gemini redactando formalmente el Estudio de Seguridad privado...</p>
                        </div>
                     ) : report.isEditing ? (
                        <textarea 
                          value={report.content || ''} onChange={e => setReport(p => ({...p, content: e.target.value}))}
                          className="w-full h-full bg-slate-50 dark:bg-slate-950 border-none outline-none resize-none font-mono text-sm leading-relaxed p-6 rounded-2xl"
                        />
                     ) : (
                        <div className="prose dark:prose-invert max-w-none font-serif text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {report.content || "Presione 'Generar Estudio Completo' para que el motor unificado de Gemini estructure la propuesta técnica legal combinando los 12 factores normativos, la matriz de vulnerabilidades físicas DS 209 y el Plan de Acción de Mitigación."}
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
          </div>
        )}
      </main>

      {mainTab === 'audit_flow' && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#202124] border-t border-slate-200 dark:border-[#3c4043] px-6 py-4 z-50 flex items-center justify-between shadow-lg">
          <button onClick={handlePrevStep} disabled={activeStep === 1} className={`px-8 py-2.5 rounded-full font-bold text-slate-500 hover:bg-slate-100 transition ${activeStep === 1 ? 'opacity-0' : ''}`}>Atrás</button>
          
          <div className="flex gap-2">
             {STEPS.map(s => (
               <div key={s.id} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${s.id === activeStep ? 'bg-brand-500 w-10' : s.id < activeStep ? 'bg-brand-300' : 'bg-slate-200'}`} />
             ))}
          </div>

          <button onClick={handleNextStep} disabled={activeStep === 6} className={`px-10 py-3 bg-brand-600 text-white rounded-full font-bold shadow-google transition transform active:scale-95 ${activeStep === 6 ? 'opacity-0' : ''}`}>Continuar →</button>
        </footer>
      )}
    </div>
  );
}
