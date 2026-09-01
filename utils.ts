
import { INDICATORS, WEIGHTS, COMUNAS_RANKING, COMUNAS_PATRULLAJE } from './constants';
import { RiskData, CalculationResult, AuditRecord } from './types';

// RUT Utilities
export const cleanRut = (rut: string) => {
  return typeof rut === 'string' ? rut.replace(/^0+|[^0-9kK]+/g, '').toUpperCase() : '';
};

export const validateRut = (rut: string): boolean => {
  const clean = cleanRut(rut);
  if (!clean || clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= body.length; i++) {
    const index = multiplo * parseInt(clean.charAt(body.length - i));
    suma = suma + index;
    if (multiplo < 7) {
      multiplo = multiplo + 1;
    } else {
      multiplo = 2;
    }
  }

  const dvEsperado = 11 - (suma % 11);
  const dvCalculado = (dvEsperado === 11) ? '0' : ((dvEsperado === 10) ? 'K' : dvEsperado.toString());

  return dvCalculado === dv;
};

export const formatRut = (rut: string): string => {
  const clean = cleanRut(rut);
  if (clean.length <= 1) return clean;
  
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
};

// Geolocation
export const getGeolocation = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("Geolocalización no soportada por el navegador.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        reject("Permiso denegado o error al obtener ubicación.");
      }
    );
  });
};

// Image Utilities
export const compressImage = (file: File, maxWidth = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const scaleFactor = maxWidth / img.width;
        elem.width = maxWidth;
        elem.height = img.height * scaleFactor;
        const ctx = elem.getContext('2d');
        ctx?.drawImage(img, 0, 0, elem.width, elem.height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// DOCUMENT TEXT EXTRACTION (RAG)
export const extractTextFromFile = async (file: File): Promise<string> => {
  if (file.type === 'text/plain') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  } 
  
  if (file.type === 'application/pdf') {
    if (!window.pdfjsLib) {
      throw new Error("Librería PDF.js no cargada.");
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = "";
      
      // Increased limit from 100 to 300 pages to allow full manual analysis for larger docs
      const maxPages = Math.min(pdf.numPages, 300);
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += `\n--- PÁGINA ${i} ---\n${pageText}`;
      }
      
      return fullText;
    } catch (e) {
      console.error(e);
      throw new Error("Error al leer el PDF. Asegúrese de que no esté encriptado.");
    }
  }

  throw new Error("Formato no soportado. Use .txt o .pdf");
};

export const calculateScore = (data: RiskData): CalculationResult => {
  let totalScoreRaw = 0;
  let totalWeight = 0;
  const details = [];

  for (const indicator of INDICATORS) {
    const weight = WEIGHTS[indicator.id] || 0;
    let value = 1;

    // Handle array types (checkboxes/aditivos)
    if (indicator.type.startsWith('aditivo')) {
      // Robust detection of selected labels (array or fallback)
      let selectedLabels: string[] = [];
      const rawValue = data[indicator.id];
      if (Array.isArray(rawValue)) {
        selectedLabels = rawValue.map(String);
      } else if (typeof rawValue === 'string') {
        const trimmed = rawValue.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              selectedLabels = parsed.map(String);
            }
          } catch (err) {
            selectedLabels = [];
          }
        } else if (trimmed) {
          selectedLabels = trimmed.split(',').map(s => s.trim()).filter(Boolean);
        }
      } else if (rawValue) {
        selectedLabels = [String(rawValue)];
      }
      
      // Calculate sum by looking up the value for each selected label
      const sum = selectedLabels.reduce((acc, label) => {
        const option = indicator.options.find(opt => opt.label === label);
        return acc + (option ? option.value : 0);
      }, 0);

      value = sum === 0 ? 1 : Math.min(10, Math.max(1, sum));
    } else {
      // Handle simple types (select)
      value = Number(data[indicator.id] || 1);
    }

    const contribution = value * weight;
    totalScoreRaw += contribution;
    totalWeight += weight;

    details.push({
      id: indicator.id,
      title: indicator.title,
      value,
      weight,
      contribution,
      contributionPct: 0 // calculated later
    });
  }

  // Normalize if weights don't sum strictly to 1 (though they should)
  const scoreRaw = totalWeight > 0 ? totalScoreRaw / totalWeight : 0;
  
  // IMPLEMENTACIÓN ARTÍCULO 7 (RE 1820): 
  // "Para fines de la estimación del riesgo se utilizan solamente números enteros,
  // debiendo aproximarse, hasta dos decimales, los valores al entero más cercano."
  
  // 1. Fix to 2 decimals first to handle floating point precision
  const scoreFixed = Number(scoreRaw.toFixed(2));
  
  // 2. Round to nearest integer (Standard Math.round: >= .5 rounds up) for CLASSIFICATION
  const scoreRounded = Math.round(scoreFixed);
  
  // Calculate Pct using the raw total for accuracy in bars
  details.forEach(d => {
    d.contributionPct = totalScoreRaw > 0 ? (d.contribution / totalScoreRaw) * 100 : 0;
  });

  // Sort by contribution
  details.sort((a, b) => b.contribution - a.contribution);

  // Classification logic strictly on integer score
  const classification = scoreRounded >= 8 ? 'Alto' : scoreRounded >= 5 ? 'Medio' : 'Bajo';

  return {
    score: scoreFixed, // Return REAL float value for display
    classification,    // Classification based on ROUNDED value
    details
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
};

export const getCurrencyLevel = (amount: number) => {
  if (amount >= 15000000) return 10;
  if (amount >= 10000000) return 6;
  if (amount >= 5000000) return 4;
  if (amount >= 2000000) return 2;
  return 1;
};

// Calculates Vulnerability score based on SPD Ranking (Quintiles approx)
export const getVulnerabilityFromComuna = (comunaName: string): number | null => {
  const formattedName = Object.keys(COMUNAS_RANKING).find(k => k.toLowerCase() === comunaName.toLowerCase());
  
  if (!formattedName) return null;

  const rank = COMUNAS_RANKING[formattedName];
  
  // Exact thresholds per user request:
  // 1 al 40 -> 10 (Urgente 1)
  if (rank <= 40) return 10;
  // 41 al 80 -> 8 (Urgente 2)
  if (rank <= 80) return 8;
  // 81 al 120 -> 6 (Urgente 3)
  if (rank <= 120) return 6;
  // 121 al 233 -> 4 (Rotativa 1)
  if (rank <= 233) return 4;
  // 234 al 345 (Rest) -> 2
  return 2;
};

// Calculates Patrullaje Score based on Decil
// High Coverage (Decil 10) = Low Risk (1)
// Low Coverage (Decil 1) = High Risk (10)
export const getPatrullajeFromComuna = (comunaName: string): number | null => {
  const formattedName = Object.keys(COMUNAS_PATRULLAJE).find(k => k.toLowerCase() === comunaName.toLowerCase());
  
  if (!formattedName) return null; // Let the user select if not in DB

  const decil = COMUNAS_PATRULLAJE[formattedName];
  
  // Convert Decil to Risk Value (Inverse relationship)
  // Decil 10 -> Value 1
  // Decil 1 -> Value 10
  // Formula: 11 - Decil
  return Math.max(1, Math.min(10, 11 - decil));
};

// --- BUSINESS INTELLIGENCE EXPORT ---

export const generateAuditsCSV = (audits: AuditRecord[]) => {
  if (!audits.length) {
    alert("No hay evaluaciones para exportar.");
    return;
  }

  const escapeCSV = (val: any) => {
    const str = String(val === undefined || val === null ? '' : val);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // 1. Fixed Headers
  let headers = [
    'ID Evaluacion', 'Fecha', 'Hora', 'Evaluador', 'Entidad', 'RUT', 'Giro', 'Comuna', 'Dirección', 'Geolocalización',
    'Puntaje Global', 'Clasificación Riesgo'
  ];

  // 2. Dynamic Headers (Indicator Value + Observation)
  INDICATORS.forEach(ind => {
    headers.push(`${ind.title} (Valor)`);
    headers.push(`${ind.title} (Obs)`);
  });

  // 3. Build Rows
  const rows = audits.map(audit => {
    const dateObj = new Date(audit.lastModified);
    const baseFields = [
      audit.id,
      dateObj.toLocaleDateString(),
      dateObj.toLocaleTimeString(),
      audit.auditorName,
      audit.entidad,
      audit.rut,
      audit.giro,
      audit.comuna,
      audit.direccion,
      audit.coords,
      audit.scoreSnapshot.toFixed(2),
      audit.classificationSnapshot
    ];

    const indicatorFields: string[] = [];
    INDICATORS.forEach(ind => {
      // Get Value (handle arrays)
      let val = audit[ind.id];
      if (Array.isArray(val)) val = val.join(' | ');
      
      // Get Observation
      const obs = audit.observations?.[ind.id] || '';
      
      indicatorFields.push(String(val));
      indicatorFields.push(obs);
    });

    return [...baseFields, ...indicatorFields].map(escapeCSV).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Gestion_GrupoAlianza_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const calculateBudget = (result: CalculationResult, data: RiskData) => {
  const isHighRisk = result.classification === 'Alto';
  const isMediumRisk = result.classification === 'Medio';

  // --- CAPEX ---
  // CCTV Estimation
  let cctvCount = 4; // Base
  if (isMediumRisk) cctvCount = 8;
  if (isHighRisk) cctvCount = 16;
  
  // Adjust for specific factors
  const efectivoVal = Number(data['efectivo'] || 1);
  if (efectivoVal > 5) cctvCount += 4;
  
  const aforoVal = Number(data['aforo'] || 1);
  if (aforoVal > 5) cctvCount += 2;

  const cctvUnitCost = 120000; // Camera + Install
  const nvrCost = cctvCount > 8 ? 800000 : 300000;
  const cctvCost = (cctvCount * cctvUnitCost) + nvrCost;

  // Alarm System
  const alarmCost = isHighRisk ? 2500000 : isMediumRisk ? 1200000 : 600000; // Kit Grade 2/3

  // Access Control
  let accessCost = 0;
  const publicoVal = Number(data['publico'] || 1);
  // If 'publico' is 'Dinámico' (10) or 'Regulado' (5) AND Risk is Med/High
  if (publicoVal >= 5 && (isMediumRisk || isHighRisk)) {
      accessCost = 3500000; // Turnstiles / Biometric
  }

  // --- OPEX ---
  // Guards (FTE - Full Time Equivalent)
  let guardsNeeded = 0;
  if (isHighRisk) guardsNeeded = 4; // 24/7 (Requires 4 FTE approx)
  else if (isMediumRisk) guardsNeeded = 2; // Business hours +
  else if (efectivoVal > 5) guardsNeeded = 1;

  const guardCost = guardsNeeded * 1400000; // Monthly Cost Company

  // Remote Monitoring (CRA)
  const monitoringCost = isHighRisk ? 150000 : 60000;

  // Maintenance (2% of Capex monthly)
  const maintenanceCost = (cctvCost + alarmCost + accessCost) * 0.02;

  return {
    capexTotal: cctvCost + alarmCost + accessCost,
    opexTotal: guardCost + monitoringCost + maintenanceCost,
    details: {
      cctvCount,
      cctvCost,
      alarmCost,
      accessCost,
      guardsNeeded,
      guardCost,
      monitoringCost,
      maintenanceCost
    }
  };
};

// --- ESTIMACIÓN Y ANÁLISIS DE SEGURIDAD (DECRETO SUPREMO N°209) ---

export interface DS209Measure {
  idMedida: string;
  idEntidad: string;
  fecha: string;
  prioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  dimension: string;
  articulo: string;
  brecha: string;
  medida: string;
  fundamento: string;
  responsableSugerido: string;
  plazoSugerido: string;
  evidenciaCumplimiento: string;
}

export interface DS209Protocol {
  idProtocolo: string;
  idEntidad: string;
  fecha: string;
  nombreProtocolo: string;
  estado: string;
  contenidoMinimo: string;
  responsable: string;
  observacion: string;
}

export interface DS209RiskResult {
  pActivos: number;
  pPersonas: number;
  pEfectivo: number;
  pEntorno: number;
  pVulFisica: number;
  pVulTec: number;
  pVulHumana: number;
  pProtocolo: number;
  score: number;
  classification: 'Bajo' | 'Medio' | 'Alto';
  categoriaDS209: string;
  fundamento: string;
}

const scoreThreshold = (val: number, limit: number[]) => {
  if (val <= limit[0]) return 1;
  if (val <= limit[1]) return 2;
  if (val <= limit[2]) return 3;
  return 4;
};

const textIsShort = (val?: string) => {
  return !val || val.trim().length < 20;
};

const normalizeText = (s?: string) => {
  return String(s || '').toLowerCase()
    .replace(/[áàäâ]/g,'a').replace(/[éèëê]/g,'e').replace(/[íìïî]/g,'i')
    .replace(/[óòöô]/g,'o').replace(/[úùüû]/g,'u').replace(/ñ/g,'n');
};

const scoreDS209Entorno = (data: RiskData): number => {
  let score = 1;
  const combinedText = normalizeText(`${data.entorno || ''} ${data.rutasEscape || ''} ${data.delitosFrecuentes || ''}`);
  
  const keywords = ['robo', 'asalto', 'intrusion', 'hurto', 'portonazo', 'encerrona', 'arma', 'violencia', 'banda', 'delictual', 'ruta escape', 'sitio eriaz'];
  keywords.forEach(kw => {
    if (combinedText.includes(kw)) score++;
  });

  const nd = String(data.nivelDelictual || '').toLowerCase();
  if (nd.includes('muy alto') || nd.includes('alto')) score += 2;
  else if (nd.includes('medio')) score += 1;

  return Math.min(4, score);
};

const scoreDS209Fisico = (data: RiskData): number => {
  let score = 1;

  if (textIsShort(data.controlAccesos)) score++;
  if (data.tipoControlAcceso === 'Sin control formal' || !data.tipoControlAcceso) score++;
  if (textIsShort(data.cierrePerimetral)) score++;
  if (data.estadoCierre === 'Deficiente (daños, brechas)' || data.estadoCierre === 'Sin cierre perimetral') score++;
  if (data.nivelIluminacion === 'Deficiente (zonas oscuras)' || data.nivelIluminacion === 'Sin iluminación') score++;
  if (Number(data.cantidadPuntosCiegos || 0) > 3) score++;

  return Math.min(4, score);
};

const scoreDS209Tecnologico = (data: RiskData): number => {
  let score = 1;

  if (data.cctv !== 'SI') {
    score += 2;
  } else if (Number(data.cantidadCamaras || 0) < 8) {
    score++;
  }

  if (Number(data.grabacionDias || 0) < 30) score++;
  if (data.alarma !== 'SI') score++;
  if (data.monitoreo !== 'SI') score++;

  return Math.min(4, score);
};

const scoreDS209Humano = (data: RiskData): number => {
  let score = 1;

  if (Number(data.guardias || 0) > 0 && data.guardiasOS10 !== 'SI') score += 2;
  if (data.encargadoSeguridad !== 'SI') score += 2;
  if (textIsShort(data.comunicaciones)) score++;

  return Math.min(4, score);
};

const scoreDS209Protocolos = (data: RiskData): number => {
  let score = 4;

  if (data.protocoloApertura === 'SI') score--;
  if (data.protocoloCierre === 'SI' || data.protocoloRobo === 'SI') score--;
  if (data.protocoloAlarma === 'SI') score--;
  if (data.protocoloVisitas === 'SI' || data.protocoloValores === 'SI') score--;

  return Math.max(1, score);
};

export const calculateDS209Risk = (data: RiskData): DS209RiskResult => {
  const pActivos = scoreThreshold(Number(data.valorActivos || 0), [30000000, 150000000, 500000000]);
  const pPersonas = scoreThreshold(Number(data.afluenciaDiaria || 0) + Number(data.trabajadores || 0), [30, 100, 400]);
  const pEfectivo = scoreThreshold(Number(data.flujoEfectivo || 0), [500000, 5000000, 30000000]);
  
  const pEntorno = scoreDS209Entorno(data);
  const pVulFisica = scoreDS209Fisico(data);
  const pVulTec = scoreDS209Tecnologico(data);
  const pVulHumana = scoreDS209Humano(data);
  const pProtocolo = scoreDS209Protocolos(data);

  const rawScore = Math.round(
    pActivos * 1.4 + pPersonas * 1.1 + pEfectivo * 1.4 + pEntorno * 1.4 +
    pVulFisica * 1.1 + pVulTec * 1.2 + pVulHumana * 1.1 + pProtocolo * 0.9
  );

  const score = Math.max(0, Math.min(36, rawScore));
  const classification = score < 15 ? 'Bajo' : score < 25 ? 'Medio' : 'Alto';
  const categoriaDS209 = classification === 'Alto' ? 'Categoría I — Riesgo alto' :
                         classification === 'Medio' ? 'Categoría II — Riesgo medio' :
                                                      'Categoría III — Riesgo bajo o moderado';

  const formatCLPVal = (val: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
  };

  const f: string[] = [];
  f.push(`La instalación de ${data.entidad || 'la entidad'} fue clasificada con Nivel de Riesgo ${classification.toUpperCase()} (${categoriaDS209} según el reglamento del Decreto Supremo N°209), con un puntaje acumulado de ${score} puntos de 36.`);
  f.push(`El análisis comprende ocho dimensiones críticas: valor de activos (${pActivos}/4), afluencia de personas (${pPersonas}/4), volumen de efectivo diario (${pEfectivo}/4), características del entorno (${pEntorno}/4), vulnerabilidad física perimetral (${pVulFisica}/4), seguridad tecnológica (${pVulTec}/4), seguridad humana operativa (${pVulHumana}/4) y formalización de protocolos de reacción (${pProtocolo}/4).`);
  
  if (data.operaNocturno === 'SI') {
    f.push("La operación en horario de nocturno o días inhábiles incrementa ostensiblemente el nivel de exposición operacional (Art. 4° Ley N°21.659).");
  }
  if (Number(data.flujoEfectivo || 0) >= 5000000) {
    f.push(`El flujo de efectivo manejado de ${formatCLPVal(Number(data.flujoEfectivo))} representa un elemento altamente atractivo para bandas organizadas (Art. 14 DS 209).`);
  }
  if (data.cctv !== 'SI') {
    f.push("La ausencia de sistemas certificados de circuito cerrado de televisión imposibilita la detección oportuna y entorpece las labores de investigación judicial (Art. 17 DS 209).");
  }
  if (data.alarma !== 'SI') {
    f.push("La carencia de alarmas electrónicas monitoreadas por centrales receptoras de alarmas acreditadas elimina la capacidad de reacción inmediata ante intrusiones (Art. 16 DS 209).");
  }
  if (data.encargadoSeguridad !== 'SI') {
    f.push("Se detecta la falta de un encargado formal de la seguridad de la instalación responsable ante la autoridad fiscalizadora (Art. 12 Ley 21.659 / Art. 8° DS 209).");
  }

  return {
    pActivos,
    pPersonas,
    pEfectivo,
    pEntorno,
    pVulFisica,
    pVulTec,
    pVulHumana,
    pProtocolo,
    score,
    classification,
    categoriaDS209,
    fundamento: f.join(' ')
  };
};

export const generateDS209Measures = (data: RiskData): DS209Measure[] => {
  const result: DS209Measure[] = [];
  const fechaStr = new Date().toISOString().slice(0, 10);
  const idEntidad = data.id || 'ENT-DEMO';

  const add = (
    prio: 'ALTA' | 'MEDIA' | 'BAJA',
    dim: string,
    art: string,
    brecha: string,
    medida: string,
    fund: string,
    resp: string,
    plazo: string,
    ev: string
  ) => {
    result.push({
      idMedida: 'MED-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      idEntidad,
      fecha: fechaStr,
      prioridad: prio,
      dimension: dim,
      articulo: art,
      brecha,
      medida,
      fundamento: fund,
      responsableSugerido: resp,
      plazoSugerido: plazo,
      evidenciaCumplimiento: ev
    });
  };

  // 1. Gobernanza / Encargado
  if (data.encargadoSeguridad !== 'SI') {
    add(
      'ALTA',
      'Gobernanza',
      'Art. 12 Ley 21.659 / Art. 8° DS 209',
      'No consta Encargado de Seguridad designado formalmente.',
      'Designar formalmente un Encargado de Seguridad con funciones, suplencia y su respectiva carpeta de antecedentes vigente.',
      'La Ley N°21.659 exige un canal único de interlocución con la autoridad policial y fiscalizadora.',
      'Representante Legal',
      '10 días hábiles',
      'Copia impresa del nombramiento con firma electrónica.'
    );
  }

  // 2. CCTV
  if (data.cctv !== 'SI') {
    add(
      'ALTA',
      'Seguridad tecnológica',
      'Art. 17 DS 209',
      'Ausencia total de sistema CCTV operativo.',
      'Diseñar y desplegar un sistema analógico-digital de videovigilancia de alta resolución (mínimo 2MP), cobertura en accesos, tesorería, carga, y perímetro, con almacenamiento de al menos 30 días continuos.',
      'El reglamento técnico exige capacidades disuasorias y de registro forense proporcional para entidades de interés.',
      'Proveedor de Seguridad homologado',
      '30 días corridos',
      'Certificación técnica de cobertura blindada y grabación activa.'
    );
  } else if (Number(data.cantidadCamaras || 0) < 8) {
    add(
      'MEDIA',
      'Seguridad tecnológica',
      'Art. 17 DS 209',
      `Número de cámaras instalado posiblemente insuficiente (${data.cantidadCamaras} unidades).`,
      'Efectuar un mapeo de puntos ciegos e incorporar cámaras adicionales hasta garantizar cobertura panorámica total.',
      'Las zonas de sombra operativa impiden la reconstrucción cronológica confiable de incidentes.',
      'Encargado de Seguridad',
      '30 días corridos',
      'Plano de distribución de cámaras visado por el técnico.'
    );
  }

  // 3. CCTV Retención
  if (data.cctv === 'SI' && Number(data.grabacionDias || 0) < 30) {
    add(
      'MEDIA',
      'Seguridad tecnológica',
      'Art. 17 DS 209',
      `Tiempo de almacenamiento inferior a 30 días corridos (${data.grabacionDias} días).`,
      'Expandir los discos duros locales o adquirir espacio cloud para garantizar el resguardo completo de 30 días en la mayor tasa de refresco.',
      'La ley exige la puesta a disposición del Ministerio Público de respaldos fechados hasta por un mes.',
      'Soporte Técnico de CCTV',
      '15 días corridos',
      'Prueba de verificación técnica de indexación de discos.'
    );
  }

  // 4. Sistema Alarma
  if (data.alarma !== 'SI') {
    add(
      'ALTA',
      'Detección y respuesta',
      'Art. 16 DS 209',
      'Sin sistema de alarmas contra intrusión homologado.',
      'Instalar un kit centralizado de detección magnética e infrarroja en accesos clave, bodega, perímetros, conectado directamente a una mesa central receptora certificada.',
      'Es crítico contar con una alerta temprana automática que active protocols inmediatos y despache asistencia.',
      'Mesa directiva / Proveedor',
      '30 días corridos',
      'Contrato de monitoreo vigente de la CRA prestadora.'
    );
  }

  // 5. Personal Seguridad & OS10
  if (Number(data.guardias || 0) > 0 && data.guardiasOS10 !== 'SI') {
    add(
      'ALTA',
      'Seguridad humana',
      'Art. 22 Ley 21.659 / OS-10',
      `Personal de seguridad operando de manera irregular sin credencial OS10 habilitada (${data.guardias} guardias).`,
      'Fiscalizar prioritariamente la vigencia de las acreditaciones ante Carabineros e iniciar cursos de perfeccionamiento institucional inmediatos.',
      'Previene sanciones de gran escala aplicadas directamente a la empresa mandante.',
      'Empresa de seguridad / RR.HH',
      '15 días hábiles',
      'Credenciales OS-10 vigentes.'
    );
  }

  // 6. Puntos Ciegos
  if (Number(data.cantidadPuntosCiegos || 0) > 2) {
    add(
      'ALTA',
      'Cobertura visual',
      'Art. 17 DS 209',
      `Se constatan ${data.cantidadPuntosCiegos} puntos ciegos importantes en zonas sensibles.`,
      'Iluminar permanentemente los sectores umbrios, re-orientar cámaras activas, e instalar espejos parabólicos.',
      'Los puntos sin cobertura reducen de manera drástica la disuasión mecánica global del terreno.',
      'Encargado de Seguridad',
      '30 días corridos',
      'Fotomuestreo comparativo antes y después de la corrección.'
    );
  }

  // 7. Cierre perimetral
  if (data.estadoCierre === 'Deficiente (daños, brechas)' || data.estadoCierre === 'Sin cierre perimetral' || textIsShort(data.cierrePerimetral)) {
    add(
      'MEDIA',
      'Seguridad física',
      'Art. 15 DS 209',
      `Estado del cierre físico exterior es deficiente (${data.estadoCierre || 'No reportado'}).`,
      'Ejecutar cierres fijos estructurados con altura uniforme no menor a 2.5 metros e incorporar concertinas o sensores perimetrales activos.',
      'El perímetro es la primera valla disuasiva para retardar la intrusión por escalamiento.',
      'Servicios de Ingeniería / Mantención',
      '30 días corridos',
      'Acta de recepción final de obras de reforzamiento.'
    );
  }

  // 8. Iluminacion
  if (data.nivelIluminacion === 'Deficiente (zonas oscuras)' || data.nivelIluminacion === 'Sin iluminación') {
    add(
      'MEDIA',
      'Seguridad física',
      'Art. 15 DS 209',
      'La iluminación general en perímetros y zonas de carga y descarga es deficiente.',
      'Instalar proyectores LED de alta gama de 100W con encendido por fotocélula automática y sensores de presencia.',
      'La oscuridad dificulta las rondas del personal e inhabilita las capacidades infrarrojas del CCTV tradicional.',
      'Mantenimiento Eléctrico',
      '20 días corridos',
      'Informe fotométrico lumínico nocturno satisfactorio.'
    );
  }

  // 9. Protocolos
  const missingProts: string[] = [];
  if (data.protocoloApertura !== 'SI') missingProts.push('Apertura y Cierre');
  if (data.protocoloRobo !== 'SI') missingProts.push('Asaltos/Robos');
  if (data.protocoloAlarma !== 'SI') missingProts.push('Reacción ante Alarma');
  if (data.protocoloVisitas !== 'SI') missingProts.push('Acceso de Proveedores');
  if (data.protocoloValores !== 'SI') missingProts.push('Manejo de Valores');

  if (missingProts.length > 0) {
    add(
      'MEDIA',
      'Protocolos operativos',
      'Art. 9° DS 209',
      `Carencia de protocolos oficiales formalizados: ${missingProts.join(', ')}.`,
      'Redactar de forma detallada, someter a aprobación de gerencia técnica, datar y difundir mediante capacitación interna el contenido de los protocolos ausentes.',
      'La coherencia táctica en emergencias depende del entrenamiento riguroso de todo el personal basándose en manuales de respuesta.',
      'Encargado de Seguridad',
      '20 días corridos',
      'Manuales aprobados y difusión firmada.'
    );
  }

  if (result.length === 0) {
    add(
      'BAJA',
      'Mejora continua',
      'Art. 4° Ley 21.659',
      'No se registran brechas inmediatas severas de seguridad exterior.',
      'Realizar auditorías periódicas de calibración tecnológica y repasar los tiempos de respuesta de Carabineros.',
      'Se debe garantizar la adaptabilidad continua frente a sofisticaciones del mercado delictivo regional.',
      'Encargado de Seguridad',
      'Trimestral',
      'Informe trimestral de bitácora general de mantenimiento.'
    );
  }

  return result.sort((a, b) => {
    const weights: Record<string, number> = { 'ALTA': 1, 'MEDIA': 2, 'BAJA': 3 };
    return (weights[a.prioridad] || 9) - (weights[b.prioridad] || 9);
  });
};

export const generateDS209Protocols = (data: RiskData): DS209Protocol[] => {
  const fechaStr = new Date().toISOString().slice(0, 10);
  const idEntidad = data.id || 'ENT-DEMO';

  const protocols = [
    {
      nombre: 'Protocolo de Apertura y Cierre',
      contenido: 'Designación de personal autorizado con doble control, desactivación de alarmas, rampa de comunicación inicial con CCTV perimetral antes de ingreso y reporte a central.',
      obs: data.protocoloApertura === 'SI' ? '✓ VIGENTE Y OPERATIVO EN SITIO' : '✗ POR REDACTAR E IMPLEMENTAR'
    },
    {
      nombre: 'Protocolo de Emergencias (Robo con Violencia)',
      contenido: 'Pautas de no resistencia física, resguardo prioritario de vidas, activación silenciosa de botonera de pánico, y aislamiento forense inmediato de pruebas e indicios post-evento.',
      obs: data.protocoloRobo === 'SI' ? '✓ VIGENTE Y OPERATIVO EN SITIO' : '✗ POR REDACTAR E IMPLEMENTAR'
    },
    {
      nombre: 'Protocolo de Activación y Respuesta ante Alarmas',
      contenido: 'Mapeo de zonas calientes, plazos máximos para verificación fáctica (inspección silenciosa por cámaras), claves secretas telefónicas para descartar falsas alarmas, y aviso preferencial a Carabineros.',
      obs: data.protocoloAlarma === 'SI' ? '✓ VIGENTE Y OPERATIVO EN SITIO' : '✗ POR REDACTAR E IMPLEMENTAR'
    },
    {
      nombre: 'Protocolo de Control e Identificación de Visitas',
      contenido: 'Requisito de control biométrico o cédula de identidad, registro digital de patente, y asignación de pases temporales con escolta requerida para zonas con activos estratégicos.',
      obs: data.protocoloVisitas === 'SI' ? '✓ VIGENTE Y OPERATIVO EN SITIO' : '✗ POR REDACTAR E IMPLEMENTAR'
    },
    {
      nombre: 'Protocolo de Recaudación y Custodia de Efectivo',
      contenido: 'Arqueo de cajas en recintos blindados blind-pocket, doble firma obligatoria, recolecciones con transportadora externa autorizada en horarios variables e inyección directa a bóveda.',
      obs: data.protocoloValores === 'SI' ? '✓ VIGENTE Y OPERATIVO EN SITIO' : '✗ POR REDACTAR E IMPLEMENTAR'
    }
  ];

  return protocols.map((p, idx) => ({
    idProtocolo: `PROT-0${idx + 1}`,
    idEntidad,
    fecha: fechaStr,
    nombreProtocolo: p.nombre,
    estado: p.obs.includes('VIGENTE') ? 'VIGENTE' : 'PENDIENTE / EXIGIBLE',
    contenidoMinimo: p.contenido,
    responsable: 'Encargado de Seguridad',
    observacion: p.obs
  }));
};