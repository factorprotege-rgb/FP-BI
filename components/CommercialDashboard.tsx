import React, { useState, useEffect, useMemo } from 'react';
import { Client, Branch, AuditRecord, UserRole, AppUser, ActionItem } from '../types';
import { 
  getClients, 
  getBranches, 
  saveClient, 
  saveBranch, 
  deleteClient, 
  deleteBranch, 
  getAppUsers,
  saveEnterpriseAudit
} from '../services/databaseService';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend 
} from 'recharts';

interface Props {
  userRole: UserRole;
  userName: string;
  onRoleChange: (role: UserRole) => void;
  onOpenAudit: (auditId?: string, branch?: Branch, client?: Client) => void;
  onStartNewForBranch: (branch: Branch, client: Client) => void;
  audits: AuditRecord[];
}

const formatCLP = (val: number) => `$${Math.round(val || 0).toLocaleString('es-CL')} CLP`;

export default function CommercialDashboard({
  userRole,
  userName,
  onRoleChange,
  onOpenAudit,
  onStartNewForBranch,
  audits
}: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'unica' | 'multisucursal'>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | 'Bajo' | 'Medio' | 'Alto'>('all');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('all');
  const [selectedEjecutivoFilter, setSelectedEjecutivoFilter] = useState<string>('all');
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});

  // Modals state
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [selectedClientForBranch, setSelectedClientForBranch] = useState<Client | null>(null);
  const [selectedBranchDetail, setSelectedBranchDetail] = useState<{ branch: Branch; client?: Client } | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);

  // Forms state for new Client
  const [newClientForm, setNewClientForm] = useState({
    rut: '',
    razonSocial: '',
    nombreFantasia: '',
    giro: 'Comercio Minorista / Retail',
    tipo: 'multisucursal' as 'unica' | 'multisucursal',
    representanteLegal: '',
    contactoPrincipal: '',
    cargoContacto: '',
    email: '',
    telefono: '',
    ejecutivoNombre: 'Andrés Silva Vergara',
    supervisorNombre: 'Carlos Valenzuela Ríos',
    // Initial branch info
    sucursalNombre: 'Casa Matriz / Sucursal Principal',
    sucursalComuna: 'Santiago',
    sucursalRegion: 'Región Metropolitana de Santiago',
    sucursalDireccion: ''
  });

  // Forms state for new Branch
  const [newBranchForm, setNewBranchForm] = useState({
    nombre: '',
    codigoSucursal: '',
    esMatriz: false,
    region: 'Región Metropolitana de Santiago',
    comuna: 'Providencia',
    direccion: '',
    encargadoLocal: '',
    cargoEncargado: 'Encargado de Seguridad',
    telefono: '',
    email: ''
  });

  // Reload data
  const loadData = async () => {
    setLoading(true);
    try {
      const [cList, bList, uList] = await Promise.all([
        getClients(),
        getBranches(),
        getAppUsers()
      ]);
      setClients(cList);
      setBranches(bList);
      setUsers(uList);

      // Auto expand all clients by default for rich visualization
      const initialExp: Record<string, boolean> = {};
      cList.forEach(c => { initialExp[c.id] = true; });
      setExpandedClients(initialExp);
    } catch (e) {
      console.error("Error loading enterprise dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [audits]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const multiClients = clients.filter(c => c.tipo === 'multisucursal').length;
    const singleClients = clients.filter(c => c.tipo === 'unica').length;
    const totalBranches = branches.length;

    let totalCotizado = 0;
    let totalGanado = 0;
    let totalPerdido = 0;
    let highRiskBranches = 0;
    let medRiskBranches = 0;
    let lowRiskBranches = 0;

    branches.forEach(b => {
      totalCotizado += (b.montoCotizadoTotal || 0);
      totalGanado += (b.montoGanadoTotal || 0);
      totalPerdido += (b.montoPerdidoTotal || 0);

      if (b.riskLevel === 'Alto') highRiskBranches++;
      else if (b.riskLevel === 'Medio') medRiskBranches++;
      else if (b.riskLevel === 'Bajo') lowRiskBranches++;
    });

    const conversionRate = totalCotizado > 0 ? (totalGanado / totalCotizado) * 100 : 0;
    const pendingReviewAudits = audits.filter(a => a.status === 'pending_review').length;

    return {
      totalClients,
      multiClients,
      singleClients,
      totalBranches,
      totalCotizado,
      totalGanado,
      totalPerdido,
      conversionRate,
      highRiskBranches,
      medRiskBranches,
      lowRiskBranches,
      pendingReviewAudits
    };
  }, [clients, branches, audits]);

  // Unique regions and ejecutivos for filters
  const uniqueRegions = useMemo(() => {
    const set = new Set<string>();
    branches.forEach(b => { if (b.region) set.add(b.region); });
    return Array.from(set).sort();
  }, [branches]);

  const uniqueEjecutivos = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => { if (c.ejecutivoNombre) set.add(c.ejecutivoNombre); });
    return Array.from(set).sort();
  }, [clients]);

  // Filtered clients and branches
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // Role-specific scoping if Ejecutivo
      if (userRole === 'ejecutivo_comercial' && selectedEjecutivoFilter === 'all') {
        // If ejecutivo, filter to matching assigned clients or show all if match
      }

      // Search query matches client name, RUT or any of its branches
      const q = searchQuery.toLowerCase().trim();
      const clientBranches = branches.filter(b => b.clientId === c.id);
      
      const matchesSearch = !q || 
        c.razonSocial.toLowerCase().includes(q) ||
        c.nombreFantasia.toLowerCase().includes(q) ||
        c.rut.toLowerCase().includes(q) ||
        clientBranches.some(b => b.nombre.toLowerCase().includes(q) || b.comuna.toLowerCase().includes(q) || b.direccion.toLowerCase().includes(q));

      const matchesType = selectedTypeFilter === 'all' || c.tipo === selectedTypeFilter;
      
      const matchesEjecutivo = selectedEjecutivoFilter === 'all' || c.ejecutivoNombre === selectedEjecutivoFilter;

      const matchesRisk = selectedRiskFilter === 'all' || clientBranches.some(b => b.riskLevel === selectedRiskFilter);

      const matchesRegion = selectedRegionFilter === 'all' || clientBranches.some(b => b.region === selectedRegionFilter);

      return matchesSearch && matchesType && matchesEjecutivo && matchesRisk && matchesRegion;
    });
  }, [clients, branches, searchQuery, selectedTypeFilter, selectedRiskFilter, selectedRegionFilter, selectedEjecutivoFilter, userRole]);

  // Toggle client accordion
  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  // Handle create client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientForm.rut || !newClientForm.razonSocial) {
      alert("Ingrese RUT y Razón Social");
      return;
    }

    const clientId = 'cli_' + Date.now().toString(36);
    const branchId = 'br_' + Date.now().toString(36);

    const client: Client = {
      id: clientId,
      rut: newClientForm.rut,
      razonSocial: newClientForm.razonSocial,
      nombreFantasia: newClientForm.nombreFantasia || newClientForm.razonSocial,
      giro: newClientForm.giro,
      tipo: newClientForm.tipo,
      representanteLegal: newClientForm.representanteLegal,
      contactoPrincipal: newClientForm.contactoPrincipal,
      cargoContacto: newClientForm.cargoContacto,
      email: newClientForm.email,
      telefono: newClientForm.telefono,
      ejecutivoNombre: newClientForm.ejecutivoNombre,
      supervisorNombre: newClientForm.supervisorNombre,
      sucursalesCount: 1,
      totalMontoCotizado: 0,
      totalMontoGanado: 0,
      riesgoGlobal: 'Medio',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const initialBranch: Branch = {
      id: branchId,
      clientId: clientId,
      clientRut: client.rut,
      clientRazonSocial: client.razonSocial,
      nombre: newClientForm.sucursalNombre || 'Casa Matriz',
      codigoSucursal: 'SUC-001',
      esMatriz: true,
      region: newClientForm.sucursalRegion,
      comuna: newClientForm.sucursalComuna,
      direccion: newClientForm.sucursalDireccion,
      encargadoLocal: newClientForm.contactoPrincipal,
      cargoEncargado: newClientForm.cargoContacto || 'Administrador Local',
      telefono: newClientForm.telefono,
      email: newClientForm.email,
      activo: true,
      scoreSnapshot: 5.0,
      riskLevel: 'Medio',
      totalBrechas: 0,
      brechasResueltas: 0,
      montoCotizadoTotal: 0,
      montoGanadoTotal: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveClient(client);
    await saveBranch(initialBranch);
    setShowNewClientModal(false);
    await loadData();
    alert(`Cliente ${client.razonSocial} y sucursal registrados con éxito en la base de datos.`);
  };

  // Handle create branch for existing client
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForBranch || !newBranchForm.nombre) {
      alert("Ingrese nombre de la sucursal");
      return;
    }

    const clientBranches = branches.filter(b => b.clientId === selectedClientForBranch.id);
    const branchId = 'br_' + Date.now().toString(36);
    const nextNum = clientBranches.length + 1;
    const branchCode = newBranchForm.codigoSucursal || `SUC-00${nextNum}`;

    const newBranch: Branch = {
      id: branchId,
      clientId: selectedClientForBranch.id,
      clientRut: selectedClientForBranch.rut,
      clientRazonSocial: selectedClientForBranch.razonSocial,
      nombre: newBranchForm.nombre,
      codigoSucursal: branchCode,
      esMatriz: newBranchForm.esMatriz,
      region: newBranchForm.region,
      comuna: newBranchForm.comuna,
      direccion: newBranchForm.direccion,
      encargadoLocal: newBranchForm.encargadoLocal,
      cargoEncargado: newBranchForm.cargoEncargado,
      telefono: newBranchForm.telefono,
      email: newBranchForm.email,
      activo: true,
      scoreSnapshot: 6.0,
      riskLevel: 'Medio',
      totalBrechas: 0,
      brechasResueltas: 0,
      montoCotizadoTotal: 0,
      montoGanadoTotal: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveBranch(newBranch);
    
    // Update client branches count
    const updatedClient: Client = {
      ...selectedClientForBranch,
      sucursalesCount: clientBranches.length + 1,
      tipo: 'multisucursal'
    };
    await saveClient(updatedClient);

    setShowNewBranchModal(false);
    setSelectedClientForBranch(null);
    await loadData();
    alert(`Sucursal ${newBranch.nombre} añadida con éxito.`);
  };

  // Chart: Risk breakdown data
  const riskPieData = [
    { name: 'Riesgo Alto', value: metrics.highRiskBranches, color: '#ef4444' },
    { name: 'Riesgo Medio', value: metrics.medRiskBranches, color: '#f59e0b' },
    { name: 'Riesgo Bajo', value: metrics.lowRiskBranches, color: '#10b981' }
  ].filter(d => d.value > 0);

  // Chart: Top clients by commercial pipeline
  const clientPipelineData = clients
    .map(c => {
      const cBranches = branches.filter(b => b.clientId === c.id);
      const cotizado = cBranches.reduce((acc, b) => acc + (b.montoCotizadoTotal || 0), 0);
      const ganado = cBranches.reduce((acc, b) => acc + (b.montoGanadoTotal || 0), 0);
      return {
        name: c.nombreFantasia || c.razonSocial.slice(0, 18),
        cotizado: cotizado / 1000000,
        ganado: ganado / 1000000,
        sucursales: cBranches.length
      };
    })
    .sort((a, b) => b.cotizado - a.cotizado)
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Top Header & Role Switcher */}
      <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-full text-xs font-black uppercase tracking-wider border border-brand-200 dark:border-brand-800">
                Base de Datos y Estructura Multi-Sucursal
              </span>
              <span className="text-xs text-slate-400 font-medium">Ley 21.659 & DS 209</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
              <span>🏢</span> Panel Ejecutivo & Gestión Zonal
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Monitoreo y segmentación de clientes agrupados por <strong>RUT</strong>, <strong>Sucursal</strong> o <strong>Multisucursal</strong> con control de riesgo normativo y oportunidades comerciales.
            </p>
          </div>

          {/* Quick Profile/Role Switcher */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
              Perfil Activo:
            </div>
            <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full sm:w-auto">
              <button
                onClick={() => onRoleChange('gerente_comercial')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  userRole === 'gerente_comercial'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>👔</span> Gerente Comercial
              </button>
              <button
                onClick={() => onRoleChange('supervisor')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  userRole === 'supervisor'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>🛡️</span> Supervisor Zonal
              </button>
              <button
                onClick={() => onRoleChange('ejecutivo_comercial')}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  userRole === 'ejecutivo_comercial'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>💼</span> Ejecutivo Comercial
              </button>
            </div>
          </div>
        </div>

        {/* Action button bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-[#3c4043] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {metrics.totalClients} Clientes Corporativos (RUTs) • {metrics.totalBranches} Sucursales Monitoreadas
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewClientModal(true)}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <span>➕</span> Registrar Nuevo Cliente (RUT)
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip - Role Adapted */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Clientes y Sucursales */}
        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-[#3c4043] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cartera Corporativa</span>
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-lg">🏢</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalClients}</span>
            <span className="text-xs text-slate-500 font-semibold">RUTs únicos</span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
              🏢 {metrics.multiClients} Multisucursal
            </span>
            <span>•</span>
            <span>🏬 {metrics.singleClients} Sucursal Única</span>
          </div>
        </div>

        {/* Card 2: Sucursales y Nivel de Riesgo */}
        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-[#3c4043] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {userRole === 'supervisor' ? 'Sucursales Supervisadas' : 'Total Sucursales en Red'}
            </span>
            <span className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-lg">📍</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{metrics.totalBranches}</span>
            <span className="text-xs text-slate-500 font-semibold">locales / matrices</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold">
              🔴 {metrics.highRiskBranches} Críticas
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold">
              🟡 {metrics.medRiskBranches} Medias
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
              🟢 {metrics.lowRiskBranches} Bajas
            </span>
          </div>
        </div>

        {/* Card 3: Oportunidades Ganadas y Conversión */}
        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-[#3c4043] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas Concretadas</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-lg">💚</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
            {formatCLP(metrics.totalGanado)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span>Conversión:</span>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded font-black">
              {metrics.conversionRate.toFixed(1)}% de éxito
            </span>
          </div>
        </div>

        {/* Card 4: Pipeline Cotizado Activo */}
        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-[#3c4043] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pipeline Cotizado Total</span>
            <span className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl text-lg">📊</span>
          </div>
          <div className="text-2xl font-black text-brand-600 dark:text-brand-400 truncate">
            {formatCLP(metrics.totalCotizado)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
            <span>Perdidas: <span className="text-red-500">{formatCLP(metrics.totalPerdido)}</span></span>
            {metrics.pendingReviewAudits > 0 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">
                ⚠️ {metrics.pendingReviewAudits} x Visar
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Role specific Banner / Callout */}
      {userRole === 'supervisor' && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🛡️</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Modo Supervisor Zonal Activo</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Visualice la trazabilidad de mitigaciones por sucursal y revise las evaluaciones de terreno antes de emitir el Estudio de Seguridad final.
              </p>
            </div>
          </div>
          {metrics.pendingReviewAudits > 0 && (
            <div className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm animate-pulse">
              <span>⚠️</span> {metrics.pendingReviewAudits} Evaluaciones pendientes de visación técnica
            </div>
          )}
        </div>
      )}

      {userRole === 'gerente_comercial' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-200 dark:border-blue-800/40 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-3xl">👔</span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Consola de Control Gerencial</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Análisis consolidado de cartera de clientes, desempeño por sucursal y conversión de mitigaciones en soluciones comerciales.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <span>📈 Tasa de Cierre: {metrics.conversionRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Visual Analytics Row: Distribution & Commercial Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Pipeline por Cliente (Top 5) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Pipeline & Ventas por Cliente ($ Millones CLP)</h3>
              <p className="text-xs text-slate-500">Monto cotizado en mitigaciones vs monto adjudicado/ganado.</p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-lg">Top Cuentas</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientPipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="M" />
                <Tooltip 
                  formatter={(val: number) => [`$${val.toFixed(1)} Millones CLP`, '']}
                  contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="cotizado" name="Monto Cotizado ($M)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ganado" name="Venta Ganada ($M)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Semaforización de Sucursales */}
        <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Distribución de Riesgo en Sucursales</h3>
            <p className="text-xs text-slate-500 mb-4">Clasificación según vulnerabilidades DS 209.</p>

            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val} Sucursales`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalBranches}</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Sucursales</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Riesgo Alto ({metrics.highRiskBranches})
              </span>
              <span className="text-slate-500 font-semibold">{((metrics.highRiskBranches / (metrics.totalBranches || 1)) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Riesgo Medio ({metrics.medRiskBranches})
              </span>
              <span className="text-slate-500 font-semibold">{((metrics.medRiskBranches / (metrics.totalBranches || 1)) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Riesgo Bajo ({metrics.lowRiskBranches})
              </span>
              <span className="text-slate-500 font-semibold">{((metrics.lowRiskBranches / (metrics.totalBranches || 1)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#202124] rounded-2xl border border-slate-200 dark:border-[#3c4043] p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por RUT, Razón Social, Nombre de Fantasía o Sucursal..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500 dark:focus:border-brand-400 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedTypeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              Todos ({clients.length})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('multisucursal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${selectedTypeFilter === 'multisucursal' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <span>🏢</span> Multisucursal
            </button>
            <button
              onClick={() => setSelectedTypeFilter('unica')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${selectedTypeFilter === 'unica' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'}`}
            >
              <span>🏬</span> Sucursal Única
            </button>
          </div>
        </div>

        {/* Secondary dropdown filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold">
            <span>Filtros avanzados:</span>
          </div>

          {/* Risk Filter */}
          <select
            value={selectedRiskFilter}
            onChange={e => setSelectedRiskFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">🛡️ Todos los Niveles de Riesgo</option>
            <option value="Alto">🔴 Riesgo Alto</option>
            <option value="Medio">🟡 Riesgo Medio</option>
            <option value="Bajo">🟢 Riesgo Bajo</option>
          </select>

          {/* Region Filter */}
          <select
            value={selectedRegionFilter}
            onChange={e => setSelectedRegionFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">📍 Todas las Regiones</option>
            {uniqueRegions.map(reg => (
              <option key={reg} value={reg}>{reg}</option>
            ))}
          </select>

          {/* Ejecutivo Filter */}
          <select
            value={selectedEjecutivoFilter}
            onChange={e => setSelectedEjecutivoFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">💼 Todos los Ejecutivos</option>
            {uniqueEjecutivos.map(ej => (
              <option key={ej} value={ej}>{ej}</option>
            ))}
          </select>

          {(selectedRiskFilter !== 'all' || selectedRegionFilter !== 'all' || selectedEjecutivoFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedRiskFilter('all');
                setSelectedRegionFilter('all');
                setSelectedEjecutivoFilter('all');
                setSelectedTypeFilter('all');
                setSearchQuery('');
              }}
              className="px-2.5 py-1 text-slate-500 hover:text-red-500 font-bold underline transition"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Table / Client Cards Grouped by RUT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-lg font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
            <span>🗂️</span> Clientes Agrupados por RUT y Red de Sucursales ({filteredClients.length})
          </h2>
          <span className="text-xs text-slate-400">Haga clic en cada cliente para desplegar sus sucursales</span>
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] p-12 text-center">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">No se encontraron clientes coincidentes</h3>
            <p className="text-xs text-slate-500 mt-1">Pruebe ajustando los filtros de búsqueda o registre un nuevo cliente.</p>
            <button
              onClick={() => {
                setSelectedRiskFilter('all');
                setSelectedRegionFilter('all');
                setSelectedEjecutivoFilter('all');
                setSelectedTypeFilter('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          filteredClients.map(client => {
            const clientBranches = branches.filter(b => b.clientId === client.id);
            const isExpanded = !!expandedClients[client.id];
            const clientCotizado = clientBranches.reduce((acc, b) => acc + (b.montoCotizadoTotal || 0), 0);
            const clientGanado = clientBranches.reduce((acc, b) => acc + (b.montoGanadoTotal || 0), 0);
            const clientPerdido = clientBranches.reduce((acc, b) => acc + (b.montoPerdidoTotal || 0), 0);

            // Worst risk among branches
            const hasHigh = clientBranches.some(b => b.riskLevel === 'Alto');
            const hasMed = clientBranches.some(b => b.riskLevel === 'Medio');
            const clientRisk = hasHigh ? 'Alto' : hasMed ? 'Medio' : 'Bajo';

            return (
              <div 
                key={client.id}
                className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] shadow-sm overflow-hidden transition-all"
              >
                {/* Client Header Bar */}
                <div 
                  onClick={() => toggleClient(client.id)}
                  className="p-5 md:p-6 bg-slate-50/70 dark:bg-slate-800/30 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-100 dark:border-[#3c4043] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800/40 flex items-center justify-center text-xl flex-shrink-0">
                      {client.tipo === 'multisucursal' ? '🏢' : '🏬'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          RUT: {client.rut}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          client.tipo === 'multisucursal'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {client.tipo === 'multisucursal' ? `🏢 Multisucursal (${clientBranches.length} locales)` : '🏬 Sucursal Única'}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          clientRisk === 'Alto' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          clientRisk === 'Medio' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          Riesgo {clientRisk}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {client.razonSocial}
                        {client.nombreFantasia && client.nombreFantasia !== client.razonSocial && (
                          <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                            ({client.nombreFantasia})
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                        <span>🏷️ {client.giro}</span>
                        <span>•</span>
                        <span>👤 Contacto: {client.contactoPrincipal || 'Sin contacto'}</span>
                        <span>•</span>
                        <span>💼 Ejecutivo: {client.ejecutivoNombre || 'No asignado'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Financial & Branch stats */}
                  <div className="flex flex-wrap items-center gap-4 lg:gap-6 justify-between lg:justify-end">
                    <div className="text-left lg:text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Ventas Ganadas</div>
                      <div className="text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatCLP(clientGanado)}
                      </div>
                    </div>

                    <div className="text-left lg:text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cotizado Total</div>
                      <div className="text-sm md:text-base font-bold text-slate-700 dark:text-slate-200">
                        {formatCLP(clientCotizado)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClientForBranch(client);
                          setShowNewBranchModal(true);
                        }}
                        className="p-2 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 rounded-xl border border-brand-200 dark:border-brand-800 transition"
                        title="Agregar Sucursal a este Cliente"
                      >
                        ➕ Sucursal
                      </button>

                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 transition-transform duration-300">
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Branch Cards / Table */}
                {isExpanded && (
                  <div className="p-5 md:p-6 bg-white dark:bg-[#202124] space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Detalle de Sucursales ({clientBranches.length})
                      </span>
                      {clientBranches.length > 1 && (
                        <span className="text-xs text-brand-600 dark:text-brand-400 font-bold">
                          Matriz comparativa de riesgo activa
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {clientBranches.map(branch => {
                        const branchAudit = audits.find(a => a.id === branch.currentAuditId || (a.branchId === branch.id));
                        const statusLabel = branchAudit ? branchAudit.status : 'Sin Auditoría';

                        return (
                          <div
                            key={branch.id}
                            className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 hover:shadow-md transition flex flex-col justify-between"
                          >
                            <div>
                              {/* Top Tag Bar */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-1.5">
                                  {branch.esMatriz ? (
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[10px] font-black rounded-md uppercase">
                                      🏛️ Casa Matriz
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded-md uppercase">
                                      {branch.codigoSucursal || 'Sucursal'}
                                    </span>
                                  )}
                                </div>

                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                                  branch.riskLevel === 'Alto' ? 'bg-red-100 text-red-700 border border-red-200' :
                                  branch.riskLevel === 'Medio' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                  'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                }`}>
                                  Score {branch.scoreSnapshot ? branch.scoreSnapshot.toFixed(2) : 'N/A'} • {branch.riskLevel || 'Medio'}
                                </span>
                              </div>

                              {/* Branch Name & Address */}
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1 mb-1">
                                {branch.nombre}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-3">
                                <span>📍</span> {branch.direccion}, {branch.comuna}
                              </p>

                              {/* Branch Contact & Brechas */}
                              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Encargado Local:</span>
                                  <span className="font-semibold truncate max-w-[150px]">{branch.encargadoLocal || 'No asignado'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Brechas Detectadas:</span>
                                  <span className="font-bold text-red-500">{branch.totalBrechas || 0} brechas ({branch.brechasResueltas || 0} resueltas)</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Venta Ganada:</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCLP(branch.montoGanadoTotal || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Monto Cotizado:</span>
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatCLP(branch.montoCotizadoTotal || 0)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Branch Action Buttons */}
                            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (branchAudit) {
                                    onOpenAudit(branchAudit.id, branch, client);
                                  } else {
                                    onStartNewForBranch(branch, client);
                                  }
                                }}
                                className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                              >
                                <span>🛡️</span> {branchAudit ? 'Ver / Editar Estudio' : 'Evaluar Sucursal'}
                              </button>

                              <button
                                onClick={() => setSelectedBranchDetail({ branch, client })}
                                className="p-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                                title="Ficha Técnica 360°"
                              >
                                👁️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: REGISTRAR NUEVO CLIENTE */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] max-w-2xl w-full p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-[#3c4043]">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-brand-50 text-brand-600 rounded-2xl text-xl">🏢</span>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Registrar Nuevo Cliente Corporativo</h3>
                  <p className="text-xs text-slate-500">Estructura por RUT y Sucursal Principal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">RUT Empresa *</label>
                  <input
                    required
                    value={newClientForm.rut}
                    onChange={e => setNewClientForm(p => ({ ...p, rut: e.target.value }))}
                    placeholder="Ej: 76.543.210-K"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Tipo de Cliente *</label>
                  <select
                    value={newClientForm.tipo}
                    onChange={e => setNewClientForm(p => ({ ...p, tipo: e.target.value as any }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none"
                  >
                    <option value="multisucursal">🏢 Multisucursal (Varias sedes/locales)</option>
                    <option value="unica">🏬 Sucursal Única (Casa Matriz única)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Razón Social *</label>
                  <input
                    required
                    value={newClientForm.razonSocial}
                    onChange={e => setNewClientForm(p => ({ ...p, razonSocial: e.target.value }))}
                    placeholder="Ej: Inversiones y Servicios Globales S.A."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Nombre de Fantasía</label>
                  <input
                    value={newClientForm.nombreFantasia}
                    onChange={e => setNewClientForm(p => ({ ...p, nombreFantasia: e.target.value }))}
                    placeholder="Ej: Global Mart"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Giro Comercial</label>
                  <input
                    value={newClientForm.giro}
                    onChange={e => setNewClientForm(p => ({ ...p, giro: e.target.value }))}
                    placeholder="Ej: Retail, Logística, Salud..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Contacto Principal</label>
                  <input
                    value={newClientForm.contactoPrincipal}
                    onChange={e => setNewClientForm(p => ({ ...p, contactoPrincipal: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Email Corporativo</label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={e => setNewClientForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="seguridad@empresa.cl"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Ejecutivo Asignado</label>
                  <input
                    value={newClientForm.ejecutivoNombre}
                    onChange={e => setNewClientForm(p => ({ ...p, ejecutivoNombre: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Supervisor Zonal</label>
                  <input
                    value={newClientForm.supervisorNombre}
                    onChange={e => setNewClientForm(p => ({ ...p, supervisorNombre: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              {/* Initial Branch Box */}
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-extrabold uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                  📍 Datos de la Sucursal Principal / Casa Matriz
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block">Nombre de la Sucursal</label>
                    <input
                      value={newClientForm.sucursalNombre}
                      onChange={e => setNewClientForm(p => ({ ...p, sucursalNombre: e.target.value }))}
                      placeholder="Ej: Sucursal Central Providencia"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block">Comuna</label>
                    <input
                      value={newClientForm.sucursalComuna}
                      onChange={e => setNewClientForm(p => ({ ...p, sucursalComuna: e.target.value }))}
                      placeholder="Ej: Las Condes, Santiago, etc."
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block">Dirección</label>
                    <input
                      value={newClientForm.sucursalDireccion}
                      onChange={e => setNewClientForm(p => ({ ...p, sucursalDireccion: e.target.value }))}
                      placeholder="Ej: Av. Apoquindo 4500"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#3c4043]">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
                >
                  Guardar Cliente y Crear Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR SUCURSAL A CLIENTE EXISTENTE */}
      {showNewBranchModal && selectedClientForBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] max-w-xl w-full p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-[#3c4043]">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase">Agregar Sucursal a:</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedClientForBranch.razonSocial}</h3>
                <p className="text-xs text-slate-400 font-mono">RUT: {selectedClientForBranch.rut}</p>
              </div>
              <button 
                onClick={() => { setShowNewBranchModal(false); setSelectedClientForBranch(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Nombre de la Sucursal *</label>
                <input
                  required
                  value={newBranchForm.nombre}
                  onChange={e => setNewBranchForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Sucursal Mall Plaza Vespucio (Local 240)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Código Sucursal</label>
                  <input
                    value={newBranchForm.codigoSucursal}
                    onChange={e => setNewBranchForm(p => ({ ...p, codigoSucursal: e.target.value }))}
                    placeholder="Ej: SUC-005-RM"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Comuna *</label>
                  <input
                    required
                    value={newBranchForm.comuna}
                    onChange={e => setNewBranchForm(p => ({ ...p, comuna: e.target.value }))}
                    placeholder="Ej: La Florida"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Dirección Exacta</label>
                <input
                  value={newBranchForm.direccion}
                  onChange={e => setNewBranchForm(p => ({ ...p, direccion: e.target.value }))}
                  placeholder="Calle, número, local"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Encargado Local</label>
                  <input
                    value={newBranchForm.encargadoLocal}
                    onChange={e => setNewBranchForm(p => ({ ...p, encargadoLocal: e.target.value }))}
                    placeholder="Nombre y apellido"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 block mb-1">Teléfono</label>
                  <input
                    value={newBranchForm.telefono}
                    onChange={e => setNewBranchForm(p => ({ ...p, telefono: e.target.value }))}
                    placeholder="+56 9 ..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#3c4043]">
                <button
                  type="button"
                  onClick={() => { setShowNewBranchModal(false); setSelectedClientForBranch(null); }}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg transition"
                >
                  Añadir Sucursal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FICHA TÉCNICA 360° SUCURSAL */}
      {selectedBranchDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#202124] rounded-3xl border border-slate-200 dark:border-[#3c4043] max-w-2xl w-full p-6 md:p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-[#3c4043]">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase">Ficha Técnica de Sucursal</span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedBranchDetail.branch.nombre}</h3>
                <p className="text-xs text-slate-400">{selectedBranchDetail.client?.razonSocial} (RUT: {selectedBranchDetail.branch.clientRut})</p>
              </div>
              <button 
                onClick={() => setSelectedBranchDetail(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Score & Risk Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                selectedBranchDetail.branch.riskLevel === 'Alto' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 text-red-800 dark:text-red-300' :
                selectedBranchDetail.branch.riskLevel === 'Medio' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-800 dark:text-amber-300' :
                'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-800 dark:text-emerald-300'
              }`}>
                <div>
                  <span className="text-xs font-bold uppercase block">Nivel de Vulnerabilidad DS 209</span>
                  <span className="text-2xl font-black">Riesgo {selectedBranchDetail.branch.riskLevel} ({selectedBranchDetail.branch.scoreSnapshot?.toFixed(2) || 'N/A'})</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold block">Brechas Registradas</span>
                  <span className="text-lg font-bold">{selectedBranchDetail.branch.totalBrechas || 0} brechas</span>
                </div>
              </div>

              {/* Data fields */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Ubicación y Comuna</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBranchDetail.branch.direccion}, {selectedBranchDetail.branch.comuna}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Región</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBranchDetail.branch.region}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Encargado Local</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBranchDetail.branch.encargadoLocal || 'No informado'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Teléfono / Contacto</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedBranchDetail.branch.telefono || 'Sin teléfono'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Venta Ganada Adjudicada</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCLP(selectedBranchDetail.branch.montoGanadoTotal || 0)}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <span className="text-slate-400 block font-semibold">Monto Cotizado Activo</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">{formatCLP(selectedBranchDetail.branch.montoCotizadoTotal || 0)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#3c4043]">
                <button
                  onClick={() => setSelectedBranchDetail(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    const branch = selectedBranchDetail.branch;
                    const client = selectedBranchDetail.client;
                    setSelectedBranchDetail(null);
                    if (branch.currentAuditId) {
                      onOpenAudit(branch.currentAuditId, branch, client);
                    } else if (client) {
                      onStartNewForBranch(branch, client);
                    }
                  }}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  Ir al Estudio Técnico →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
