import React, { useState } from 'react';
import { ActionItem, ActionStatus, ActionPriority, ActionCategory, CommercialOutcome, ActionStatusLog, RiskData, CalculationResult, UserRole } from '../types';

interface ActionPlanTrackerProps {
  data: RiskData;
  result: CalculationResult;
  onChange: (key: string, value: any) => void;
  userRole?: UserRole;
  onNavigateToStep?: (step: number) => void;
}

const CATEGORIES: ActionCategory[] = [
  'CCTV y Alarmas',
  'Seguridad Física',
  'Recursos Humanos y OS-10',
  'Protocolos y Procedimientos',
  'Control de Acceso',
  'Entorno y Comunicaciones'
];

export const generateSmartActionPlan = (data: RiskData, result: CalculationResult): ActionItem[] => {
  const items: ActionItem[] = [];
  const now = Date.now();
  const getDueDate = (days: number) => new Date(now + days * 86400000).toISOString().slice(0, 10);

  const createInitialLog = (status: ActionStatus, executor: string, outcome: CommercialOutcome): ActionStatusLog[] => [
    {
      id: 'log-' + Math.random().toString(36).substr(2, 6),
      timestamp: now,
      toStatus: status,
      changedBy: 'Sistema Evaluador - Factor Protege BI',
      executor: executor,
      notes: 'Creación e identificación inicial de la brecha según matriz de vulnerabilidades.',
      commercialOutcome: outcome
    }
  ];

  // 1. CCTV Storage & Coverage
  if (data.cctv === 'NO' || (data.grabacionDias && Number(data.grabacionDias) < 30)) {
    const budget = 1850000;
    items.push({
      id: 'act-cctv-storage-' + Math.random().toString(36).substr(2, 5),
      title: 'Aumentar Capacidad y Almacenamiento de CCTV (Mínimo 30 días)',
      category: 'CCTV y Alarmas',
      priority: 'alta',
      vulnerabilityRef: 'DS 209 - Almacenamiento CCTV',
      recommendation: `El sistema de CCTV actual registra ${data.grabacionDias || 0} días de almacenamiento. La normativa DS 209 y estándares de fiscalización exigen un mínimo de 30 días de respaldo continuo.`,
      actionRequired: 'Adquirir e instalar NVR/NAS dedicado con discos duros especial para videovigilancia de alta durabilidad (compresión H.265/H.265+).',
      responsible: 'Jefe de Seguridad del Cliente',
      executor: 'FACTOR PROTEGE - División Tecnología CCTV',
      dueDate: getDueDate(30),
      status: 'pendiente',
      progress: 0,
      budgetEstimate: budget,
      notes: 'Cotización enviada al cliente para suministro e instalación.',
      commercialOutcome: 'cotizado',
      opportunityValue: budget,
      statusHistory: createInitialLog('pendiente', 'FACTOR PROTEGE - División Tecnología CCTV', 'cotizado')
    });
  }

  // 2. CCTV Blindspots & Coverage
  if (data.cantidadPuntosCiegos && Number(data.cantidadPuntosCiegos) > 0) {
    const budget = 920000;
    items.push({
      id: 'act-cctv-blindspots-' + Math.random().toString(36).substr(2, 5),
      title: 'Eliminación de Puntos Ciegos y Cobertura de Bóveda / Accesos',
      category: 'CCTV y Alarmas',
      priority: 'alta',
      vulnerabilityRef: 'DS 209 - Cobertura de Cámaras',
      recommendation: `Se identificaron ${data.cantidadPuntosCiegos} puntos ciegos críticos en el perímetro o zonas de almacenamiento de activos.`,
      actionRequired: 'Instalar cámaras IP antivandálicas adicionales de 5MP con visión nocturna IR en accesos traseros, botes de dinero y zonas oscuras.',
      responsible: 'Supervisor de Mantenimiento',
      executor: 'FACTOR PROTEGE - Proyecto Integrado CCTV',
      dueDate: getDueDate(45),
      status: 'en_proceso',
      progress: 25,
      budgetEstimate: budget,
      notes: 'Puntos mapeados en plano. Venta aprobada y orden de compra emitida.',
      commercialOutcome: 'ganada',
      opportunityValue: budget,
      statusHistory: createInitialLog('en_proceso', 'FACTOR PROTEGE - Proyecto Integrado CCTV', 'ganada')
    });
  }

  // 3. Alarms & Monitoring
  if (data.alarma === 'NO' || data.monitoreo === 'NO') {
    const budget = 650000;
    items.push({
      id: 'act-alarm-monit-' + Math.random().toString(36).substr(2, 5),
      title: 'Implementación de Alarma Anti-Intrusión Centralizada con Monitoreo 24/7',
      category: 'CCTV y Alarmas',
      priority: 'alta',
      vulnerabilityRef: 'DS 209 - Monitoreo de Alarma',
      recommendation: 'La instalación carece de sistema de alarma verificado y conectado a Central de Monitoreo con despacho de patrulla.',
      actionRequired: 'Contratar e instalar sistema de alarma Grado 3 con sensores infrarrojos de doble tecnología, sirena disuasiva exterior y botón de pánico en cajas.',
      responsible: 'Gerencia de Operaciones del Cliente',
      executor: 'Central de Monitoreo FACTOR PROTEGE',
      dueDate: getDueDate(20),
      status: 'pendiente',
      progress: 0,
      budgetEstimate: budget,
      notes: 'Propuesta comercial enviada en espera de firma de contrato.',
      commercialOutcome: 'cotizado',
      opportunityValue: budget,
      statusHistory: createInitialLog('pendiente', 'Central de Monitoreo FACTOR PROTEGE', 'cotizado')
    });
  }

  // 4. OS-10 Guard Certification
  if (data.guardiasOS10 === 'NO' || (data.guardias && Number(data.guardias) > 0 && data.guardiasOS10 === 'NO')) {
    const budget = 480000;
    items.push({
      id: 'act-os10-cert-' + Math.random().toString(36).substr(2, 5),
      title: 'Acreditación y Regularización OS-10 para Personal de Guardias',
      category: 'Recursos Humanos y OS-10',
      priority: 'alta',
      vulnerabilityRef: 'Ley 21.659 - Directiva de Funcionamiento OS-10',
      recommendation: 'Personal que ejerce funciones de seguridad no cuenta con acreditación o curso OS-10 vigente ante Carabineros de Chile.',
      actionRequired: 'Regularizar contrato con empresa de seguridad privada acreditada o enviar al personal a curso de formación OS-10 en OTEC autorizada.',
      responsible: 'Encargado de Recursos Humanos',
      executor: 'OTEC Capacitación Acreditada OS-10',
      dueDate: getDueDate(15),
      status: 'pendiente',
      progress: 10,
      budgetEstimate: budget,
      notes: 'Cliente decidió realizar la capacitación con OTEC interna.',
      commercialOutcome: 'perdida',
      opportunityValue: budget,
      lostReason: 'Cliente utilizó proveedor de capacitación preexistente',
      statusHistory: createInitialLog('pendiente', 'OTEC Capacitación Acreditada OS-10', 'perdida')
    });
  }

  // 5. Perimeter Wall / Fencing
  if (data.alturaRejas && (data.alturaRejas.includes('1.8') || data.alturaRejas.includes('Menor'))) {
    const budget = 2100000;
    items.push({
      id: 'act-perimeter-fence-' + Math.random().toString(36).substr(2, 5),
      title: 'Elevación de Cierre Perimetral a 2.50 Metros y Barrera Físicas',
      category: 'Seguridad Física',
      priority: 'media',
      vulnerabilityRef: 'DS 209 - Resistencia Perimetral',
      recommendation: 'El cerramiento exterior presenta una altura inferior a 2.50 metros, constituyendo un punto de fácil escalamiento e intrusión.',
      actionRequired: 'Instalar sobre-estructura metálica en rejas exteriores, concierto de protección anti-escalamiento y reforzar portones vehiculares.',
      responsible: 'Jefe de Infraestructura',
      executor: 'FACTOR PROTEGE - Obras de Seguridad Física',
      dueDate: getDueDate(60),
      status: 'pendiente',
      progress: 0,
      budgetEstimate: budget,
      notes: 'Presupuesto de herrería y cerramiento estructurado enviado.',
      commercialOutcome: 'cotizado',
      opportunityValue: budget,
      statusHistory: createInitialLog('pendiente', 'FACTOR PROTEGE - Obras de Seguridad Física', 'cotizado')
    });
  }

  // 6. Cash Flow & Armor Transport
  if (data.flujoEfectivo && Number(data.flujoEfectivo) >= 3000000 && (!data.retiroValores || !data.retiroValores.toLowerCase().includes('transportadora'))) {
    const budget = 1200000;
    items.push({
      id: 'act-cash-transport-' + Math.random().toString(36).substr(2, 5),
      title: 'Contratación de Empresa de Transporte de Valores Acreditada (TV)',
      category: 'Protocolos y Procedimientos',
      priority: 'alta',
      vulnerabilityRef: 'Res 1820 / DS 209 - Manejo de Efectivo',
      recommendation: `El flujo de efectivo diario ($${Number(data.flujoEfectivo).toLocaleString('es-CL')} CLP) expone a la entidad a asaltos violentos en vía pública si se traslada por personal propio.`,
      actionRequired: 'Licitación y firma de contrato de retiro de valores con camión blindado en frecuencia trisemanal.',
      responsible: 'Gerencia de Finanzas',
      executor: 'Empresa Externa de Transportes de Valores Acreditada',
      dueDate: getDueDate(25),
      status: 'en_proceso',
      progress: 50,
      budgetEstimate: budget,
      notes: 'Contrato adjudicado a transportadora de valores aliada.',
      commercialOutcome: 'ganada',
      opportunityValue: budget,
      statusHistory: createInitialLog('en_proceso', 'Empresa Externa de Transportes de Valores Acreditada', 'ganada')
    });
  }

  // 7. Security Protocols
  if (data.protocoloApertura === 'NO' || data.protocoloRobo === 'NO' || data.protocoloAlarma === 'NO') {
    const budget = 350000;
    items.push({
      id: 'act-protocols-written-' + Math.random().toString(36).substr(2, 5),
      title: 'Elaboración y Difusión Formal de Manual de Procedimientos (Ley 21.659)',
      category: 'Protocolos y Procedimientos',
      priority: 'media',
      vulnerabilityRef: 'Ley 21.659 - Normativa de Protocolos Obligatorios',
      recommendation: 'Inexistencia de instructivos escritos y firmados sobre actuación ante robo, llamadas extorsivas, apertura/cierre y emergencias.',
      actionRequired: 'Redactar instructivo normalizado de seguridad corporativa, capacitar al 100% de la dotación de trabajadores y mantener registro firmado.',
      responsible: 'Asesor en Prevención de Riesgos',
      executor: 'FACTOR PROTEGE - Consultoría Legal y Normativa',
      dueDate: getDueDate(15),
      status: 'completado',
      progress: 100,
      budgetEstimate: budget,
      notes: 'Manual de protocolos confeccionado y contratado con Factor Protege.',
      commercialOutcome: 'ganada',
      opportunityValue: budget,
      statusHistory: createInitialLog('completado', 'FACTOR PROTEGE - Consultoría Legal y Normativa', 'ganada')
    });
  }

  // 8. Access Control
  if (!data.tipoControlAcceso || data.tipoControlAcceso.includes('manual') || data.tipoControlAcceso.includes('ninguno')) {
    const budget = 1650000;
    items.push({
      id: 'act-access-control-' + Math.random().toString(36).substr(2, 5),
      title: 'Implementación de Control de Acceso Peatonal con Lectora Biométrica / Cédula',
      category: 'Control de Acceso',
      priority: 'media',
      vulnerabilityRef: 'DS 209 - Control de Accesos',
      recommendation: 'El registro de visitantes y colaboradores es manual o informal, impidiendo la trazabilidad en tiempo real.',
      actionRequired: 'Instalar torniquete / molinete con lectora de cédula de identidad y software de registro digital de visitas.',
      responsible: 'Dpto. de Informática y Seguridad',
      executor: 'FACTOR PROTEGE - Control de Accesos & Biometría',
      dueDate: getDueDate(45),
      status: 'pendiente',
      progress: 0,
      budgetEstimate: budget,
      notes: 'Cotización presentada al comité de compras.',
      commercialOutcome: 'cotizado',
      opportunityValue: budget,
      statusHistory: createInitialLog('pendiente', 'FACTOR PROTEGE - Control de Accesos & Biometría', 'cotizado')
    });
  }

  return items;
};

export default function ActionPlanTracker({ data, result, onChange, userRole = 'consultant' }: ActionPlanTrackerProps) {
  const actionPlan: ActionItem[] = data.actionPlan && data.actionPlan.length > 0
    ? data.actionPlan
    : [];

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterPriority, setFilterPriority] = useState<string>('todas');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [filterCommercial, setFilterCommercial] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Modals state
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // History Modal State
  const [historyItem, setHistoryItem] = useState<ActionItem | null>(null);

  // Status Change Modal State (for capturing who changes status, executor & commercial opportunity)
  const [statusChangeModal, setStatusChangeModal] = useState<{
    item: ActionItem;
    targetStatus: ActionStatus;
  } | null>(null);

  // Form state for status change modal
  const [changeForm, setChangeForm] = useState<{
    changedBy: string;
    executor: string;
    commercialOutcome: CommercialOutcome;
    opportunityValue: number;
    lostReason: string;
    notes: string;
    progress: number;
  }>({
    changedBy: '',
    executor: '',
    commercialOutcome: 'cotizado',
    opportunityValue: 0,
    lostReason: '',
    notes: '',
    progress: 0
  });

  const getUserRoleLabel = () => {
    switch (userRole) {
      case 'consultant': return 'Evaluador Certificado - Factor Protege';
      case 'supervisor': return 'Supervisor Zonal - Factor Protege';
      case 'authority': return 'Inspector Técnico Ley 21.659';
      default: return 'Evaluador Factor Protege';
    }
  };

  // Auto-initialize action plan if empty
  const handleAutoGenerate = () => {
    const generated = generateSmartActionPlan(data, result);
    const existingTitles = new Set(actionPlan.map(i => i.title.toLowerCase()));
    const newItems = generated.filter(i => !existingTitles.has(i.title.toLowerCase()));

    if (newItems.length === 0) {
      alert("Todas las recomendaciones automáticas sugeridas ya se encuentran cargadas en su plan de acción.");
      return;
    }

    const updated = [...actionPlan, ...newItems];
    onChange('actionPlan', updated);
  };

  // Open modal for quick status change with complete traceability
  const promptStatusChangeModal = (item: ActionItem, targetStatus: ActionStatus) => {
    const defaultProgress = targetStatus === 'completado' || targetStatus === 'verificado' ? 100 : targetStatus === 'en_proceso' ? Math.max(item.progress, 50) : 0;
    setChangeForm({
      changedBy: getUserRoleLabel(),
      executor: item.executor || 'FACTOR PROTEGE - Soluciones Integrales',
      commercialOutcome: item.commercialOutcome || 'cotizado',
      opportunityValue: item.opportunityValue || item.budgetEstimate || 0,
      lostReason: item.lostReason || '',
      notes: `Transición a etapa ${targetStatus.toUpperCase()}.`,
      progress: defaultProgress
    });
    setStatusChangeModal({ item, targetStatus });
  };

  const handleConfirmStatusChange = () => {
    if (!statusChangeModal) return;
    const { item, targetStatus } = statusChangeModal;

    const newLog: ActionStatusLog = {
      id: 'log-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      timestamp: Date.now(),
      fromStatus: item.status,
      toStatus: targetStatus,
      changedBy: changeForm.changedBy.trim() || getUserRoleLabel(),
      executor: changeForm.executor.trim() || 'No especificado',
      notes: changeForm.notes,
      commercialOutcome: changeForm.commercialOutcome
    };

    const updatedHistory = [...(item.statusHistory || []), newLog];

    const updatedItem: ActionItem = {
      ...item,
      status: targetStatus,
      progress: changeForm.progress,
      executor: changeForm.executor.trim() || item.executor,
      commercialOutcome: changeForm.commercialOutcome,
      opportunityValue: changeForm.opportunityValue,
      lostReason: changeForm.commercialOutcome === 'perdida' ? changeForm.lostReason : '',
      notes: changeForm.notes ? `${changeForm.notes} (${new Date().toLocaleDateString('es-CL')})` : item.notes,
      updatedAt: Date.now(),
      statusHistory: updatedHistory
    };

    const newList = actionPlan.map(i => i.id === item.id ? updatedItem : i);
    onChange('actionPlan', newList);
    setStatusChangeModal(null);
  };

  const handleUpdateItem = (updatedItem: ActionItem) => {
    const exists = actionPlan.some(i => i.id === updatedItem.id);
    let newList: ActionItem[];

    // Ensure initial history log exists
    let history = updatedItem.statusHistory || [];
    if (history.length === 0) {
      history = [{
        id: 'log-' + Date.now().toString(36),
        timestamp: Date.now(),
        toStatus: updatedItem.status,
        changedBy: getUserRoleLabel(),
        executor: updatedItem.executor || 'Factor Protege',
        notes: 'Registro o edición manual de la acción de mitigación.',
        commercialOutcome: updatedItem.commercialOutcome || 'sin_cotizar'
      }];
    }

    const itemToSave: ActionItem = {
      ...updatedItem,
      updatedAt: Date.now(),
      statusHistory: history
    };

    if (exists) {
      newList = actionPlan.map(i => i.id === updatedItem.id ? itemToSave : i);
    } else {
      newList = [...actionPlan, itemToSave];
    }
    onChange('actionPlan', newList);
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("¿Está seguro de eliminar esta acción del plan de seguimiento?")) {
      const newList = actionPlan.filter(i => i.id !== id);
      onChange('actionPlan', newList);
    }
  };

  const handleCreateNew = () => {
    const newItem: ActionItem = {
      id: 'act-custom-' + Date.now().toString(36),
      title: '',
      category: 'Seguridad Física',
      priority: 'media',
      recommendation: '',
      actionRequired: '',
      responsible: 'Jefe de Seguridad del Cliente',
      executor: 'FACTOR PROTEGE - Servicios Especializados',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      status: 'pendiente',
      progress: 0,
      budgetEstimate: 500000,
      notes: '',
      commercialOutcome: 'cotizado',
      opportunityValue: 500000,
      statusHistory: []
    };
    setEditingItem(newItem);
    setIsModalOpen(true);
  };

  // Filtered items
  const filteredItems = actionPlan.filter(item => {
    if (filterStatus !== 'todos' && item.status !== filterStatus) return false;
    if (filterPriority !== 'todas' && item.priority !== filterPriority) return false;
    if (filterCategory !== 'todas' && item.category !== filterCategory) return false;
    if (filterCommercial !== 'todos' && item.commercialOutcome !== filterCommercial) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = item.title.toLowerCase().includes(q) ||
        item.recommendation.toLowerCase().includes(q) ||
        item.actionRequired.toLowerCase().includes(q) ||
        item.responsible.toLowerCase().includes(q) ||
        (item.executor && item.executor.toLowerCase().includes(q)) ||
        (item.vulnerabilityRef && item.vulnerabilityRef.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Analytics Metrics
  const totalItems = actionPlan.length;
  const pendingCount = actionPlan.filter(i => i.status === 'pendiente').length;
  const inProgressCount = actionPlan.filter(i => i.status === 'en_proceso').length;
  const completedCount = actionPlan.filter(i => i.status === 'completado' || i.status === 'verificado').length;
  const verifiedCount = actionPlan.filter(i => i.status === 'verificado').length;

  const totalBudget = actionPlan.reduce((acc, i) => acc + (i.budgetEstimate || 0), 0);
  const overallProgress = totalItems > 0 
    ? Math.round(actionPlan.reduce((acc, i) => acc + i.progress, 0) / totalItems) 
    : 0;

  // Commercial Metrics
  const wonItems = actionPlan.filter(i => i.commercialOutcome === 'ganada');
  const lostItems = actionPlan.filter(i => i.commercialOutcome === 'perdida');
  const quotedItems = actionPlan.filter(i => i.commercialOutcome === 'cotizado');

  const wonTotalValue = wonItems.reduce((acc, i) => acc + (i.opportunityValue || i.budgetEstimate || 0), 0);
  const lostTotalValue = lostItems.reduce((acc, i) => acc + (i.opportunityValue || i.budgetEstimate || 0), 0);
  const quotedTotalValue = quotedItems.reduce((acc, i) => acc + (i.opportunityValue || i.budgetEstimate || 0), 0);

  const closedDealsCount = wonItems.length + lostItems.length;
  const conversionRatePct = closedDealsCount > 0 ? Math.round((wonItems.length / closedDealsCount) * 100) : 0;

  const projectedRiskReductionPct = totalItems > 0
    ? Math.min(85, Math.round((completedCount * 1.0 + inProgressCount * 0.4) / totalItems * 65))
    : 0;

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-8 shadow-xl border border-slate-700/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-brand-500/10 blur-3xl pointer-events-none"></div>
        <div className="z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider mb-3">
            <span>📌 Módulo de Mitigación, Trazabilidad & Pipeline Comercial</span>
            <span>• Ley N° 21.659</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            Plan de Acción, Trazabilidad y Oportunidades Comerciales
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Control integral de brechas, trazabilidad histórica por etapa (quién ejecuta y mitiga), registro de responsables y seguimiento de oportunidades de venta concretadas y perdidas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={handleAutoGenerate}
            className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-google text-xs flex items-center gap-2 transition transform hover:scale-105 active:scale-95"
          >
            <span>✨</span>
            <span>Auto-Generar Recomendaciones</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-2xl text-xs flex items-center gap-2 transition transform hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <span>➕</span>
            <span>Nueva Acción</span>
          </button>
        </div>
      </div>

      {/* EXECUTIVE KPI DASHBOARD (OPERATIVE + COMMERCIAL) */}
      <div className="space-y-4">
        
        {/* OPERATIVE METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Acciones</span>
              <span className="text-xl">📋</span>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-800 dark:text-white">{totalItems}</div>
              <p className="text-[11px] text-slate-400 mt-1">Brechas identificadas</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">En Ejecución</span>
              <span className="text-xl">🔄</span>
            </div>
            <div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {inProgressCount} <span className="text-xs text-slate-400 font-normal">({pendingCount} pendientes)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">En proceso de remediación</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Completadas / Verificadas</span>
              <span className="text-xl">🛡️</span>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {completedCount} <span className="text-xs font-normal text-emerald-700/60 dark:text-emerald-400/60">({verifiedCount} auditadas)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Medidas de control activas</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Presupuesto Estimado</span>
              <span className="text-xl">💰</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-white truncate">
                ${totalBudget.toLocaleString('es-CL')} <span className="text-xs font-normal text-slate-400">CLP</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Inversión requerida</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center text-brand-600 dark:text-brand-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Avance Global</span>
              <span className="text-xl font-bold">{overallProgress}%</span>
            </div>
            <div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                <div 
                  className="bg-gradient-to-r from-brand-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ↓ {projectedRiskReductionPct}% reducción proyectada del riesgo
              </p>
            </div>
          </div>

        </div>

        {/* COMMERCIAL OPPORTUNITIES PANEL (VENTAS CONCRETADAS VS PERDIDAS) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <h3 className="text-base font-extrabold text-white">Pipeline y Oportunidades Comerciales de Venta</h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Factor Protege BI
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-400">
              Tasa de Conversión: <strong className="text-emerald-400 text-sm font-black">{conversionRatePct}%</strong> ({wonItems.length} ganadas / {closedDealsCount} cerradas)
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* GANADAS / CONCRETADAS */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center text-emerald-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Ventas Concretadas</span>
                <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">💚 {wonItems.length} Ganadas</span>
              </div>
              <div className="text-2xl font-black text-emerald-300">
                ${wonTotalValue.toLocaleString('es-CL')} <span className="text-xs font-normal text-emerald-400/70">CLP</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 mt-1">Servicios / Productos adjudicados</p>
            </div>

            {/* EN NEGOCIACIÓN / COTIZADO */}
            <div className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center text-blue-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Cotizado / En Negociación</span>
                <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded-full font-bold">⏳ {quotedItems.length} Activas</span>
              </div>
              <div className="text-2xl font-black text-blue-300">
                ${quotedTotalValue.toLocaleString('es-CL')} <span className="text-xs font-normal text-blue-400/70">CLP</span>
              </div>
              <p className="text-[10px] text-blue-400/80 mt-1">Propuestas pendientes de decisión</p>
            </div>

            {/* PERDIDAS */}
            <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center text-red-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Oportunidades Perdidas</span>
                <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded-full font-bold">🔴 {lostItems.length} Perdidas</span>
              </div>
              <div className="text-2xl font-black text-red-300">
                ${lostTotalValue.toLocaleString('es-CL')} <span className="text-xs font-normal text-red-400/70">CLP</span>
              </div>
              <p className="text-[10px] text-red-400/80 mt-1">Ejecutadas por terceros / rechazadas</p>
            </div>

            {/* PIPELINE TOTAL DETECTADO */}
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex justify-between items-center text-purple-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Potencial de Mercado</span>
                <span className="text-xs bg-purple-500/20 px-2 py-0.5 rounded-full font-bold">🎯 {totalItems} Brechas</span>
              </div>
              <div className="text-2xl font-black text-purple-300">
                ${(wonTotalValue + quotedTotalValue + lostTotalValue).toLocaleString('es-CL')} <span className="text-xs font-normal text-purple-400/70">CLP</span>
              </div>
              <p className="text-[10px] text-purple-400/80 mt-1">Valor total de brechas detectadas</p>
            </div>

          </div>

        </div>

      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-6 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Search Box */}
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, ejecutor/mitigador, recomendación o responsable..."
              className="w-full pl-11 pr-4 py-3 google-input rounded-2xl text-xs outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3.5 py-3 google-input rounded-2xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="todos">Estado: Todos ({totalItems})</option>
              <option value="pendiente">⏱️ Pendiente ({pendingCount})</option>
              <option value="en_proceso">🔄 En Proceso ({inProgressCount})</option>
              <option value="completado">✅ Completado ({actionPlan.filter(i=>i.status==='completado').length})</option>
              <option value="verificado">🛡️ Verificado ({verifiedCount})</option>
            </select>

            <select
              value={filterCommercial}
              onChange={e => setFilterCommercial(e.target.value)}
              className="px-3.5 py-3 google-input rounded-2xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="todos">Ventas: Todas</option>
              <option value="ganada">💚 Concretadas ({wonItems.length})</option>
              <option value="cotizado">⏳ Cotizadas ({quotedItems.length})</option>
              <option value="perdida">🔴 Perdidas ({lostItems.length})</option>
              <option value="sin_cotizar">📝 Sin Cotizar</option>
            </select>

            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3.5 py-3 google-input rounded-2xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="todas">Prioridad: Todas</option>
              <option value="alta">🔴 Alta Prioridad</option>
              <option value="media">🟡 Prioridad Media</option>
              <option value="baja">🟢 Prioridad Baja</option>
            </select>

            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-3.5 py-3 google-input rounded-2xl text-xs font-semibold outline-none cursor-pointer max-w-[150px]"
            >
              <option value="todas">Categoría: Todas</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400'}`}
                title="Vista en Tarjetas"
              >
                🪟 Tarjetas
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-400'}`}
                title="Vista en Tabla"
              >
                📊 Tabla
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* CONTENT LISTING */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl p-12 text-center space-y-4">
          <span className="text-5xl block">📌</span>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">No hay acciones registradas</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {totalItems === 0 
              ? "Presione 'Auto-Generar Recomendaciones' para analizar automáticamente las vulnerabilidades del cuestionario o agregue una acción personalizada."
              : "No se encontraron elementos que coincidan con los filtros aplicados."}
          </p>
          {totalItems === 0 && (
            <button
              onClick={handleAutoGenerate}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-2xl text-xs shadow-google transition hover:bg-brand-700"
            >
              Generar Recomendaciones desde Evaluación
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map(item => {
            const isHigh = item.priority === 'alta';
            const isMedium = item.priority === 'media';
            const logCount = (item.statusHistory || []).length;

            return (
              <div 
                key={item.id}
                className="bg-white dark:bg-[#202124] border border-slate-200/80 dark:border-[#3c4043] rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 bottom-0 w-2 ${
                  isHigh ? 'bg-red-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <div className="pl-3">
                  {/* Card Header Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                        isHigh ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                        isMedium ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                      }`}>
                        {isHigh ? '🔴 Prioridad Alta' : isMedium ? '🟡 Prioridad Media' : '🟢 Prioridad Baja'}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>

                    {/* Quick Status Select Button with Modal Trigger */}
                    <button
                      onClick={() => {
                        const nextStatus: Record<ActionStatus, ActionStatus> = {
                          'pendiente': 'en_proceso',
                          'en_proceso': 'completado',
                          'completado': 'verificado',
                          'verificado': 'pendiente'
                        };
                        promptStatusChangeModal(item, nextStatus[item.status]);
                      }}
                      className={`text-xs font-bold px-3 py-1 rounded-xl outline-none border flex items-center gap-1.5 transition transform active:scale-95 ${
                        item.status === 'verificado' ? 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200' :
                        item.status === 'completado' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200' :
                        item.status === 'en_proceso' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200' :
                        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                      title="Cambiar etapa de avance y registrar trazabilidad"
                    >
                      <span>
                        {item.status === 'verificado' ? '🛡️ Verificado' :
                         item.status === 'completado' ? '✅ Completado' :
                         item.status === 'en_proceso' ? '🔄 En Proceso' : '⏱️ Pendiente'}
                      </span>
                      <span className="text-[10px] opacity-70">➔</span>
                    </button>
                  </div>

                  {/* Title & Ref */}
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-white mb-2 leading-snug">
                    {item.title}
                  </h3>

                  {item.vulnerabilityRef && (
                    <p className="text-[11px] font-mono font-bold text-brand-600 dark:text-brand-400 mb-3 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-1 rounded-lg inline-block">
                      {item.vulnerabilityRef}
                    </p>
                  )}

                  {/* Commercial Badge */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                      item.commercialOutcome === 'ganada' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300' :
                      item.commercialOutcome === 'perdida' ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-300' :
                      item.commercialOutcome === 'cotizado' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-300' :
                      'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      <span>
                        {item.commercialOutcome === 'ganada' ? '💚 Venta Concretada (Ganada)' :
                         item.commercialOutcome === 'perdida' ? '🔴 Venta Perdida' :
                         item.commercialOutcome === 'cotizado' ? '⏳ Cotización Enviada' :
                         item.commercialOutcome === 'no_aplica' ? '⚪ Gestión Interna N/A' : '📝 Oportunidad Sin Cotizar'}
                      </span>
                      <span className="font-black">
                        ${(item.opportunityValue || item.budgetEstimate || 0).toLocaleString('es-CL')} CLP
                      </span>
                    </span>

                    {item.commercialOutcome === 'perdida' && item.lostReason && (
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-semibold italic">
                        Motivo: "{item.lostReason}"
                      </span>
                    )}
                  </div>

                  {/* Recommendation & Action Text */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 mb-4 space-y-2">
                    <p className="leading-relaxed">
                      <strong className="text-slate-800 dark:text-slate-200">Recomendación: </strong>
                      {item.recommendation}
                    </p>
                    <p className="leading-relaxed text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                      <strong className="text-brand-600 dark:text-brand-400">Acción requerida: </strong>
                      {item.actionRequired}
                    </p>
                  </div>

                  {/* Metadata Row: Responsables & Ejecutor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                    
                    {/* Quién Realiza / Mitiga la Brecha */}
                    <div className="bg-brand-50/70 dark:bg-brand-950/30 p-2.5 rounded-xl border border-brand-100 dark:border-brand-900/40">
                      <span className="text-[10px] text-brand-700 dark:text-brand-300 font-bold uppercase block">
                        🛠️ Quien Ejecuta / Mitiga Brecha
                      </span>
                      <span className="font-extrabold text-brand-900 dark:text-brand-200 block mt-0.5 truncate">
                        {item.executor || 'FACTOR PROTEGE - Soluciones'}
                      </span>
                    </div>

                    {/* Responsable Interno del Cliente */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">👤 Responsable del Cliente</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                        {item.responsible}
                      </span>
                    </div>

                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Avance de Implementación</span>
                      <span className="text-brand-600 dark:text-brand-400">{item.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-lg overflow-hidden">
                      <div 
                        className="bg-brand-600 h-full rounded-lg transition-all"
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic mb-4 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      💬 "{item.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Buttons & History Link */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center pl-3 gap-2">
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryItem(item)}
                      className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/50 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 rounded-xl font-bold text-xs transition flex items-center gap-1.5"
                      title="Ver historial de trazabilidad de cambios"
                    >
                      <span>📜 Trazabilidad</span>
                      <span className="bg-brand-200 dark:bg-brand-800 px-1.5 py-0.2 text-[10px] rounded-full font-black">
                        {logCount}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs transition"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-[#3c4043] text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Prioridad / Etapa</th>
                  <th className="p-4">Recomendación & Acción</th>
                  <th className="p-4">🛠️ Quién Ejecuta / Mitiga</th>
                  <th className="p-4">Oportunidad Comercial</th>
                  <th className="p-4">Responsable Cliente</th>
                  <th className="p-4 text-center">Avance</th>
                  <th className="p-4 text-center">Trazabilidad</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                    <td className="p-4 align-top">
                      <div className="space-y-1.5">
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.priority === 'alta' ? 'bg-red-100 text-red-700' :
                          item.priority === 'media' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {item.priority}
                        </span>
                        <div>
                          <button
                            onClick={() => {
                              const nextStatus: Record<ActionStatus, ActionStatus> = {
                                'pendiente': 'en_proceso',
                                'en_proceso': 'completado',
                                'completado': 'verificado',
                                'verificado': 'pendiente'
                              };
                              promptStatusChangeModal(item, nextStatus[item.status]);
                            }}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border text-left ${
                              item.status === 'verificado' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                              item.status === 'completado' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                              item.status === 'en_proceso' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                              'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {item.status.toUpperCase()} ➔
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 align-top max-w-xs">
                      <h4 className="font-extrabold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 line-clamp-2 text-[11px] mb-1">{item.actionRequired}</p>
                      {item.vulnerabilityRef && (
                        <span className="text-[10px] font-mono font-bold text-brand-600">{item.vulnerabilityRef}</span>
                      )}
                    </td>

                    <td className="p-4 align-top font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50/50 dark:bg-brand-950/20 rounded-xl">
                      🛠️ {item.executor || 'Factor Protege'}
                    </td>

                    <td className="p-4 align-top">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.commercialOutcome === 'ganada' ? 'bg-emerald-100 text-emerald-800 font-black' :
                        item.commercialOutcome === 'perdida' ? 'bg-red-100 text-red-800 font-black' :
                        item.commercialOutcome === 'cotizado' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.commercialOutcome === 'ganada' ? '💚 GANADA' :
                         item.commercialOutcome === 'perdida' ? '🔴 PERDIDA' :
                         item.commercialOutcome === 'cotizado' ? '⏳ COTIZADO' : '📝 SIN COTIZAR'}
                      </span>
                      <div className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                        ${(item.opportunityValue || item.budgetEstimate || 0).toLocaleString('es-CL')} CLP
                      </div>
                    </td>

                    <td className="p-4 align-top font-semibold text-slate-700 dark:text-slate-200">
                      👤 {item.responsible}
                    </td>

                    <td className="p-4 align-top text-center">
                      <span className="font-bold text-brand-600 dark:text-brand-400">{item.progress}%</span>
                      <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full" style={{ width: `${item.progress}%` }}></div>
                      </div>
                    </td>

                    <td className="p-4 align-top text-center">
                      <button
                        onClick={() => setHistoryItem(item)}
                        className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 font-bold rounded-lg text-[11px]"
                      >
                        📜 {(item.statusHistory || []).length} Logs
                      </button>
                    </td>

                    <td className="p-4 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-bold"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 font-bold"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STATUS CHANGE & TRACEABILITY PROMPT MODAL */}
      {statusChangeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">
                  Cambio de Etapa & Registro de Trazabilidad
                </h3>
              </div>
              <button
                onClick={() => setStatusChangeModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="text-xs text-slate-500">Acción seleccionada:</div>
              <div className="font-extrabold text-sm text-slate-800 dark:text-white">{statusChangeModal.item.title}</div>
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-slate-500">Etapa previa:</span>
                <span className="font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                  {statusChangeModal.item.status}
                </span>
                <span>➔</span>
                <span className="font-bold uppercase px-2 py-0.5 rounded bg-brand-600 text-white">
                  {statusChangeModal.targetStatus}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Quien realiza la acción / mitigación */}
              <div className="space-y-1">
                <label className="font-extrabold text-brand-700 dark:text-brand-300 uppercase tracking-wider block">
                  🛠️ Quien realiza la Acción / Mitigación de la Brecha
                </label>
                <input
                  type="text"
                  value={changeForm.executor}
                  onChange={e => setChangeForm({ ...changeForm, executor: e.target.value })}
                  placeholder="Ej: FACTOR PROTEGE - Área CCTV / Empresa Externa X / Cliente Interno"
                  className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none font-bold"
                />
              </div>

              {/* Quien registra el cambio */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  👤 Quien Autoriza / Registra el Cambio de Etapa
                </label>
                <input
                  type="text"
                  value={changeForm.changedBy}
                  onChange={e => setChangeForm({ ...changeForm, changedBy: e.target.value })}
                  placeholder="Ej: Evaluador Certificado Factor Protege"
                  className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none font-bold"
                />
              </div>

              {/* Estado Comercial / Oportunidad de Venta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    💼 Oportunidad de Venta
                  </label>
                  <select
                    value={changeForm.commercialOutcome}
                    onChange={e => setChangeForm({ ...changeForm, commercialOutcome: e.target.value as CommercialOutcome })}
                    className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none font-bold cursor-pointer"
                  >
                    <option value="ganada">💚 Concretada (Ganada)</option>
                    <option value="cotizado">⏳ Cotizada (En Negociación)</option>
                    <option value="perdida">🔴 Perdida</option>
                    <option value="sin_cotizar">📝 Sin Cotizar</option>
                    <option value="no_aplica">⚪ Gestión Interna (N/A)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    💰 Valor Cotización CLP ($)
                  </label>
                  <input
                    type="number"
                    value={changeForm.opportunityValue}
                    onChange={e => setChangeForm({ ...changeForm, opportunityValue: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Razón si fue perdida */}
              {changeForm.commercialOutcome === 'perdida' && (
                <div className="space-y-1 bg-red-50 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
                  <label className="font-bold text-red-700 dark:text-red-300 uppercase tracking-wider block">
                    ⚠️ Motivo de Oportunidad Perdida
                  </label>
                  <input
                    type="text"
                    value={changeForm.lostReason}
                    onChange={e => setChangeForm({ ...changeForm, lostReason: e.target.value })}
                    placeholder="Ej: Cliente prefirió proveedor existente / Sin presupuesto"
                    className="w-full px-3 py-2 google-input rounded-xl outline-none"
                  />
                </div>
              )}

              {/* Porcentaje de avance */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  Avance de la Medida ({changeForm.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={changeForm.progress}
                  onChange={e => setChangeForm({ ...changeForm, progress: parseInt(e.target.value) })}
                  className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
              </div>

              {/* Comentarios de la bitácora */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                  Notas de Avance / Verificación
                </label>
                <textarea
                  value={changeForm.notes}
                  onChange={e => setChangeForm({ ...changeForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Detalles técnicos de la inspección o avance de obras..."
                  className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none"
                />
              </div>

            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStatusChangeModal(null)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmStatusChange}
                className="flex-[2] py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-google"
              >
                Registrar Cambios & Trazabilidad
              </button>
            </div>

          </div>
        </div>
      )}

      {/* HISTORIAL DE TRAZABILIDAD MODAL */}
      {historyItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 animate-scale-up my-8">
            
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📜</span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">
                    Historial de Trazabilidad y Auditoría de Gestión
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Registro inmutable de transiciones de etapa y ejecutores asignados.
                </p>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <div className="font-extrabold text-sm text-slate-800 dark:text-white">{historyItem.title}</div>
              <div className="text-slate-500">Ejecutor / Mitigador Actual: <strong className="text-brand-600 dark:text-brand-400">{historyItem.executor || 'No asignado'}</strong></div>
              <div className="text-slate-500">Responsable Cliente: <strong>{historyItem.responsible}</strong></div>
            </div>

            {/* TIMELINE LOGS LIST */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {(!historyItem.statusHistory || historyItem.statusHistory.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6">No hay registros detallados de historial aún.</p>
              ) : (
                historyItem.statusHistory.map((log, idx) => (
                  <div key={log.id || idx} className="relative pl-6 pb-4 border-l-2 border-brand-500 last:pb-0 last:border-l-0">
                    <div className="absolute -left-2 top-0 w-3.5 h-3.5 rounded-full bg-brand-600 border-2 border-white dark:border-slate-900" />
                    
                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-2 text-xs">
                      
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-extrabold text-brand-600 dark:text-brand-400 uppercase text-[11px]">
                          {log.fromStatus ? `${log.fromStatus.toUpperCase()} ➔ ` : ''}{log.toStatus.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          📅 {new Date(log.timestamp).toLocaleString('es-CL')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700/50">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">🛠️ Quien realiza la Acción</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.executor || 'Factor Protege'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">👤 Registrado / Autorizado por</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.changedBy || 'Sistema'}</span>
                        </div>
                      </div>

                      {log.commercialOutcome && (
                        <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          💼 Oportunidad Comercial: <span className="text-emerald-600 uppercase">{log.commercialOutcome}</span>
                        </div>
                      )}

                      {log.notes && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/40 p-2 rounded-xl">
                          "{log.notes}"
                        </div>
                      )}

                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setHistoryItem(null)}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
              >
                Cerrar Trazabilidad
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT / CREATE FULL MODAL */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#202124] border border-slate-200 dark:border-[#3c4043] rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 animate-scale-up">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>📌</span>
                <span>{editingItem.id.startsWith('act-custom-') ? 'Nueva Acción de Mitigación' : 'Editar Acción, Trazabilidad & Venta'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Título de la Acción / Medida</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Ej: Implementar servidor NVR con 30 días de grabación continua..."
                  className="w-full px-4 py-3 google-input rounded-2xl outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Categoría</label>
                  <select
                    value={editingItem.category}
                    onChange={e => setEditingItem({ ...editingItem, category: e.target.value as ActionCategory })}
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Prioridad</label>
                  <select
                    value={editingItem.priority}
                    onChange={e => setEditingItem({ ...editingItem, priority: e.target.value as ActionPriority })}
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none cursor-pointer"
                  >
                    <option value="alta">🔴 Alta (Crítica)</option>
                    <option value="media">🟡 Media (Recomendada)</option>
                    <option value="baja">🟢 Baja (Optimizatoria)</option>
                  </select>
                </div>
              </div>

              {/* QUIÉN REALIZA Y MITIGA LA BRECHA DETECTADA */}
              <div className="bg-brand-50/70 dark:bg-brand-950/30 p-4 rounded-2xl border border-brand-200 dark:border-brand-900/50 space-y-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-brand-800 dark:text-brand-300 uppercase tracking-wider block">
                    🛠️ Quien Realiza la Acción y Mitigación de la Brecha (Ejecutor / Proveedor)
                  </label>
                  <input
                    type="text"
                    value={editingItem.executor || ''}
                    onChange={e => setEditingItem({ ...editingItem, executor: e.target.value })}
                    placeholder="Ej: FACTOR PROTEGE - División CCTV / Empresa Externa X"
                    className="w-full px-4 py-3 google-input rounded-xl outline-none font-bold"
                  />
                  <p className="text-[10px] text-brand-600 dark:text-brand-400">
                    Especifique la empresa, departamento o entidad responsable de la implementación física o técnica de la medida mitigadora.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      💼 Estado Comercial de la Oportunidad
                    </label>
                    <select
                      value={editingItem.commercialOutcome || 'cotizado'}
                      onChange={e => setEditingItem({ ...editingItem, commercialOutcome: e.target.value as CommercialOutcome })}
                      className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none font-bold cursor-pointer"
                    >
                      <option value="ganada">💚 Venta Concretada (Ganada)</option>
                      <option value="cotizado">⏳ Cotización Enviada (En Negociación)</option>
                      <option value="perdida">🔴 Venta Perdida</option>
                      <option value="sin_cotizar">📝 Oportunidad Sin Cotizar</option>
                      <option value="no_aplica">⚪ Gestión Interna (N/A)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                      💰 Valor Oportunidad ($ CLP)
                    </label>
                    <input
                      type="number"
                      value={editingItem.opportunityValue || editingItem.budgetEstimate || 0}
                      onChange={e => setEditingItem({ ...editingItem, opportunityValue: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {editingItem.commercialOutcome === 'perdida' && (
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                      ⚠️ Motivo por el cual la Oportunidad fue Perdida
                    </label>
                    <input
                      type="text"
                      value={editingItem.lostReason || ''}
                      onChange={e => setEditingItem({ ...editingItem, lostReason: e.target.value })}
                      placeholder="Ej: Cliente optó por proveedor preexistente / Presupuesto postergado por gerencia"
                      className="w-full px-3.5 py-2.5 google-input rounded-xl outline-none text-red-600"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Referencia Vulnerabilidad / Norma</label>
                <input
                  type="text"
                  value={editingItem.vulnerabilityRef || ''}
                  onChange={e => setEditingItem({ ...editingItem, vulnerabilityRef: e.target.value })}
                  placeholder="Ej: DS 209 Art. 12 - Almacenamiento CCTV"
                  className="w-full px-4 py-3 google-input rounded-2xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Descripción del Diagnóstico / Brecha</label>
                <textarea
                  value={editingItem.recommendation}
                  onChange={e => setEditingItem({ ...editingItem, recommendation: e.target.value })}
                  rows={2}
                  placeholder="Detalle de la vulnerabilidad o hallazgo normativo..."
                  className="w-full px-4 py-3 google-input rounded-2xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-brand-600">Acción Requerida para Disminuir Riesgo</label>
                <textarea
                  value={editingItem.actionRequired}
                  onChange={e => setEditingItem({ ...editingItem, actionRequired: e.target.value })}
                  rows={2}
                  placeholder="Paso a paso concreto de la medida a implementar..."
                  className="w-full px-4 py-3 google-input rounded-2xl outline-none border-brand-300"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Responsable del Cliente</label>
                  <input
                    type="text"
                    value={editingItem.responsible}
                    onChange={e => setEditingItem({ ...editingItem, responsible: e.target.value })}
                    placeholder="Ej: Jefe de Seguridad / Gerente de Operaciones"
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Fecha Límite</label>
                  <input
                    type="date"
                    value={editingItem.dueDate}
                    onChange={e => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Estado de Seguimiento</label>
                  <select
                    value={editingItem.status}
                    onChange={e => setEditingItem({ ...editingItem, status: e.target.value as ActionStatus })}
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none cursor-pointer"
                  >
                    <option value="pendiente">⏱️ Pendiente</option>
                    <option value="en_proceso">🔄 En Proceso</option>
                    <option value="completado">✅ Completado</option>
                    <option value="verificado">🛡️ Verificado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">% Avance ({editingItem.progress}%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.progress}
                    onChange={e => setEditingItem({ ...editingItem, progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Presupuesto Estimado CLP ($)</label>
                  <input
                    type="number"
                    value={editingItem.budgetEstimate || 0}
                    onChange={e => setEditingItem({ ...editingItem, budgetEstimate: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 google-input rounded-2xl outline-none font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Bitácora de Seguimiento / Notas de Verificación</label>
                <textarea
                  value={editingItem.notes || ''}
                  onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })}
                  rows={2}
                  placeholder="Observaciones de avance, número de factura, fecha de inspección..."
                  className="w-full px-4 py-3 google-input rounded-2xl outline-none"
                />
              </div>

            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs transition"
              >
                Cancelar
              </button>

              <button
                onClick={() => {
                  if (!editingItem.title.trim()) return alert("Por favor ingrese un título para la acción.");
                  handleUpdateItem(editingItem);
                }}
                className="flex-[2] py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-xs shadow-google transition"
              >
                Guardar Acción y Trazabilidad
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
