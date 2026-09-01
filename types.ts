
export type IndicatorType = 'select' | 'aditivo-criticidad' | 'select-cash' | 'aditivo-cualidades' | 'aditivo-horario' | 'aditivo-rutas';

export type UserRole = 'gerente_comercial' | 'supervisor' | 'ejecutivo_comercial' | 'consultant' | 'authority';

export type AuditStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export type ActionStatus = 'pendiente' | 'en_proceso' | 'completado' | 'verificado';
export type ActionPriority = 'alta' | 'media' | 'baja';
export type ActionCategory = 'CCTV y Alarmas' | 'Seguridad Física' | 'Recursos Humanos y OS-10' | 'Protocolos y Procedimientos' | 'Control de Acceso' | 'Entorno y Comunicaciones';
export type CommercialOutcome = 'sin_cotizar' | 'cotizado' | 'ganada' | 'perdida' | 'no_aplica';

export type ClientType = 'unica' | 'multisucursal';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  zone?: string;
  avatar?: string;
}

export interface Branch {
  id: string;
  clientId: string; // Foreign key al cliente por ID
  clientRut: string; // RUT del cliente
  clientRazonSocial: string;
  nombre: string; // Ej: "Sucursal Mall Plaza Oeste", "Casa Matriz Providencia"
  codigoSucursal?: string; // Ej: "SUC-001"
  esMatriz: boolean;
  region: string;
  comuna: string;
  direccion: string;
  coords?: string;
  encargadoLocal?: string;
  cargoEncargado?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  
  // Métricas y estado de la sucursal
  currentAuditId?: string;
  lastAuditDate?: number;
  scoreSnapshot?: number;
  riskLevel?: 'Bajo' | 'Medio' | 'Alto';
  totalBrechas?: number;
  brechasResueltas?: number;
  montoCotizadoTotal?: number; // CLP
  montoGanadoTotal?: number; // CLP
  montoPerdidoTotal?: number; // CLP
  createdAt: number;
  updatedAt: number;
}

export interface Client {
  id: string;
  rut: string; // Identificador clave: RUT chileno (ej: "76.432.100-K")
  razonSocial: string;
  nombreFantasia: string;
  giro: string;
  tipo: ClientType; // 'unica' | 'multisucursal'
  representanteLegal: string;
  contactoPrincipal: string;
  cargoContacto?: string;
  email: string;
  telefono: string;
  
  // Asignaciones de equipo
  ejecutivoId?: string;
  ejecutivoNombre?: string;
  supervisorId?: string;
  supervisorNombre?: string;
  
  // Métricas agregadas
  sucursalesCount: number;
  totalMontoCotizado?: number;
  totalMontoGanado?: number;
  riesgoGlobal?: 'Bajo' | 'Medio' | 'Alto';
  
  createdAt: number;
  updatedAt: number;
}

export interface ActionStatusLog {
  id: string;
  timestamp: number;
  fromStatus?: ActionStatus;
  toStatus: ActionStatus;
  changedBy: string; // Quien cambia la etapa (Supervisor, Consultor, Evaluador, etc)
  executor: string; // Quién realiza la acción/mitigación (Factor Protege, Cliente, Proveedor X)
  notes?: string;
  commercialOutcome?: CommercialOutcome;
}

export interface ActionItem {
  id: string;
  title: string;
  category: ActionCategory;
  priority: ActionPriority;
  vulnerabilityRef?: string;
  recommendation: string;
  actionRequired: string;
  responsible: string; // Responsable interno del cliente
  executor?: string; // Quien realiza la acción y mitigación de la brecha (ej: Factor Protege, Proveedor X)
  dueDate: string;
  status: ActionStatus;
  progress: number; // 0 - 100
  budgetEstimate?: number; // CLP
  notes?: string;
  updatedAt?: number;
  
  // Trazabilidad y Oportunidades de Venta
  commercialOutcome?: CommercialOutcome;
  opportunityValue?: number; // Valor CLP de la cotización/venta
  lostReason?: string; // Razón si la oportunidad fue perdida
  statusHistory?: ActionStatusLog[];
}

export interface Option {
  label: string;
  value: number;
}

export interface IndicatorDef {
  id: string;
  title: string;
  type: IndicatorType;
  options: Option[];
  helperText?: string;
  description?: string;
  evaluatorGuide?: string;
}

export interface AIReportConfig {
  focus: 'balanced' | 'normative' | 'operational' | 'technical' | 'concise' | 'standard_audit' | 'detailed_forensic';
  businessContext: string;
  websiteUrl: string;
  crimeStats: string;
  surroundings: string;
  historicalContext?: string;
  attachedDocsContext?: string;
  customInstructions?: string; 
}

export interface RiskData {
  // Relaciones corporativas y multi-sucursal
  clientId?: string;
  branchId?: string;
  branchName?: string;
  clientRut?: string;
  clientType?: ClientType;
  ejecutivoNombre?: string;
  supervisorNombre?: string;

  entidad: string;
  rut: string;
  representanteLegal: string; // Nuevo para Estudio de Seguridad
  medidasExistentes: string;   // Nuevo para Estudio de Seguridad
  giro: string;
  comuna: string;
  direccion: string;
  coords: string;
  auditorName?: string; 
  companyLogo?: string;
  
  startTime?: number;
  endTime?: number;

  evidencias: string; 
  notas: string;
  
  observations: Record<string, string>;
  evidenceRefs: Record<string, string>; 

  signature?: string; 
  vulnerabilityPhotos?: Record<string, string>;

  // DS 209 specific fields
  tipoEntidad?: string;
  region?: string;
  responsable?: string;
  cargoResponsable?: string;
  actividadPrincipal?: string;
  horarioFuncionamiento?: string;
  horarioMayorAfluencia?: string;
  operaNocturno?: 'SI' | 'NO';
  trabajadores?: number;
  afluenciaDiaria?: number;
  flujoEfectivo?: number;
  valorActivos?: number;
  retiroValores?: string;
  frecuenciaRetiro?: string;
  activoCriticoPrincipal?: string;
  superficieTerreno?: number;
  superficieConstruida?: number;

  // Physical Security
  tipoControlAcceso?: string;
  controlAccesos?: string;
  estadoCierre?: string;
  alturaRejas?: string;
  cierrePerimetral?: string;
  nivelIluminacion?: string;
  iluminacion?: string;
  cantidadPuntosCiegos?: number;
  puntosCiegos?: string;

  // CCTV & Alarms
  cctv?: 'SI' | 'NO';
  cantidadCamaras?: number;
  resolucionCamaras?: string;
  grabacionDias?: number;
  almacenamientoCCTV?: string;
  coberturaCCTV?: string; // Comma separated checks
  alarma?: 'SI' | 'NO';
  tipoAlarma?: string;
  monitoreo?: 'SI' | 'NO';
  empresaMonitoreo?: string;
  tiempoRespuesta?: string;
  sistemasPrevAlarma?: string;

  // HR & Security Personnel
  guardias?: number;
  turnosGuardias?: string;
  guardiasOS10?: 'SI' | 'NO';
  empresaGuardias?: string;
  encargadoSeguridad?: 'SI' | 'NO';
  nombreEncargado?: string;
  comunicaciones?: string; // Comma separated checks

  // Environment & Context
  clasificacionEntorno?: string;
  nivelDelictual?: string;
  entorno?: string;
  rutasEscape?: string;
  delitosFrecuentes?: string;

  // Protocols
  protocoloApertura?: 'SI' | 'NO';
  protocoloCierre?: 'SI' | 'NO';
  protocoloRobo?: 'SI' | 'NO';
  protocoloAlarma?: 'SI' | 'NO';
  protocoloVisitas?: 'SI' | 'NO';
  protocoloValores?: 'SI' | 'NO';
  capacitacionUltimaFecha?: string;
  observaciones?: string;
  evidenciaUrl?: string;

  actionPlan?: ActionItem[];

  [key: string]: string | number | number[] | string[] | Record<string, string> | any; 
}

export interface AuditRecord extends RiskData {
  id: string;
  lastModified: number;
  scoreSnapshot: number;
  classificationSnapshot: string;
  roleSnapshot?: UserRole;
  status: AuditStatus;
  reportContent?: string;
}

export interface CalculationResult {
  score: number;
  classification: 'Bajo' | 'Medio' | 'Alto';
  details: {
    id: string;
    title: string;
    value: number;
    weight: number;
    contribution: number;
    contributionPct: number;
  }[];
}

export interface ReportState {
  loading: boolean;
  content: string | null;
  error: string | null;
  isEditing: boolean; 
  config: AIReportConfig;
}

// Fixed: Added missing global window properties for libraries and browser APIs
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    pdfjsLib: any;
    jspdf: any;
    html2canvas: any;
  }
}