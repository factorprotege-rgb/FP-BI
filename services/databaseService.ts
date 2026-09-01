import { Client, Branch, AuditRecord, AppUser, ActionItem } from '../types';

const DB_NAME = 'fp_audits_db';
const DB_VERSION = 2; // Incremented for multi-store support

const STORES = {
  AUDITS: 'audits',
  CLIENTS: 'clients',
  BRANCHES: 'branches',
  USERS: 'users',
};

// Open or upgrade IndexedDB with all stores
export const openEnterpriseDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("Su navegador no soporta IndexedDB."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.AUDITS)) {
        const auditStore = db.createObjectStore(STORES.AUDITS, { keyPath: 'id' });
        auditStore.createIndex('clientId', 'clientId', { unique: false });
        auditStore.createIndex('branchId', 'branchId', { unique: false });
        auditStore.createIndex('rut', 'rut', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
        const clientStore = db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
        clientStore.createIndex('rut', 'rut', { unique: true });
        clientStore.createIndex('tipo', 'tipo', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.BRANCHES)) {
        const branchStore = db.createObjectStore(STORES.BRANCHES, { keyPath: 'id' });
        branchStore.createIndex('clientId', 'clientId', { unique: false });
        branchStore.createIndex('clientRut', 'clientRut', { unique: false });
        branchStore.createIndex('comuna', 'comuna', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

// Seed initial Chilean enterprise clients and branches
export const seedEnterpriseDataIfEmpty = async (): Promise<void> => {
  try {
    const db = await openEnterpriseDB();
    const clientsCount = await new Promise<number>((res) => {
      const tx = db.transaction(STORES.CLIENTS, 'readonly');
      const store = tx.objectStore(STORES.CLIENTS);
      const countReq = store.count();
      countReq.onsuccess = () => res(countReq.result);
      countReq.onerror = () => res(0);
    });

    if (clientsCount > 0) return; // Already seeded

    const SEED_USERS: AppUser[] = [
      {
        id: 'usr_gerente',
        name: 'Mauricio Donoso Ovalle',
        email: 'gerente@factorprotege.cl',
        role: 'gerente_comercial',
        phone: '+56 9 9123 4567',
        zone: 'Nacional'
      },
      {
        id: 'usr_supervisor_1',
        name: 'Carlos Valenzuela Ríos',
        email: 'supervisor@factorprotege.cl',
        role: 'supervisor',
        phone: '+56 9 8234 5678',
        zone: 'Región Metropolitana y Centro'
      },
      {
        id: 'usr_supervisor_2',
        name: 'Felipe Morales Araya',
        email: 'felipe.supervisor@factorprotege.cl',
        role: 'supervisor',
        phone: '+56 9 7345 6789',
        zone: 'Zona Norte y V Región'
      },
      {
        id: 'usr_ejecutivo_1',
        name: 'Andrés Silva Vergara',
        email: 'ejecutivo@factorprotege.cl',
        role: 'ejecutivo_comercial',
        phone: '+56 9 6456 7890',
        zone: 'Grandes Cuentas Retail'
      },
      {
        id: 'usr_ejecutivo_2',
        name: 'Valentina Gómez Salinas',
        email: 'valentina.ejecutiva@factorprotege.cl',
        role: 'ejecutivo_comercial',
        phone: '+56 9 5567 8901',
        zone: 'Logística y Centros Médicos'
      }
    ];

    const SEED_CLIENTS: Client[] = [
      {
        id: 'cli_cencosud',
        rut: '76.432.100-K',
        razonSocial: 'Cencosud Retail S.A.',
        nombreFantasia: 'Cencosud / Paris & Jumbo',
        giro: 'Comercio Minorista / Supermercados y Retail',
        tipo: 'multisucursal',
        representanteLegal: 'Horst Paulmann Kemna',
        contactoPrincipal: 'Rodrigo Larraín Browne',
        cargoContacto: 'Gerente General Retail',
        email: 'seguridad.corporativa@cencosud.cl',
        telefono: '+56 2 2959 0000',
        ejecutivoId: 'usr_ejecutivo_1',
        ejecutivoNombre: 'Andrés Silva Vergara',
        supervisorId: 'usr_supervisor_1',
        supervisorNombre: 'Carlos Valenzuela Ríos',
        sucursalesCount: 4,
        totalMontoCotizado: 46300000,
        totalMontoGanado: 23100000,
        riesgoGlobal: 'Alto',
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'cli_logistica_central',
        rut: '77.888.111-K',
        razonSocial: 'Distribuidora Logística Central Ltda.',
        nombreFantasia: 'Logística Central Quilicura',
        giro: 'Bodegaje, Almacenaje y Transporte Estratégico',
        tipo: 'unica',
        representanteLegal: 'Marcos Soto Aguilar',
        contactoPrincipal: 'Ignacio Tapia Morales',
        cargoContacto: 'Jefe de Operaciones y Prevención',
        email: 'itapia@logisticacentral.cl',
        telefono: '+56 2 2450 1200',
        ejecutivoId: 'usr_ejecutivo_2',
        ejecutivoNombre: 'Valentina Gómez Salinas',
        supervisorId: 'usr_supervisor_1',
        supervisorNombre: 'Carlos Valenzuela Ríos',
        sucursalesCount: 1,
        totalMontoCotizado: 24800000,
        totalMontoGanado: 19500000,
        riesgoGlobal: 'Alto',
        createdAt: Date.now() - 20 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'cli_clinicas_pacifico',
        rut: '76.999.888-3',
        razonSocial: 'Red de Clínicas y Centros Médicos del Pacífico SpA',
        nombreFantasia: 'Clínicas del Pacífico',
        giro: 'Servicios de Salud, Hospitales y Urgencias Médicas',
        tipo: 'multisucursal',
        representanteLegal: 'Dra. Marcela Fuenzalida Lagos',
        contactoPrincipal: 'Dr. Patricio Alarcón',
        cargoContacto: 'Director Médico y Seguridad de Infraestructura',
        email: 'seguridad@clinicadelpacifico.cl',
        telefono: '+56 2 2800 9000',
        ejecutivoId: 'usr_ejecutivo_1',
        ejecutivoNombre: 'Andrés Silva Vergara',
        supervisorId: 'usr_supervisor_2',
        supervisorNombre: 'Felipe Morales Araya',
        sucursalesCount: 3,
        totalMontoCotizado: 17100000,
        totalMontoGanado: 15000000,
        riesgoGlobal: 'Medio',
        createdAt: Date.now() - 15 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'cli_alvi_mayorista',
        rut: '78.555.222-1',
        razonSocial: 'Supermercados Mayoristas Alvi SpA',
        nombreFantasia: 'Alvi Mayorista',
        giro: 'Comercio Mayorista de Alimentos y Abarrotes',
        tipo: 'multisucursal',
        representanteLegal: 'Gonzalo San Martín Castro',
        contactoPrincipal: 'Claudia Benítez Arriagada',
        cargoContacto: 'Jefa de Seguridad Zonal',
        email: 'seguridad.alvi@smu.cl',
        telefono: '+56 2 2810 5500',
        ejecutivoId: 'usr_ejecutivo_2',
        ejecutivoNombre: 'Valentina Gómez Salinas',
        supervisorId: 'usr_supervisor_1',
        supervisorNombre: 'Carlos Valenzuela Ríos',
        sucursalesCount: 2,
        totalMontoCotizado: 18300000,
        totalMontoGanado: 15800000,
        riesgoGlobal: 'Alto',
        createdAt: Date.now() - 10 * 86400000,
        updatedAt: Date.now()
      }
    ];

    const SEED_BRANCHES: Branch[] = [
      // Branches Cencosud
      {
        id: 'br_cencosud_costanera',
        clientId: 'cli_cencosud',
        clientRut: '76.432.100-K',
        clientRazonSocial: 'Cencosud Retail S.A.',
        nombre: 'Sucursal Costanera Center (Paris & Jumbo)',
        codigoSucursal: 'SUC-001-RM',
        esMatriz: true,
        region: 'Región Metropolitana de Santiago',
        comuna: 'Providencia',
        direccion: 'Av. Andrés Bello 2425, Mall Costanera Center',
        encargadoLocal: 'Esteban Riquelme',
        cargoEncargado: 'Jefe de Prevención y Activos',
        telefono: '+56 9 8111 2233',
        email: 'eriquelme@cencosud.cl',
        activo: true,
        currentAuditId: 'aud_cencosud_costanera',
        lastAuditDate: Date.now() - 3 * 86400000,
        scoreSnapshot: 8.45,
        riskLevel: 'Alto',
        totalBrechas: 5,
        brechasResueltas: 3,
        montoCotizadoTotal: 18500000,
        montoGanadoTotal: 14200000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 30 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'br_cencosud_plaza_oeste',
        clientId: 'cli_cencosud',
        clientRut: '76.432.100-K',
        clientRazonSocial: 'Cencosud Retail S.A.',
        nombre: 'Sucursal Mall Plaza Oeste (Jumbo & Easy)',
        codigoSucursal: 'SUC-002-RM',
        esMatriz: false,
        region: 'Región Metropolitana de Santiago',
        comuna: 'Cerrillos',
        direccion: 'Av. Américo Vespucio 1501, Local 120',
        encargadoLocal: 'Manuel Contreras',
        cargoEncargado: 'Subgerente de Tienda',
        telefono: '+56 9 8222 3344',
        email: 'mcontreras@cencosud.cl',
        activo: true,
        currentAuditId: 'aud_cencosud_plaza_oeste',
        lastAuditDate: Date.now() - 8 * 86400000,
        scoreSnapshot: 6.20,
        riskLevel: 'Medio',
        totalBrechas: 3,
        brechasResueltas: 2,
        montoCotizadoTotal: 8900000,
        montoGanadoTotal: 8900000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 28 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'br_cencosud_vina',
        clientId: 'cli_cencosud',
        clientRut: '76.432.100-K',
        clientRazonSocial: 'Cencosud Retail S.A.',
        nombre: 'Sucursal Mall Marina Arauco',
        codigoSucursal: 'SUC-003-V',
        esMatriz: false,
        region: 'Región de Valparaíso',
        comuna: 'Viña del Mar',
        direccion: 'Av. Libertad 1348',
        encargadoLocal: 'Loreto Silva',
        cargoEncargado: 'Jefa de Seguridad Tienda',
        telefono: '+56 9 8333 4455',
        email: 'lsilva@cencosud.cl',
        activo: true,
        currentAuditId: 'aud_cencosud_vina',
        lastAuditDate: Date.now() - 14 * 86400000,
        scoreSnapshot: 5.80,
        riskLevel: 'Medio',
        totalBrechas: 4,
        brechasResueltas: 1,
        montoCotizadoTotal: 6500000,
        montoGanadoTotal: 0,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 25 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'br_cencosud_concepcion',
        clientId: 'cli_cencosud',
        clientRut: '76.432.100-K',
        clientRazonSocial: 'Cencosud Retail S.A.',
        nombre: 'Sucursal Mall Plaza El Trébol',
        codigoSucursal: 'SUC-004-VIII',
        esMatriz: false,
        region: 'Región del Biobío',
        comuna: 'Talcahuano',
        direccion: 'Av. Pdte. Jorge Alessandri 3177',
        encargadoLocal: 'Gonzalo Peñailillo',
        cargoEncargado: 'Encargado de Seguridad Integral',
        telefono: '+56 9 8444 5566',
        email: 'gpenailillo@cencosud.cl',
        activo: true,
        currentAuditId: 'aud_cencosud_concepcion',
        lastAuditDate: Date.now() - 20 * 86400000,
        scoreSnapshot: 7.90,
        riskLevel: 'Alto',
        totalBrechas: 6,
        brechasResueltas: 1,
        montoCotizadoTotal: 12400000,
        montoGanadoTotal: 0,
        montoPerdidoTotal: 4000000,
        createdAt: Date.now() - 20 * 86400000,
        updatedAt: Date.now()
      },

      // Branch Distribuidora Logística Central (Única)
      {
        id: 'br_logistica_quilicura',
        clientId: 'cli_logistica_central',
        clientRut: '77.888.111-K',
        clientRazonSocial: 'Distribuidora Logística Central Ltda.',
        nombre: 'Casa Matriz & Centro Logístico Estratégico Quilicura',
        codigoSucursal: 'CD-01-QUIL',
        esMatriz: true,
        region: 'Región Metropolitana de Santiago',
        comuna: 'Quilicura',
        direccion: 'Av. Américo Vespucio 1500',
        encargadoLocal: 'Ignacio Tapia Morales',
        cargoEncargado: 'Jefe de Operaciones y Prevención',
        telefono: '+56 9 7111 8899',
        email: 'itapia@logisticacentral.cl',
        activo: true,
        currentAuditId: 'aud_logistica_quilicura',
        lastAuditDate: Date.now() - 5 * 86400000,
        scoreSnapshot: 8.90,
        riskLevel: 'Alto',
        totalBrechas: 7,
        brechasResueltas: 4,
        montoCotizadoTotal: 24800000,
        montoGanadoTotal: 19500000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 20 * 86400000,
        updatedAt: Date.now()
      },

      // Branches Clínicas del Pacífico
      {
        id: 'br_clinica_providencia',
        clientId: 'cli_clinicas_pacifico',
        clientRut: '76.999.888-3',
        clientRazonSocial: 'Red de Clínicas y Centros Médicos del Pacífico SpA',
        nombre: 'Casa Matriz & Clínica Central Providencia',
        codigoSucursal: 'CLN-01-PROV',
        esMatriz: true,
        region: 'Región Metropolitana de Santiago',
        comuna: 'Providencia',
        direccion: 'Av. Salvador 1120',
        encargadoLocal: 'Dr. Patricio Alarcón',
        cargoEncargado: 'Subdirector Administrativo',
        telefono: '+56 9 6111 3322',
        email: 'palarcon@clinicadelpacifico.cl',
        activo: true,
        currentAuditId: 'aud_clinica_providencia',
        lastAuditDate: Date.now() - 10 * 86400000,
        scoreSnapshot: 5.40,
        riskLevel: 'Medio',
        totalBrechas: 2,
        brechasResueltas: 2,
        montoCotizadoTotal: 5200000,
        montoGanadoTotal: 5200000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 15 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'br_clinica_la_florida',
        clientId: 'cli_clinicas_pacifico',
        clientRut: '76.999.888-3',
        clientRazonSocial: 'Red de Clínicas y Centros Médicos del Pacífico SpA',
        nombre: 'Centro Médico & Servicio Urgencia La Florida',
        codigoSucursal: 'CLN-02-FLOR',
        esMatriz: false,
        region: 'Región Metropolitana de Santiago',
        comuna: 'La Florida',
        direccion: 'Av. Vicuña Mackenna Oriente 7110',
        encargadoLocal: 'Jaime Pavez',
        cargoEncargado: 'Administrador de Centro',
        telefono: '+56 9 6222 4433',
        email: 'jpavez@clinicadelpacifico.cl',
        activo: true,
        currentAuditId: 'aud_clinica_la_florida',
        lastAuditDate: Date.now() - 4 * 86400000,
        scoreSnapshot: 7.60,
        riskLevel: 'Alto',
        totalBrechas: 5,
        brechasResueltas: 4,
        montoCotizadoTotal: 9800000,
        montoGanadoTotal: 9800000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 12 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'br_clinica_rancagua',
        clientId: 'cli_clinicas_pacifico',
        clientRut: '76.999.888-3',
        clientRazonSocial: 'Red de Clínicas y Centros Médicos del Pacífico SpA',
        nombre: 'Centro Médico Ambulatorio Rancagua',
        codigoSucursal: 'CLN-03-RANC',
        esMatriz: false,
        region: 'Región de O’Higgins',
        comuna: 'Rancagua',
        direccion: 'Calle Independencia 450',
        encargadoLocal: 'Camila Reyes',
        cargoEncargado: 'Jefa de Operaciones Locales',
        telefono: '+56 9 6333 5544',
        email: 'creyes@clinicadelpacifico.cl',
        activo: true,
        currentAuditId: 'aud_clinica_rancagua',
        lastAuditDate: Date.now() - 25 * 86400000,
        scoreSnapshot: 3.80,
        riskLevel: 'Bajo',
        totalBrechas: 1,
        brechasResueltas: 0,
        montoCotizadoTotal: 2100000,
        montoGanadoTotal: 0,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 10 * 86400000,
        updatedAt: Date.now()
      },

      // Branches Alvi Mayorista
      {
        id: 'br_alvi_san_bernardo',
        clientId: 'cli_alvi_mayorista',
        clientRut: '78.555.222-1',
        clientRazonSocial: 'Supermercados Mayoristas Alvi SpA',
        nombre: 'Sucursal San Bernardo Mayorista',
        codigoSucursal: 'ALVI-01-SB',
        esMatriz: true,
        region: 'Región Metropolitana de Santiago',
        comuna: 'San Bernardo',
        direccion: 'Av. Portales 890',
        encargadoLocal: 'Claudia Benítez Arriagada',
        cargoEncargado: 'Jefa de Seguridad Zonal',
        telefono: '+56 9 5111 9900',
        email: 'cbenitez@smu.cl',
        activo: true,
        currentAuditId: 'aud_alvi_san_bernardo',
        lastAuditDate: Date.now() - 2 * 86400000,
        scoreSnapshot: 8.10,
        riskLevel: 'Alto',
        totalBrechas: 4,
        brechasResueltas: 3,
        montoCotizadoTotal: 11000000,
        montoGanadoTotal: 8500000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 10 * 86400000,
        updatedAt: Date.now()
      },
      {
        id: 'br_alvi_maipu',
        clientId: 'cli_alvi_mayorista',
        clientRut: '78.555.222-1',
        clientRazonSocial: 'Supermercados Mayoristas Alvi SpA',
        nombre: 'Sucursal Maipú Pajaritos',
        codigoSucursal: 'ALVI-02-MAI',
        esMatriz: false,
        region: 'Región Metropolitana de Santiago',
        comuna: 'Maipú',
        direccion: 'Av. Los Pajaritos 2300',
        encargadoLocal: 'Arturo Palma',
        cargoEncargado: 'Encargado de Local',
        telefono: '+56 9 5222 0011',
        email: 'apalma@smu.cl',
        activo: true,
        currentAuditId: 'aud_alvi_maipu',
        lastAuditDate: Date.now() - 7 * 86400000,
        scoreSnapshot: 6.80,
        riskLevel: 'Medio',
        totalBrechas: 3,
        brechasResueltas: 3,
        montoCotizadoTotal: 7300000,
        montoGanadoTotal: 7300000,
        montoPerdidoTotal: 0,
        createdAt: Date.now() - 9 * 86400000,
        updatedAt: Date.now()
      }
    ];

    // Seed Sample Audit Records with Action Plans and Traceability
    const sampleActionPlanCostanera: ActionItem[] = [
      {
        id: 'act_costanera_1',
        title: 'Modernización Perimetral y Cámaras PTZ 4K en Accesos Críticos',
        category: 'CCTV y Alarmas',
        priority: 'alta',
        recommendation: 'Instalar 6 domos PTZ 4K con analítica IA de cruce de línea y detección facial en accesos peatonales y vehiculares.',
        actionRequired: 'Adquisición y montaje de infraestructura CCTV IP con respaldo NVR y enlace a Central de Monitoreo.',
        responsible: 'Esteban Riquelme (Jefe de Prevención)',
        executor: 'FACTOR PROTEGE - División Tecnológica CCTV',
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        status: 'verificado',
        progress: 100,
        budgetEstimate: 8500000,
        commercialOutcome: 'ganada',
        opportunityValue: 8500000,
        statusHistory: [
          {
            id: 'log_1',
            timestamp: Date.now() - 10 * 86400000,
            fromStatus: 'pendiente',
            toStatus: 'en_proceso',
            changedBy: 'Andrés Silva (Ejecutivo Comercial)',
            executor: 'FACTOR PROTEGE - División Tecnológica CCTV',
            notes: 'Aprobación de orden de compra n° 8841.',
            commercialOutcome: 'ganada'
          },
          {
            id: 'log_2',
            timestamp: Date.now() - 2 * 86400000,
            fromStatus: 'en_proceso',
            toStatus: 'verificado',
            changedBy: 'Carlos Valenzuela (Supervisor Zonal)',
            executor: 'FACTOR PROTEGE - División Tecnológica CCTV',
            notes: 'Pruebas de cobertura y enlace NVR finalizadas con 100% de operatividad.',
            commercialOutcome: 'ganada'
          }
        ]
      },
      {
        id: 'act_costanera_2',
        title: 'Certificación OS-10 y Protocolo de Acreditación de Dotación',
        category: 'Recursos Humanos y OS-10',
        priority: 'alta',
        recommendation: 'Revisar y regularizar las directivas de funcionamiento y credenciales OS-10 de 12 guardias.',
        actionRequired: 'Inscripción a curso de reentrenamiento normativo y actualización de carpeta ante Prefectura OS-10.',
        responsible: 'Rodrigo Larraín (Gerencia)',
        executor: 'FACTOR PROTEGE - Academia de Seguridad y Capacitación OS-10',
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        status: 'verificado',
        progress: 100,
        budgetEstimate: 5700000,
        commercialOutcome: 'ganada',
        opportunityValue: 5700000,
        statusHistory: [
          {
            id: 'log_3',
            timestamp: Date.now() - 5 * 86400000,
            fromStatus: 'en_proceso',
            toStatus: 'verificado',
            changedBy: 'Carlos Valenzuela (Supervisor Zonal)',
            executor: 'FACTOR PROTEGE - Academia de Seguridad y Capacitación OS-10',
            notes: 'Acreditaciones entregadas formalmente.',
            commercialOutcome: 'ganada'
          }
        ]
      },
      {
        id: 'act_costanera_3',
        title: 'Mantenimiento y Refuerzo de Torniquetes de Control de Acceso',
        category: 'Control de Acceso',
        priority: 'media',
        recommendation: 'Calibrar lectores biométricos y torniquetes de acceso a bodegas subterráneas.',
        actionRequired: 'Reemplazo de placas lectoras e integración a base de datos de colaboradores autorizados.',
        responsible: 'Esteban Riquelme',
        executor: 'FACTOR PROTEGE - División Control de Accesos',
        dueDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10),
        status: 'en_proceso',
        progress: 60,
        budgetEstimate: 4300000,
        commercialOutcome: 'cotizado',
        opportunityValue: 4300000
      }
    ];

    const SEED_AUDITS: AuditRecord[] = [
      {
        id: 'aud_cencosud_costanera',
        clientId: 'cli_cencosud',
        branchId: 'br_cencosud_costanera',
        branchName: 'Sucursal Costanera Center (Paris & Jumbo)',
        clientRut: '76.432.100-K',
        clientType: 'multisucursal',
        ejecutivoNombre: 'Andrés Silva Vergara',
        supervisorNombre: 'Carlos Valenzuela Ríos',
        entidad: 'Cencosud Retail S.A. - Sucursal Costanera Center',
        rut: '76.432.100-K',
        representanteLegal: 'Horst Paulmann Kemna',
        medidasExistentes: 'Circuito CCTV 64 cámaras, 18 guardias OS-10 por turno, control de acceso peatonal.',
        giro: 'Comercio Minorista / Gran Tienda por Departamento',
        comuna: 'Providencia',
        direccion: 'Av. Andrés Bello 2425, Mall Costanera Center',
        coords: '-33.4172, -70.6067',
        auditorName: 'Andrés Silva (Ejecutivo Comercial)',
        observations: {
          rubro: 'Gran tienda retail en centro comercial de máxima afluencia metropolitana.',
          efectivo: 'Recaudación de cajas periódica con traslado a bóveda central.',
          victimizacion: 'Eventos reiterados de mecheros y bandas organizadas.',
          cualidades: 'Electrónica, telefonía y perfumería de alto valor.',
          vulnerabilidad: 'Múltiples accesos vidriados y cercanía con avenidas de alto flujo.'
        },
        evidenceRefs: {},
        tipoEntidad: 'Establecimiento Comercial / Retail de Alta Afluencia',
        region: 'Región Metropolitana de Santiago',
        responsable: 'Esteban Riquelme',
        cargoResponsable: 'Jefe de Prevención y Activos',
        actividadPrincipal: 'Venta minorista de vestuario, tecnología, perfumería y alimentación',
        horarioFuncionamiento: 'Lunes a Domingo 10:00 a 21:00 hrs',
        horarioMayorAfluencia: 'Tardes y fines de semana',
        operaNocturno: 'NO',
        trabajadores: 240,
        afluenciaDiaria: 8500,
        flujoEfectivo: 45000000,
        valorActivos: 8500000000,
        retiroValores: 'Retiro mediante transportadora de valores acreditada (Brinks / Prosegur)',
        frecuenciaRetiro: 'Dos veces al día',
        activoCriticoPrincipal: 'Bóveda de valores, sala de tesorería y bodega de alta tecnología',
        superficieTerreno: 28000,
        superficieConstruida: 45000,
        tipoControlAcceso: 'Control digital y guardias en accesos de personal',
        estadoCierre: 'Bueno (puertas automáticas y cortinas metálicas motorizadas)',
        alturaRejas: 'Mayor a 2.5 metros en zona de carga',
        nivelIluminacion: 'Óptima en salón, regular en andén de descarga',
        cantidadPuntosCiegos: 3,
        cctv: 'SI',
        cantidadCamaras: 64,
        resolucionCamaras: 'Completa (1080p / 2MP a 5MP)',
        grabacionDias: 30,
        alarma: 'SI',
        tipoAlarma: 'Monitoreo centralizado con botón de pánico y sensores perimetrales',
        monitoreo: 'SI',
        empresaMonitoreo: 'Prosegur Alarmas',
        tiempoRespuesta: '5-10 min',
        sistemasPrevAlarma: 'Focos disuasivos y sirena de alta potencia',
        guardias: 18,
        turnosGuardias: 'Turnos 4x4 rotativos 24/7',
        guardiasOS10: 'SI',
        empresaGuardias: 'Securitas Chile S.A.',
        encargadoSeguridad: 'SI',
        nombreEncargado: 'Esteban Riquelme',
        clasificacionEntorno: 'Mall comercial de alta densidad',
        nivelDelictual: 'Alto',
        entorno: 'Polo comercial de máxima afluencia con alta conectividad y riesgos de mecheros.',
        rutasEscape: 'Conexión directa a Av. Andrés Bello, Costanera Norte y Metro Tobalaba.',
        delitosFrecuentes: 'Hurto simple, hurto agravado en sala y tentativas de turbazos.',
        protocoloApertura: 'SI',
        protocoloCierre: 'SI',
        protocoloRobo: 'SI',
        protocoloAlarma: 'SI',
        protocoloVisitas: 'SI',
        protocoloValores: 'SI',
        capacitacionUltimaFecha: new Date(Date.now() - 40 * 86400000).toISOString().slice(0, 10),
        evidencias: '',
        notas: 'Evaluación técnica completada para visación de gerencia y supervisor.',
        actionPlan: sampleActionPlanCostanera,
        lastModified: Date.now() - 3 * 86400000,
        scoreSnapshot: 8.45,
        classificationSnapshot: 'Alto',
        roleSnapshot: 'ejecutivo_comercial',
        status: 'approved'
      }
    ];

    // Persist all SEED data
    const tx = db.transaction([STORES.USERS, STORES.CLIENTS, STORES.BRANCHES, STORES.AUDITS], 'readwrite');
    
    SEED_USERS.forEach(u => tx.objectStore(STORES.USERS).put(u));
    SEED_CLIENTS.forEach(c => tx.objectStore(STORES.CLIENTS).put(c));
    SEED_BRANCHES.forEach(b => tx.objectStore(STORES.BRANCHES).put(b));
    SEED_AUDITS.forEach(a => tx.objectStore(STORES.AUDITS).put(a));

    await new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });

    console.log("Enterprise database seeded successfully with Chilean Multi-branch clients and audits.");
  } catch (error) {
    console.error("Error seeding enterprise database:", error);
  }
};

// --- CRUD OPERATIONS ---

export const getClients = async (): Promise<Client[]> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CLIENTS, 'readonly');
    const store = tx.objectStore(STORES.CLIENTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const saveClient = async (client: Client): Promise<void> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.CLIENTS, 'readwrite');
    const store = tx.objectStore(STORES.CLIENTS);
    const req = store.put({ ...client, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const deleteClient = async (clientId: string): Promise<void> => {
  const db = await openEnterpriseDB();
  const branches = await getBranchesByClient(clientId);
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.CLIENTS, STORES.BRANCHES, STORES.AUDITS], 'readwrite');
    tx.objectStore(STORES.CLIENTS).delete(clientId);
    
    branches.forEach(b => {
      tx.objectStore(STORES.BRANCHES).delete(b.id);
      if (b.currentAuditId) {
        tx.objectStore(STORES.AUDITS).delete(b.currentAuditId);
      }
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getBranches = async (): Promise<Branch[]> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readonly');
    const store = tx.objectStore(STORES.BRANCHES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const getBranchesByClient = async (clientId: string): Promise<Branch[]> => {
  const allBranches = await getBranches();
  return allBranches.filter(b => b.clientId === clientId);
};

export const saveBranch = async (branch: Branch): Promise<void> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readwrite');
    const store = tx.objectStore(STORES.BRANCHES);
    const req = store.put({ ...branch, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const deleteBranch = async (branchId: string): Promise<void> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.BRANCHES, 'readwrite');
    const store = tx.objectStore(STORES.BRANCHES);
    const req = store.delete(branchId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export const getEnterpriseAudits = async (): Promise<AuditRecord[]> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.AUDITS, 'readonly');
    const store = tx.objectStore(STORES.AUDITS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const saveEnterpriseAudit = async (audit: AuditRecord): Promise<void> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.AUDITS, STORES.BRANCHES, STORES.CLIENTS], 'readwrite');
    tx.objectStore(STORES.AUDITS).put(audit);

    // Update corresponding branch stats if linked
    if (audit.branchId) {
      const branchStore = tx.objectStore(STORES.BRANCHES);
      const branchReq = branchStore.get(audit.branchId);
      branchReq.onsuccess = () => {
        const branch: Branch | undefined = branchReq.result;
        if (branch) {
          branch.scoreSnapshot = audit.scoreSnapshot;
          branch.riskLevel = audit.classificationSnapshot as any;
          branch.lastAuditDate = audit.lastModified;
          branch.currentAuditId = audit.id;
          
          if (audit.actionPlan && audit.actionPlan.length > 0) {
            branch.totalBrechas = audit.actionPlan.length;
            branch.brechasResueltas = audit.actionPlan.filter(a => a.status === 'completado' || a.status === 'verificado').length;
            branch.montoCotizadoTotal = audit.actionPlan.reduce((acc, a) => acc + (a.opportunityValue || a.budgetEstimate || 0), 0);
            branch.montoGanadoTotal = audit.actionPlan.filter(a => a.commercialOutcome === 'ganada').reduce((acc, a) => acc + (a.opportunityValue || a.budgetEstimate || 0), 0);
            branch.montoPerdidoTotal = audit.actionPlan.filter(a => a.commercialOutcome === 'perdida').reduce((acc, a) => acc + (a.opportunityValue || a.budgetEstimate || 0), 0);
          }
          branchStore.put(branch);
        }
      };
    }

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getAppUsers = async (): Promise<AppUser[]> => {
  const db = await openEnterpriseDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.USERS, 'readonly');
    const store = tx.objectStore(STORES.USERS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};
